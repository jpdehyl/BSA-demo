import { Page } from 'puppeteer-core';
import { scrapeWithRateLimit, autoScroll, waitForSelectorSafe, ScrapeResult } from '../browserlessClient.js';

export interface LinkedInExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface LinkedInEducation {
  school: string;
  degree: string;
  dates: string;
}

export interface LinkedInActivity {
  type: 'post' | 'comment' | 'reaction';
  content: string;
  date: string;
}

export interface LinkedInProfileData {
  name: string;
  headline: string;
  location: string;
  about: string;
  currentRole: LinkedInExperience;
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  recentActivity: LinkedInActivity[];
  recommendations: number;
  connections: string;
  profileUrl: string;
}

/**
 * Scrape LinkedIn profile page for contact intelligence
 */
export async function scrapeLinkedInProfile(
  profileUrl: string
): Promise<ScrapeResult<LinkedInProfileData>> {
  // Ensure URL is a LinkedIn profile
  if (!profileUrl.includes('linkedin.com/in/')) {
    return {
      data: null,
      error: 'Invalid LinkedIn profile URL',
    };
  }

  return scrapeWithRateLimit(profileUrl, async (page: Page) => {
    // Wait for profile to load
    const loaded = await waitForSelectorSafe(page, '.pv-top-card, .profile-view-grid', 15000);
    if (!loaded) {
      throw new Error('LinkedIn profile page did not load');
    }

    // Scroll to load lazy content
    await autoScroll(page);

    const data = await page.evaluate((url: string) => {
      // Helper functions
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };

      // Basic info - try multiple selector patterns
      const name =
        getText('.pv-top-card--list .text-heading-xlarge') ||
        getText('.pv-text-details__left-panel h1') ||
        getText('.top-card-layout__title') ||
        '';

      const headline =
        getText('.pv-top-card--list .text-body-medium') ||
        getText('.pv-text-details__left-panel .text-body-medium') ||
        getText('.top-card-layout__headline') ||
        '';

      const location =
        getText('.pv-top-card--list .text-body-small') ||
        getText('.pv-text-details__left-panel .text-body-small') ||
        getText('.top-card-layout__first-subline') ||
        '';

      const about =
        getText('.pv-about-section .pv-about__summary-text') ||
        getText('.pv-shared-text-with-see-more') ||
        getText('#about ~ .display-flex .pv-shared-text-with-see-more') ||
        '';

      // Experience - try multiple selectors
      const experienceItems = document.querySelectorAll(
        '.experience-section .pv-entity__position-group-pager, ' +
        '.pvs-list__item--line-separated, ' +
        '#experience ~ .pvs-list .pvs-entity'
      );

      const experience: LinkedInExperience[] = [];
      experienceItems.forEach((exp) => {
        const title =
          exp.querySelector('.pv-entity__summary-info h3, .t-bold span[aria-hidden="true"]')
            ?.textContent?.trim() || '';
        const company =
          exp.querySelector('.pv-entity__secondary-title, .t-normal span[aria-hidden="true"]')
            ?.textContent?.trim() || '';
        const duration =
          exp.querySelector('.pv-entity__date-range span:nth-child(2), .pvs-entity__caption-wrapper')
            ?.textContent?.trim() || '';
        const description =
          exp.querySelector('.pv-entity__description, .pvs-list__item--with-top-padding .t-normal')
            ?.textContent?.trim() || '';

        if (title || company) {
          experience.push({ title, company, duration, description });
        }
      });

      // Current role is first experience
      const currentRole = experience[0] || { title: '', company: '', duration: '', description: '' };

      // Education
      const educationItems = document.querySelectorAll(
        '.education-section .pv-entity__degree-info, ' +
        '#education ~ .pvs-list .pvs-entity'
      );

      const education: LinkedInEducation[] = [];
      educationItems.forEach((edu) => {
        const school =
          edu.querySelector('.pv-entity__school-name, .t-bold span[aria-hidden="true"]')
            ?.textContent?.trim() || '';
        const degree =
          edu.querySelector('.pv-entity__degree-name span:nth-child(2), .t-normal span[aria-hidden="true"]')
            ?.textContent?.trim() || '';
        const dates =
          edu.querySelector('.pv-entity__dates span:nth-child(2), .pvs-entity__caption-wrapper')
            ?.textContent?.trim() || '';

        if (school) {
          education.push({ school, degree, dates });
        }
      });

      // Skills - try multiple selectors
      const skillElements = document.querySelectorAll(
        '.pv-skill-category-entity__name, ' +
        '.pv-skill-entity__skill-name, ' +
        '#skills ~ .pvs-list .t-bold span[aria-hidden="true"]'
      );

      const skills = Array.from(skillElements)
        .map((el) => el.textContent?.trim() || '')
        .filter(Boolean)
        .slice(0, 20);

      // Connections count
      const connections =
        getText('.pv-top-card--list .t-bold') ||
        getText('.pv-text-details__left-panel .t-bold') ||
        '';

      // Recent activity would require navigating to Activity tab
      // Leaving empty for now to avoid extra navigation
      const recentActivity: LinkedInActivity[] = [];

      return {
        name,
        headline,
        location,
        about,
        currentRole,
        experience: experience.slice(0, 5), // Limit to 5 most recent
        education: education.slice(0, 3), // Limit to 3
        skills,
        recentActivity,
        recommendations: 0,
        connections,
        profileUrl: url,
      };
    }, profileUrl);

    // Validate we got meaningful data
    if (!data.name) {
      throw new Error('Failed to extract profile name from LinkedIn page');
    }

    return data;
  });
}

/**
 * Format LinkedIn profile data for display in research dossier
 */
export function formatLinkedInProfileData(data: LinkedInProfileData | null): string {
  if (!data) {
    return 'LinkedIn profile data not available';
  }

  const sections: string[] = [];

  sections.push(`## LinkedIn Profile: ${data.name}`);
  if (data.headline) sections.push(`*${data.headline}*`);
  if (data.location) sections.push(`Location: ${data.location}`);
  sections.push('');

  if (data.about) {
    sections.push('### About');
    sections.push(data.about.substring(0, 500) + (data.about.length > 500 ? '...' : ''));
    sections.push('');
  }

  if (data.currentRole.title || data.currentRole.company) {
    sections.push('### Current Role');
    sections.push(`**${data.currentRole.title}** at ${data.currentRole.company}`);
    if (data.currentRole.duration) sections.push(`Duration: ${data.currentRole.duration}`);
    if (data.currentRole.description) {
      const preview =
        data.currentRole.description.substring(0, 200) +
        (data.currentRole.description.length > 200 ? '...' : '');
      sections.push(preview);
    }
    sections.push('');
  }

  if (data.experience.length > 1) {
    sections.push('### Experience');
    for (const exp of data.experience.slice(1, 4)) {
      sections.push(`- **${exp.title}** at ${exp.company} (${exp.duration})`);
    }
    sections.push('');
  }

  if (data.education.length > 0) {
    sections.push('### Education');
    for (const edu of data.education) {
      sections.push(`- ${edu.school}${edu.degree ? ` - ${edu.degree}` : ''}`);
    }
    sections.push('');
  }

  if (data.skills.length > 0) {
    sections.push('### Top Skills');
    sections.push(data.skills.slice(0, 10).join(', '));
    sections.push('');
  }

  if (data.connections) {
    sections.push(`**Connections:** ${data.connections}`);
  }

  return sections.join('\n');
}
