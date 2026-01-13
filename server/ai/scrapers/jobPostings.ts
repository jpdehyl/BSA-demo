import { Page } from 'puppeteer-core';
import { scrapeWithRateLimit, waitForSelectorSafe, autoScroll, ScrapeResult } from '../browserlessClient.js';

export interface JobPosting {
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string[];
  postedDate: string;
  painSignals: string[];
}

export interface JobPostingsData {
  companyName: string;
  totalOpenings: number;
  jobs: JobPosting[];
  hiringVelocity: 'aggressive' | 'moderate' | 'stable';
  departmentBreakdown: Record<string, number>;
  techStack: string[];
  painSignals: string[];
  growthSignals: string[];
}

// Tech keywords to detect from job descriptions
const TECH_KEYWORDS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Azure', 'GCP',
  'Kubernetes', 'Docker', 'PostgreSQL', 'MongoDB', 'Salesforce', 'SAP', 'Oracle',
  'SOLIDWORKS', 'AutoCAD', 'Revit', 'CAD', 'CAM', 'PLM', 'PDM', 'ERP', 'CRM',
  'Inventor', 'Creo', 'NX', 'CATIA', 'Fusion 360', 'SolidEdge', 'MasterCAM',
  '3D printing', 'additive manufacturing', 'CNC', 'machining', 'simulation',
  'FEA', 'CFD', 'GD&T', 'DFM', 'DFMA', 'ISO 9001', 'AS9100', 'ITAR',
];

// Pain signal keywords that indicate business challenges
const PAIN_SIGNAL_KEYWORDS = [
  'scaling', 'growth', 'transformation', 'modernization', 'automation',
  'efficiency', 'streamline', 'optimize', 'migrate', 'upgrade', 'replace',
  'challenge', 'bottleneck', 'manual process', 'legacy', 'outdated',
  'integration', 'collaboration', 'data management', 'version control',
  'compliance', 'regulatory', 'quality control', 'time to market',
  'design cycle', 'prototype', 'reduce cost', 'improve productivity',
];

/**
 * Scrape LinkedIn Jobs page to analyze company hiring patterns
 */
