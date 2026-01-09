/**
 * Playwright Screenshot Utility for UX Agent
 *
 * Captures screenshots of pages for visual analysis
 */

import { chromium, Browser, Page } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ScreenshotOptions {
  url: string;
  name?: string;
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  waitForSelector?: string;
  outputDir?: string;
}

/**
 * Capture a screenshot of a page
 */
export async function captureScreenshot(options: ScreenshotOptions): Promise<string> {
  const {
    url,
    name = 'screenshot',
    viewport = { width: 1280, height: 720 },
    fullPage = false,
    waitForSelector,
    outputDir = 'screenshots',
  } = options;

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage({ viewport });

  try {
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for specific element if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = join(outputDir, filename);

    // Capture screenshot
    await page.screenshot({
      path: filepath,
      fullPage,
    });

    console.log(`✅ Screenshot saved: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Capture screenshots of multiple pages
 */
export async function captureMultipleScreenshots(
  pages: Array<{ url: string; name: string }>
): Promise<string[]> {
  const results: string[] = [];

  for (const page of pages) {
    try {
      const filepath = await captureScreenshot({
        url: page.url,
        name: page.name,
      });
      results.push(filepath);
    } catch (error) {
      console.error(`Failed to capture ${page.name}:`, error);
    }
  }

  return results;
}

/**
 * Capture responsive screenshots (mobile, tablet, desktop)
 */
export async function captureResponsiveScreenshots(url: string, name: string): Promise<string[]> {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ];

  const results: string[] = [];

  for (const viewport of viewports) {
    try {
      const filepath = await captureScreenshot({
        url,
        name: `${name}-${viewport.name}`,
        viewport: { width: viewport.width, height: viewport.height },
        fullPage: true,
      });
      results.push(filepath);
    } catch (error) {
      console.error(`Failed to capture ${viewport.name}:`, error);
    }
  }

  return results;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npm run screenshot <url> [name] [--full-page] [--mobile] [--tablet] [--desktop] [--responsive]

Examples:
  npm run screenshot http://localhost:5000/leads "leads-page"
  npm run screenshot http://localhost:5000/dashboard "dashboard" --full-page
  npm run screenshot http://localhost:5000/coaching "coaching" --responsive
    `);
    process.exit(1);
  }

  const url = args[0];
  const name = args[1] || 'page';
  const responsive = args.includes('--responsive');

  (async () => {
    if (responsive) {
      await captureResponsiveScreenshots(url, name);
    } else {
      await captureScreenshot({
        url,
        name,
        fullPage: args.includes('--full-page'),
      });
    }
  })();
}
