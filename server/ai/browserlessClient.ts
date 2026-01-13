import puppeteer, { Browser, Page } from 'puppeteer-core';
import pLimit from 'p-limit';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const BROWSERLESS_URL = process.env.BROWSERLESS_BASE_URL || 'chrome.browserless.io';

// Rate limit to 5 concurrent Browserless sessions
const browserlessLimit = pLimit(5);

// Simple in-memory cache (24 hour TTL)
const scrapeCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface BrowserlessOptions {
  stealth?: boolean;
  proxy?: 'residential' | 'datacenter' | 'none';
  blockAds?: boolean;
  timeout?: number;
}

export interface ScrapeResult<T> {
  data: T | null;
  error?: string;
  cached?: boolean;
  duration?: number;
}

/**
 * Check if Browserless.io is configured
 */
export function isBrowserlessConfigured(): boolean {
  return !!BROWSERLESS_API_KEY;
}

/**
 * Create a Browserless session with configurable options
 */
export async function createBrowserlessSession(options: BrowserlessOptions = {}): Promise<Browser> {
  if (!BROWSERLESS_API_KEY) {
    throw new Error('BROWSERLESS_API_KEY is not configured');
  }

  const {
    stealth = true,
    proxy = 'residential',
    blockAds = true,
    timeout = 60000,
  } = options;

  const params = new URLSearchParams({
    token: BROWSERLESS_API_KEY,
    stealth: String(stealth),
    blockAds: String(blockAds),
    timeout: String(timeout),
  });

  if (proxy !== 'none') {
    params.set('proxy', proxy);
  }

  const wsEndpoint = `wss://${BROWSERLESS_URL}?${params.toString()}`;

  console.log(`[Browserless] Connecting to session (stealth: ${stealth}, proxy: ${proxy})`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
  });

  return browser;
}

/**
 * Scrape a URL using Browserless with automatic session management
 */
export async function scrapeWithBrowserless<T>(
  url: string,
  scraper: (page: Page) => Promise<T>,
  options?: BrowserlessOptions
): Promise<T> {
  const startTime = Date.now();
  let browser: Browser | null = null;

  console.log(`[Browserless] Starting scrape: ${url}`);

  try {
    browser = await createBrowserlessSession(options);
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set extra headers to appear more natural
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Execute custom scraper function
    const result = await scraper(page);

    const duration = Date.now() - startTime;
    console.log(`[Browserless] Scrape completed: ${url} (${duration}ms)`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Browserless] Scrape failed: ${url} (${duration}ms) - ${errorMessage}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Rate-limited scrape with caching
 */
export async function scrapeWithRateLimit<T>(
  url: string,
  scraper: (page: Page) => Promise<T>,
  options?: BrowserlessOptions & { skipCache?: boolean }
): Promise<ScrapeResult<T>> {
  const cacheKey = `browserless:${url}`;
  const startTime = Date.now();

  // Check cache first
  if (!options?.skipCache) {
    const cached = scrapeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Browserless] Cache hit: ${url}`);
      return {
        data: cached.data as T,
        cached: true,
        duration: Date.now() - startTime,
      };
    }
  }

  // Rate-limited scrape
  return browserlessLimit(async () => {
    try {
      const data = await scrapeWithBrowserless(url, scraper, options);

      // Cache the result
      scrapeCache.set(cacheKey, { data, timestamp: Date.now() });

      return {
        data,
        cached: false,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        data: null,
        error: errorMessage,
        cached: false,
        duration: Date.now() - startTime,
      };
    }
  });
}

/**
 * Helper function to scroll and load lazy content
 */
export async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const maxScrolls = 20; // Limit scrolls to prevent infinite loops
      let scrollCount = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;

        if (totalHeight >= scrollHeight - window.innerHeight || scrollCount >= maxScrolls) {
          clearInterval(timer);
          // Scroll back to top
          window.scrollTo(0, 0);
          resolve();
        }
      }, 200);
    });
  });
}

/**
 * Wait for a selector with fallback
 */
export async function waitForSelectorSafe(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract text safely from a selector
 */
export async function extractText(page: Page, selector: string): Promise<string> {
  try {
    const element = await page.$(selector);
    if (!element) return '';
    const text = await element.evaluate((el) => el.textContent?.trim() || '');
    return text;
  } catch {
    return '';
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  const now = Date.now();
  let cleared = 0;

  for (const [key, value] of scrapeCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      scrapeCache.delete(key);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`[Browserless] Cleared ${cleared} expired cache entries`);
  }

  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; oldestEntry: number | null } {
  let oldestTimestamp: number | null = null;

  for (const value of scrapeCache.values()) {
    if (oldestTimestamp === null || value.timestamp < oldestTimestamp) {
      oldestTimestamp = value.timestamp;
    }
  }

  return {
    size: scrapeCache.size,
    oldestEntry: oldestTimestamp ? Date.now() - oldestTimestamp : null,
  };
}