export async function scrapeCompanyJobs(
  companyName: string
): Promise<ScrapeResult<JobPostingsData>> {
  // Build LinkedIn Jobs search URL
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companyName)}&location=`;

  return scrapeWithRateLimit(searchUrl, async (page: Page) => {
    // Wait for job results
    const loaded = await waitForSelectorSafe(
      page,
      '.jobs-search-results, .jobs-search-results-list, .scaffold-layout__list-container',
      15000
    );

    if (!loaded) {
      // Try alternate approach - direct company jobs page
      const companyJobsUrl = `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}/jobs/`;
      await page.goto(companyJobsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await waitForSelectorSafe(page, '.org-jobs-container, .jobs-unified-top-card', 10000);
    }

    // Scroll to load more jobs
    await autoScroll(page);

    const data = await page.evaluate(
      (techKeywords: string[], painKeywords: string[], company: string) => {
        const jobs: JobPosting[] = [];
        const departmentBreakdown: Record<string, number> = {};
        const techStackSet = new Set<string>();
        const painSignalsSet = new Set<string>();
        const growthSignalsSet = new Set<string>();

        // Function to categorize job by department
        const categorizeDepartment = (title: string): string => {
          const lower = title.toLowerCase();
          if (lower.includes('engineer') || lower.includes('developer') || lower.includes('software'))
            return 'Engineering';
          if (lower.includes('sales') || lower.includes('account') || lower.includes('business development'))
            return 'Sales';
          if (lower.includes('marketing') || lower.includes('brand') || lower.includes('content'))
            return 'Marketing';
          if (lower.includes('product') && !lower.includes('production'))
            return 'Product';
          if (lower.includes('design') || lower.includes('ux') || lower.includes('ui'))
            return 'Design';
          if (lower.includes('support') || lower.includes('success') || lower.includes('customer'))
            return 'Customer Success';
          if (lower.includes('hr') || lower.includes('people') || lower.includes('recruiting') || lower.includes('talent'))
            return 'HR';
          if (lower.includes('finance') || lower.includes('accounting') || lower.includes('controller'))
            return 'Finance';
          if (lower.includes('operations') || lower.includes('supply chain') || lower.includes('logistics'))
            return 'Operations';
          if (lower.includes('manufacturing') || lower.includes('production') || lower.includes('quality'))
            return 'Manufacturing';
          if (lower.includes('it') || lower.includes('infrastructure') || lower.includes('devops'))
            return 'IT';
          return 'Other';
        };

        // Function to extract tech stack and pain signals from text
        const analyzeText = (text: string) => {
          const lowerText = text.toLowerCase();

          // Check for tech keywords
          for (const tech of techKeywords) {
            if (lowerText.includes(tech.toLowerCase())) {
              techStackSet.add(tech);
            }
          }

          // Check for pain signals
          for (const pain of painKeywords) {
            if (lowerText.includes(pain.toLowerCase())) {
              painSignalsSet.add(pain);
            }
          }

          // Check for growth signals
          if (lowerText.includes('rapid growth') || lowerText.includes('fast-growing') || lowerText.includes('scaling'))
            growthSignalsSet.add('Rapid growth');
          if (lowerText.includes('expand') || lowerText.includes('expansion'))
            growthSignalsSet.add('Expansion');
          if (lowerText.includes('new team') || lowerText.includes('building team'))
            growthSignalsSet.add('Building new team');
          if (lowerText.includes('digital transformation'))
            growthSignalsSet.add('Digital transformation');
          if (lowerText.includes('innovation') || lowerText.includes('innovative'))
            growthSignalsSet.add('Innovation focus');
        };

        // Find job cards - try multiple selectors
        const jobCards = document.querySelectorAll(
          '.job-card-container, .jobs-search-results__list-item, .job-card-list, .scaffold-layout__list-item'
        );

        jobCards.forEach((card) => {
          const title =
            card.querySelector('.job-card-list__title, .job-card-container__link, .base-search-card__title')
              ?.textContent?.trim() || '';
          const location =
            card.querySelector('.job-card-container__metadata-item, .job-card-container__metadata-wrapper, .base-search-card__subtitle')
              ?.textContent?.trim() || '';
          const postedDate =
            card.querySelector('.job-card-container__footer-item, time')
              ?.textContent?.trim() || '';

          if (title) {
            // Categorize by department
            const dept = categorizeDepartment(title);
            departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;

            // Analyze job title for tech stack hints
            analyzeText(title);

            jobs.push({
              title,
              department: dept,
              location,
              description: '', // Would need to click into job for full description
              requirements: [],
              postedDate,
              painSignals: [],
            });
          }
        });

        // Determine hiring velocity
        const totalJobs = jobs.length;
        let hiringVelocity: 'aggressive' | 'moderate' | 'stable';
        if (totalJobs > 50) {
          hiringVelocity = 'aggressive';
          growthSignalsSet.add('Hiring aggressively (50+ open roles)');
        } else if (totalJobs > 20) {
          hiringVelocity = 'moderate';
          growthSignalsSet.add('Active hiring (20+ open roles)');
        } else {
          hiringVelocity = 'stable';
        }

        // Add department-specific signals
        if ((departmentBreakdown['Engineering'] || 0) > 10) {
          growthSignalsSet.add('Heavy engineering investment');
        }
        if ((departmentBreakdown['Sales'] || 0) > 5) {
          growthSignalsSet.add('Sales team expansion');
        }
        if ((departmentBreakdown['Manufacturing'] || 0) > 5) {
          growthSignalsSet.add('Manufacturing capacity growth');
        }

        return {
          companyName: company,
          totalOpenings: totalJobs,
          jobs: jobs.slice(0, 20), // Limit to first 20
          hiringVelocity,
          departmentBreakdown,
          techStack: Array.from(techStackSet),
          painSignals: Array.from(painSignalsSet),
          growthSignals: Array.from(growthSignalsSet),
        };
      },
      TECH_KEYWORDS,
      PAIN_SIGNAL_KEYWORDS,
      companyName
    );

    return data;
  });
}

/**
 * Format job postings data for display in research dossier
 */
export function formatJobPostingsData(data: JobPostingsData | null): string {
  if (!data) {
    return 'Job postings data not available';
  }

  const sections: string[] = [];

  sections.push(`## Job Postings Analysis: ${data.companyName}`);
  sections.push('');

  // Overview
  sections.push('### Hiring Overview');
  sections.push(`- **Total Open Positions:** ${data.totalOpenings}`);
  sections.push(`- **Hiring Velocity:** ${data.hiringVelocity.charAt(0).toUpperCase() + data.hiringVelocity.slice(1)}`);
  sections.push('');

  // Department breakdown
  if (Object.keys(data.departmentBreakdown).length > 0) {
    sections.push('### Department Breakdown');
    const sortedDepts = Object.entries(data.departmentBreakdown)
      .sort(([, a], [, b]) => b - a);
    for (const [dept, count] of sortedDepts) {
      const percentage = Math.round((count / data.totalOpenings) * 100);
      sections.push(`- **${dept}:** ${count} positions (${percentage}%)`);
    }
    sections.push('');
  }

  // Growth signals
  if (data.growthSignals.length > 0) {
    sections.push('### Growth Signals');
    for (const signal of data.growthSignals) {
      sections.push(`- ${signal}`);
    }
    sections.push('');
  }

  // Tech stack
  if (data.techStack.length > 0) {
    sections.push('### Tech Stack (from job postings)');
    sections.push(data.techStack.join(', '));
    sections.push('');
  }

  // Pain signals
  if (data.painSignals.length > 0) {
    sections.push('### Pain Signals (from job descriptions)');
    for (const pain of data.painSignals) {
      sections.push(`- ${pain}`);
    }
    sections.push('');
  }

  // Sample jobs
  if (data.jobs.length > 0) {
    sections.push('### Sample Open Positions');
    for (const job of data.jobs.slice(0, 5)) {
      sections.push(`- ${job.title}${job.location ? ` (${job.location})` : ''}`);
    }
  }

  return sections.join('\n');
}
