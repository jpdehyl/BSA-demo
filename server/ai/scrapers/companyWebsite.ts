import { Page } from 'puppeteer-core';
import { scrapeWithRateLimit, waitForSelectorSafe, autoScroll, ScrapeResult } from '../browserlessClient.js';

export interface LeadershipPerson {
  name: string;
  title: string;
}

export interface CompanyWebsiteData {
  homepage: {
    title: string;
    description: string;
    heroMessage: string;
    primaryCTA: string;
  };
  about: {
    mission: string;
    values: string[];
    leadership: LeadershipPerson[];
    founded: string;
    employees: string;
  };
  products: Array<{
    name: string;
    description: string;
    features: string[];
  }>;
  caseStudies: Array<{
    title: string;
    industry: string;
    summary: string;
  }>;
  blog: Array<{
    title: string;
    date: string;
    summary: string;
    topics: string[];
  }>;
  techStack: string[];
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  url: string;
}

// Tech stack signatures to detect from page source
const TECH_SIGNATURES: Record<string, string[]> = {
  'React': ['react', '_reactRootContainer', 'data-reactroot', 'data-react'],
  'Vue.js': ['vue', '__vue__', 'data-v-'],
  'Angular': ['ng-', 'angular', 'ng-version'],
  'WordPress': ['wp-content', 'wp-includes', 'wordpress'],
  'Shopify': ['shopify', 'cdn.shopify'],
  'HubSpot': ['hubspot', 'hs-scripts', 'hbspt'],
  'Salesforce': ['salesforce', 'pardot', 'sfdc'],
  'Google Analytics': ['google-analytics', 'gtag', 'ga.js', 'googletagmanager'],
  'Google Tag Manager': ['googletagmanager', 'gtm.js'],
  'Segment': ['segment', 'analytics.js', 'cdn.segment'],
  'Intercom': ['intercom', 'intercomcdn'],
  'Drift': ['drift', 'driftt'],
  'Marketo': ['marketo', 'munchkin', 'mktoForms'],
  'Cloudflare': ['cloudflare', '__cf_bm'],
  'AWS': ['amazonaws', 'cloudfront'],
  'Azure': ['azure', 'azureedge', 'windows.net'],
  'Stripe': ['stripe', 'js.stripe'],
  'Zendesk': ['zendesk', 'zdassets'],
  'Hotjar': ['hotjar', 'static.hotjar'],
  'Mixpanel': ['mixpanel', 'cdn.mxpnl'],
};

/**
 * Detect tech stack from HTML content
 */
function detectTechStack(html: string): string[] {
  const detected: string[] = [];
  const lowerHtml = html.toLowerCase();

  for (const [tech, patterns] of Object.entries(TECH_SIGNATURES)) {
    if (patterns.some((p) => lowerHtml.includes(p.toLowerCase()))) {
      detected.push(tech);
    }
  }

  return detected;
}

/**
 * Deep scrape a company website for comprehensive intelligence
 */
