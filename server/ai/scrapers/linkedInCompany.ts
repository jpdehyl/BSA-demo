import { Page } from 'puppeteer-core';
import { scrapeWithRateLimit, autoScroll, waitForSelectorSafe, ScrapeResult } from '../browserlessClient.js';

export interface LinkedInCompanyPost {
  content: string;
  date: string;
  engagement: string;
}

export interface LinkedInCompanyData {
  name: string;
  tagline: string;
  industry: string;
  companySize: string;
  headquarters: string;
  founded: string;
  specialties: string[];
  about: string;
  recentPosts: LinkedInCompanyPost[];
  employeeCount: string;
  followerCount: string;
  jobOpenings: number;
  websiteUrl: string;
  linkedInUrl: string;
}

/**
 * Scrape LinkedIn company page for detailed company intelligence
 */
export async function scrapeLinkedInCompany(
  companyUrl: string
): Promise<ScrapeResult<LinkedInCompanyData>> {
  // Ensure URL is a LinkedIn company page
  if (!companyUrl.includes('linkedin.com/company')) {
    return {
      data: null,
      error: 'Invalid LinkedIn company URL',
    };
  }

  return scrapeWithRateLimit(companyUrl, async (page: Page) => {
    // Wait for main content to load
    const loaded = await waitForSelectorSafe(page, '.org-top-card, .organization-outlet', 15000);
    if (!loaded) {
      throw new Error('LinkedIn company page did not load');
    }

    // Scroll to load lazy content
    await autoScroll(page);

    const data = await page.evaluate((url: string) => {
      // Helper functions
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };

      const getTexts = (selector: string): string[] => {
        return Array.from(document.querySelectorAll(selector))
          .map((el) => el.textContent?.trim() || '')
          .filter(Boolean);
      };

      // Extract company info - try multiple selector patterns for different LinkedIn layouts
      const name =
        getText('.org-top-card-summary__title') ||
        getText('.top-card-layout__title') ||
        getText('h1') ||
        '';

      const tagline =
        getText('.org-top-card-summary__tagline') ||
        getText('.top-card-layout__headline') ||
        '';

      const about =
        getText('.org-about-us-organization-description__text') ||
        getText('.about-us-organization-description__text') ||
        getText('[data-test-id="about-us__description"]') ||
        '';

      // Extract details from sidebar - handle different LinkedIn layouts
      const details: Record<string, string> = {};

      // Try the standard org-page-details format
      document.querySelectorAll('.org-page-details__definition-term').forEach((term, i) => {
        const valueEl = document.querySelectorAll('.org-page-details__definition-text')[i];
        if (term && valueEl) {
          const key = term.textContent?.trim() || '';
          const value = valueEl.textContent?.trim() || '';
          if (key) details[key] = value;
        }
      });

      // Try alternate format with dt/dd pairs
      document.querySelectorAll('dl dt').forEach((term) => {
        const valueEl = term.nextElementSibling;
        if (valueEl && valueEl.tagName === 'DD') {
          const key = term.textContent?.trim() || '';
          const value = valueEl.textContent?.trim() || '';
          if (key) details[key] = value;
        }
      });

      // Extract recent posts
      const posts = Array.from(
        document.querySelectorAll('.org-update-card, .feed-shared-update-v2')
      )
        .slice(0, 5)
        .map((post) => ({
          content:
            post.querySelector('.update-components-text, .feed-shared-text')?.textContent?.trim() ||
            '',
          date:
            post.querySelector('.update-components-actor__sub-description, .feed-shared-actor__sub-description')?.textContent?.trim() ||
            '',
          engagement:
            post.querySelector('.social-details-social-counts, .social-details-social-activity')?.textContent?.trim() ||
            '',
        }));

      // Extract employee and follower counts
      const employeeCount =
        getText('.org-top-card-summary-info-list__info-item') ||
        getText('.face-pile__text') ||
        '';

      const followerCount =
        getText('.org-top-card-summary-info-list__followers-count') ||
        getText('[data-test-id="about-us__followers"]') ||
        '';

      // Job openings count
      const jobsText =
        getText('.org-jobs-job-search-form-module__headline') ||
        getText('[data-test-id="org-jobs-module__headline"]') ||
        '0';
      const jobOpenings = parseInt(jobsText.replace(/\D/g, '')) || 0;

      // Website URL
      const websiteLink = document.querySelector(
        '.org-top-card-primary-actions__inner a[href*="http"], .link-without-visited-state[href*="http"]'
      ) as HTMLAnchorElement | null;
      const websiteUrl = websiteLink?.href || '';

      // Parse specialties
      const specialtiesText = details['Specialties'] || details['Specializations'] || '';
      const specialties = specialtiesText
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        name,
        tagline,
        about,
        industry: details['Industry'] || '',
        companySize: details['Company size'] || details['Size'] || '',
        headquarters: details['Headquarters'] || details['Location'] || '',
        founded: details['Founded'] || '',
        specialties,
        recentPosts: posts,
        employeeCount,
        followerCount,
        jobOpenings,
        websiteUrl,
        linkedInUrl: url,
      };
    }, companyUrl);

    // Validate we got meaningful data
    if (!data.name) {
      throw new Error('Failed to extract company name from LinkedIn page');
    }

    return data;
  });
}

/**
 * Build LinkedIn company URL from company name
 */
export function buildLinkedInCompanyUrl(companyName: string): string {
  // Normalize company name for URL
  const normalized = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `https://www.linkedin.com/company/${normalized}/`;
}

/**
 * Format LinkedIn company data for display in research dossier
 */
export function formatLinkedInCompanyData(data: LinkedInCompanyData | null): string {
  if (!data) {
    return 'LinkedIn company data not available';
  }

  const sections: string[] = [];

  sections.push(`## LinkedIn Company Profile: ${data.name}`);
  if (data.tagline) sections.push(`*${data.tagline}*`);
  sections.push('');

  if (data.about) {
    sections.push('### About');
    sections.push(data.about.substring(0, 500) + (data.about.length > 500 ? '...' : ''));
    sections.push('');
  }

  sections.push('### Company Details');
  if (data.industry) sections.push(`- **Industry:** ${data.industry}`);
  if (data.companySize) sections.push(`- **Company Size:** ${data.companySize}`);
  if (data.headquarters) sections.push(`- **Headquarters:** ${data.headquarters}`);
  if (data.founded) sections.push(`- **Founded:** ${data.founded}`);
  if (data.employeeCount) sections.push(`- **Employees:** ${data.employeeCount}`);
  if (data.followerCount) sections.push(`- **Followers:** ${data.followerCount}`);
  if (data.jobOpenings > 0) sections.push(`- **Open Jobs:** ${data.jobOpenings}`);
  sections.push('');

  if (data.specialties.length > 0) {
    sections.push('### Specialties');
    sections.push(data.specialties.join(', '));
    sections.push('');
  }

  if (data.recentPosts.length > 0) {
    sections.push('### Recent Posts');
    for (const post of data.recentPosts.slice(0, 3)) {
      if (post.content) {
        const preview = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');
        sections.push(`- ${preview}`);
        if (post.date) sections.push(`  *${post.date}*`);
      }
    }
    sections.push('');
  }

  return sections.join('\n');
}