export async function scrapeCompanyWebsite(
  websiteUrl: string
): Promise<ScrapeResult<CompanyWebsiteData>> {
  // Ensure URL has protocol
  let url = websiteUrl;
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }

  return scrapeWithRateLimit(url, async (page: Page) => {
    // Wait for page to load
    await waitForSelectorSafe(page, 'body', 15000);

    const data: CompanyWebsiteData = {
      homepage: { title: '', description: '', heroMessage: '', primaryCTA: '' },
      about: { mission: '', values: [], leadership: [], founded: '', employees: '' },
      products: [],
      caseStudies: [],
      blog: [],
      techStack: [],
      contactInfo: { email: '', phone: '', address: '' },
      socialLinks: {},
      url,
    };

    // Get page content for tech stack detection
    const pageContent = await page.content();
    data.techStack = detectTechStack(pageContent);

    // Scrape homepage
    data.homepage = await page.evaluate(() => {
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };

      return {
        title: document.title || '',
        description:
          document.querySelector('meta[name="description"]')?.getAttribute('content') ||
          document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
          '',
        heroMessage:
          getText('h1') ||
          getText('.hero h1, .hero-title, [class*="hero"] h1, .banner h1') ||
          '',
        primaryCTA:
          getText('a.cta, a.btn-primary, a[href*="demo"], a[href*="contact"], a[href*="trial"], .hero a.btn, [class*="hero"] a.btn') ||
          '',
      };
    });

    // Extract social links
    data.socialLinks = await page.evaluate(() => {
      const links: Record<string, string> = {};
      const socialPatterns: Record<string, RegExp> = {
        linkedin: /linkedin\.com/i,
        twitter: /twitter\.com|x\.com/i,
        facebook: /facebook\.com/i,
        youtube: /youtube\.com/i,
      };

      document.querySelectorAll('a[href]').forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        for (const [platform, pattern] of Object.entries(socialPatterns)) {
          if (pattern.test(href) && !links[platform]) {
            links[platform] = href;
          }
        }
      });

      return links;
    });

    // Extract contact info from page
    data.contactInfo = await page.evaluate(() => {
      const pageText = document.body.innerText;

      // Extract email - look for common patterns
      const emailMatch = pageText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);

      // Extract phone - look for common patterns
      const phoneMatch = pageText.match(
        /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
      );

      return {
        email: emailMatch?.[0] || '',
        phone: phoneMatch?.[0] || '',
        address: '',
      };
    });

    // Try to find and scrape About page
    const aboutLink = await page.$('a[href*="about"], a[href*="company"], a[href*="who-we-are"]');
    if (aboutLink) {
      try {
        await Promise.all([
          aboutLink.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        ]);

        data.about = await page.evaluate(() => {
          const getText = (selector: string): string => {
            const el = document.querySelector(selector);
            return el?.textContent?.trim() || '';
          };

          // Try to find mission statement
          const mission =
            getText('.mission, [class*="mission"], [id*="mission"]') ||
            getText('section p, article p') ||
            '';

          // Try to find values
          const valueElements = document.querySelectorAll(
            '[class*="value"] h3, [class*="value"] h4, [class*="values"] li'
          );
          const values = Array.from(valueElements)
            .map((el) => el.textContent?.trim() || '')
            .filter(Boolean)
            .slice(0, 6);

          // Try to find leadership team
          const leadershipElements = document.querySelectorAll(
            '[class*="team"] [class*="member"], [class*="leadership"] [class*="person"], [class*="executive"], .team-member'
          );
          const leadership = Array.from(leadershipElements)
            .map((el) => ({
              name:
                el.querySelector('h3, h4, [class*="name"], .name')?.textContent?.trim() || '',
              title:
                el.querySelector('p, [class*="title"], [class*="role"], .title, .position')
                  ?.textContent?.trim() || '',
            }))
            .filter((l) => l.name)
            .slice(0, 6);

          return {
            mission: mission.substring(0, 500),
            values,
            leadership,
            founded: '',
            employees: '',
          };
        });

        // Navigate back to homepage for further scraping
        await page.goBack().catch(() => {});
      } catch {
        // Continue without about page data
      }
    }

    // Try to find products/services
    const productsLink = await page.$(
      'a[href*="product"], a[href*="service"], a[href*="solution"]'
    );
    if (productsLink) {
      try {
        await Promise.all([
          productsLink.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        ]);

        await autoScroll(page);

        const products = await page.evaluate(() => {
          const productElements = document.querySelectorAll(
            '[class*="product"], [class*="service"], [class*="solution"], .card, article'
          );

          return Array.from(productElements)
            .map((el) => ({
              name: el.querySelector('h2, h3, h4')?.textContent?.trim() || '',
              description: el.querySelector('p')?.textContent?.trim() || '',
              features: [] as string[],
            }))
            .filter((p) => p.name && p.description)
            .slice(0, 5);
        });

        data.products = products;
      } catch {
        // Continue without products data
      }
    }

    return data;
  });
}

/**
 * Format company website data for display in research dossier
 */
export function formatCompanyWebsiteData(data: CompanyWebsiteData | null): string {
  if (!data) {
    return 'Company website data not available';
  }

  const sections: string[] = [];

  sections.push(`## Website Analysis: ${data.url}`);
  sections.push('');

  // Homepage info
  if (data.homepage.title || data.homepage.heroMessage) {
    sections.push('### Homepage');
    if (data.homepage.title) sections.push(`**Title:** ${data.homepage.title}`);
    if (data.homepage.heroMessage)
      sections.push(`**Hero Message:** ${data.homepage.heroMessage}`);
    if (data.homepage.description)
      sections.push(
        `**Description:** ${data.homepage.description.substring(0, 200)}${data.homepage.description.length > 200 ? '...' : ''}`
      );
    if (data.homepage.primaryCTA) sections.push(`**Primary CTA:** ${data.homepage.primaryCTA}`);
    sections.push('');
  }

  // About info
  if (data.about.mission || data.about.leadership.length > 0) {
    sections.push('### About');
    if (data.about.mission)
      sections.push(
        data.about.mission.substring(0, 300) + (data.about.mission.length > 300 ? '...' : '')
      );
    sections.push('');

    if (data.about.leadership.length > 0) {
      sections.push('**Leadership Team:**');
      for (const leader of data.about.leadership.slice(0, 5)) {
        sections.push(`- ${leader.name}${leader.title ? ` - ${leader.title}` : ''}`);
      }
      sections.push('');
    }

    if (data.about.values.length > 0) {
      sections.push('**Values:** ' + data.about.values.join(', '));
      sections.push('');
    }
  }

  // Products
  if (data.products.length > 0) {
    sections.push('### Products/Services');
    for (const product of data.products.slice(0, 3)) {
      sections.push(`- **${product.name}:** ${product.description.substring(0, 100)}...`);
    }
    sections.push('');
  }

  // Tech stack
  if (data.techStack.length > 0) {
    sections.push('### Detected Tech Stack');
    sections.push(data.techStack.join(', '));
    sections.push('');
  }

  // Contact info
  if (data.contactInfo.email || data.contactInfo.phone) {
    sections.push('### Contact Information');
    if (data.contactInfo.email) sections.push(`- **Email:** ${data.contactInfo.email}`);
    if (data.contactInfo.phone) sections.push(`- **Phone:** ${data.contactInfo.phone}`);
    sections.push('');
  }

  // Social links
  const socialLinks = Object.entries(data.socialLinks).filter(([, url]) => url);
  if (socialLinks.length > 0) {
    sections.push('### Social Media');
    for (const [platform, socialUrl] of socialLinks) {
      sections.push(`- **${platform.charAt(0).toUpperCase() + platform.slice(1)}:** ${socialUrl}`);
    }
  }

  return sections.join('\n');
}
