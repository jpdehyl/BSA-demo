# Browserless.io Integration Specification
## Enhanced Lead Intelligence Gathering

---

## Overview

This document outlines the integration of Browserless.io into the Lead Intel platform to enable deep web scraping for SDR research. Browserless provides headless Chrome as a service, handling proxy rotation, CAPTCHA solving, and scaling automatically.

---

## Architecture

### Current Research Flow

```
Lead Created
    │
    ▼
┌─────────────────────────────────────────────┐
│           Research Orchestrator              │
│         (server/ai/leadResearch.ts)          │
└─────────────────────────────────────────────┘
    │           │           │           │
    ▼           ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
│Website│  │LinkedIn│  │X/Twitter│ │Google │
│Scraper│  │  API   │  │  API   │ │ News  │
└───────┘  └───────┘  └───────┘  └───────┘
    │           │           │           │
    └───────────┴───────────┴───────────┘
                    │
                    ▼
            ┌─────────────┐
            │  Gemini AI  │
            │  Synthesis  │
            └─────────────┘
                    │
                    ▼
            Research Dossier
```

### Enhanced Flow with Browserless

```
Lead Created
    │
    ▼
┌─────────────────────────────────────────────┐
│           Research Orchestrator              │
│         (server/ai/leadResearch.ts)          │
└─────────────────────────────────────────────┘
    │
    ├─── Fast Path (APIs) ──────────────────────┐
    │                                           │
    ├─── Deep Path (Browserless) ───────┐       │
    │                                   │       │
    ▼                                   ▼       ▼
┌─────────────────────┐    ┌────────────────────────────────┐
│   Browserless.io    │    │     Existing API Sources       │
│   Headless Chrome   │    │  (News API, basic scraping)    │
├─────────────────────┤    └────────────────────────────────┘
│ • LinkedIn Profile  │                │
│ • LinkedIn Company  │                │
│ • Company Website   │                │
│ • Job Boards        │                │
│ • G2/Capterra       │                │
│ • Glassdoor         │                │
│ • News Articles     │                │
└─────────────────────┘                │
          │                            │
          └──────────┬─────────────────┘
                     │
                     ▼
             ┌─────────────┐
             │  Gemini AI  │
             │  Synthesis  │
             └─────────────┘
                     │
                     ▼
             Research Dossier
             (Enhanced Intel)
```

---

## Browserless.io Configuration

### Authentication

```typescript
// Environment variables
BROWSERLESS_API_KEY=your_api_key_here
BROWSERLESS_BASE_URL=https://chrome.browserless.io
```

### Connection Options

```typescript
// Basic connection
const browser = await puppeteer.connect({
  browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`,
});

// With stealth and proxy (recommended)
const browser = await puppeteer.connect({
  browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true&proxy=residential`,
});
```

### Browserless Features to Enable

| Feature | Purpose | Config |
|---------|---------|--------|
| **Stealth Mode** | Avoid bot detection | `&stealth=true` |
| **Residential Proxy** | Rotate IPs, avoid blocks | `&proxy=residential` |
| **Block Ads** | Faster page loads | `&blockAds=true` |
| **Timeout** | Prevent hanging | `&timeout=60000` |

---

## Implementation

### New Module: `server/ai/browserlessClient.ts`

```typescript
import puppeteer, { Browser, Page } from 'puppeteer-core';

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const BROWSERLESS_URL = process.env.BROWSERLESS_BASE_URL || 'chrome.browserless.io';

interface BrowserlessOptions {
  stealth?: boolean;
  proxy?: 'residential' | 'datacenter' | 'none';
  blockAds?: boolean;
  timeout?: number;
}

export async function createBrowserlessSession(options: BrowserlessOptions = {}): Promise<Browser> {
  const {
    stealth = true,
    proxy = 'residential',
    blockAds = true,
    timeout = 60000,
  } = options;

  const params = new URLSearchParams({
    token: BROWSERLESS_API_KEY!,
    stealth: String(stealth),
    blockAds: String(blockAds),
    timeout: String(timeout),
  });

  if (proxy !== 'none') {
    params.set('proxy', proxy);
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://${BROWSERLESS_URL}?${params.toString()}`,
  });

  return browser;
}

export async function scrapeWithBrowserless<T>(
  url: string,
  scraper: (page: Page) => Promise<T>,
  options?: BrowserlessOptions
): Promise<T> {
  const browser = await createBrowserlessSession(options);

  try {
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Execute custom scraper function
    const result = await scraper(page);

    return result;
  } finally {
    await browser.close();
  }
}
```

### LinkedIn Company Scraper: `server/ai/scrapers/linkedInCompany.ts`

```typescript
import { scrapeWithBrowserless } from '../browserlessClient';
import { Page } from 'puppeteer-core';

interface LinkedInCompanyData {
  name: string;
  tagline: string;
  industry: string;
  companySize: string;
  headquarters: string;
  founded: string;
  specialties: string[];
  about: string;
  recentPosts: Array<{
    content: string;
    date: string;
    engagement: string;
  }>;
  employeeCount: string;
  followerCount: string;
  jobOpenings: number;
  recentHires: string[];
}

export async function scrapeLinkedInCompany(companyUrl: string): Promise<LinkedInCompanyData> {
  return scrapeWithBrowserless(companyUrl, async (page: Page) => {
    // Wait for main content to load
    await page.waitForSelector('.org-top-card', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };

      const getTexts = (selector: string): string[] => {
        return Array.from(document.querySelectorAll(selector))
          .map(el => el.textContent?.trim() || '')
          .filter(Boolean);
      };

      // Extract company info
      const name = getText('.org-top-card-summary__title');
      const tagline = getText('.org-top-card-summary__tagline');
      const about = getText('.org-about-us-organization-description__text');

      // Extract details from sidebar
      const details: Record<string, string> = {};
      document.querySelectorAll('.org-page-details__definition-term').forEach((term, i) => {
        const value = document.querySelectorAll('.org-page-details__definition-text')[i];
        if (term && value) {
          details[term.textContent?.trim() || ''] = value.textContent?.trim() || '';
        }
      });

      // Extract recent posts
      const posts = Array.from(document.querySelectorAll('.org-update-card')).slice(0, 5).map(post => ({
        content: post.querySelector('.update-components-text')?.textContent?.trim() || '',
        date: post.querySelector('.update-components-actor__sub-description')?.textContent?.trim() || '',
        engagement: post.querySelector('.social-details-social-counts')?.textContent?.trim() || '',
      }));

      return {
        name,
        tagline,
        about,
        industry: details['Industry'] || '',
        companySize: details['Company size'] || '',
        headquarters: details['Headquarters'] || '',
        founded: details['Founded'] || '',
        specialties: (details['Specialties'] || '').split(',').map(s => s.trim()),
        recentPosts: posts,
        employeeCount: getText('.org-top-card-summary-info-list__info-item'),
        followerCount: getText('.org-top-card-summary-info-list__followers-count'),
        jobOpenings: parseInt(getText('.org-jobs-job-search-form-module__headline') || '0'),
        recentHires: [], // Would need to navigate to People tab
      };
    });

    return data;
  });
}
```

### LinkedIn Contact Scraper: `server/ai/scrapers/linkedInProfile.ts`

```typescript
import { scrapeWithBrowserless } from '../browserlessClient';
import { Page } from 'puppeteer-core';

interface LinkedInProfileData {
  name: string;
  headline: string;
  location: string;
  about: string;
  currentRole: {
    title: string;
    company: string;
    duration: string;
    description: string;
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    dates: string;
  }>;
  skills: string[];
  recentActivity: Array<{
    type: 'post' | 'comment' | 'reaction';
    content: string;
    date: string;
  }>;
  recommendations: number;
  connections: string;
}

export async function scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInProfileData> {
  return scrapeWithBrowserless(profileUrl, async (page: Page) => {
    // Wait for profile to load
    await page.waitForSelector('.pv-top-card', { timeout: 10000 });

    // Scroll to load lazy content
    await autoScroll(page);

    const data = await page.evaluate(() => {
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      };

      // Basic info
      const name = getText('.pv-top-card--list .text-heading-xlarge');
      const headline = getText('.pv-top-card--list .text-body-medium');
      const location = getText('.pv-top-card--list .text-body-small');
      const about = getText('.pv-about-section .pv-about__summary-text');

      // Experience
      const experience = Array.from(document.querySelectorAll('.experience-section .pv-entity__position-group')).map(exp => ({
        title: exp.querySelector('.pv-entity__summary-info h3')?.textContent?.trim() || '',
        company: exp.querySelector('.pv-entity__secondary-title')?.textContent?.trim() || '',
        duration: exp.querySelector('.pv-entity__date-range span:nth-child(2)')?.textContent?.trim() || '',
        description: exp.querySelector('.pv-entity__description')?.textContent?.trim() || '',
      }));

      // Current role is first experience
      const currentRole = experience[0] || { title: '', company: '', duration: '', description: '' };

      // Education
      const education = Array.from(document.querySelectorAll('.education-section .pv-entity__degree-info')).map(edu => ({
        school: edu.querySelector('.pv-entity__school-name')?.textContent?.trim() || '',
        degree: edu.querySelector('.pv-entity__degree-name span:nth-child(2)')?.textContent?.trim() || '',
        dates: edu.querySelector('.pv-entity__dates span:nth-child(2)')?.textContent?.trim() || '',
      }));

      // Skills
      const skills = Array.from(document.querySelectorAll('.pv-skill-category-entity__name'))
        .map(el => el.textContent?.trim() || '')
        .filter(Boolean)
        .slice(0, 20);

      // Connections count
      const connections = getText('.pv-top-card--list .t-bold');

      return {
        name,
        headline,
        location,
        about,
        currentRole,
        experience,
        education,
        skills,
        recentActivity: [], // Would need to navigate to Activity tab
        recommendations: 0,
        connections,
      };
    });

    return data;
  });
}

// Helper function to scroll and load lazy content
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
```

### Job Board Scraper: `server/ai/scrapers/jobPostings.ts`

```typescript
import { scrapeWithBrowserless } from '../browserlessClient';
import { Page } from 'puppeteer-core';

interface JobPosting {
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string[];
  postedDate: string;
  painSignals: string[]; // Extracted pain points from job description
}

interface JobPostingsData {
  totalOpenings: number;
  jobs: JobPosting[];
  hiringVelocity: 'aggressive' | 'moderate' | 'stable';
  departmentBreakdown: Record<string, number>;
  techStack: string[];
  painSignals: string[];
}

export async function scrapeCompanyJobs(companyName: string): Promise<JobPostingsData> {
  // Try LinkedIn Jobs first
  const linkedInJobsUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companyName)}&f_C=${encodeURIComponent(companyName)}`;

  return scrapeWithBrowserless(linkedInJobsUrl, async (page: Page) => {
    await page.waitForSelector('.jobs-search-results', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const jobs: JobPosting[] = [];
      const departmentBreakdown: Record<string, number> = {};
      const techStack: Set<string> = new Set();
      const painSignals: Set<string> = new Set();

      // Common tech keywords to detect
      const techKeywords = [
        'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Azure', 'GCP',
        'Kubernetes', 'Docker', 'PostgreSQL', 'MongoDB', 'Salesforce', 'SAP', 'Oracle',
        'SOLIDWORKS', 'AutoCAD', 'Revit', 'CAD', 'CAM', 'PLM', 'PDM', 'ERP', 'CRM'
      ];

      // Pain signal keywords
      const painKeywords = [
        'scaling', 'growth', 'transformation', 'modernization', 'automation',
        'efficiency', 'streamline', 'optimize', 'migrate', 'upgrade', 'replace',
        'challenge', 'problem', 'pain point', 'bottleneck', 'manual process'
      ];

      document.querySelectorAll('.job-card-container').forEach(card => {
        const title = card.querySelector('.job-card-list__title')?.textContent?.trim() || '';
        const location = card.querySelector('.job-card-container__metadata-item')?.textContent?.trim() || '';

        // Categorize by department
        const dept = categorizeDepartment(title);
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;

        jobs.push({
          title,
          department: dept,
          location,
          description: '', // Would need to click into each job
          requirements: [],
          postedDate: '',
          painSignals: [],
        });
      });

      function categorizeDepartment(title: string): string {
        const lower = title.toLowerCase();
        if (lower.includes('engineer') || lower.includes('developer')) return 'Engineering';
        if (lower.includes('sales') || lower.includes('account')) return 'Sales';
        if (lower.includes('marketing')) return 'Marketing';
        if (lower.includes('product')) return 'Product';
        if (lower.includes('design')) return 'Design';
        if (lower.includes('support') || lower.includes('success')) return 'Customer Success';
        if (lower.includes('hr') || lower.includes('people')) return 'HR';
        if (lower.includes('finance') || lower.includes('accounting')) return 'Finance';
        return 'Other';
      }

      // Determine hiring velocity
      const totalJobs = jobs.length;
      let hiringVelocity: 'aggressive' | 'moderate' | 'stable';
      if (totalJobs > 50) hiringVelocity = 'aggressive';
      else if (totalJobs > 20) hiringVelocity = 'moderate';
      else hiringVelocity = 'stable';

      return {
        totalOpenings: totalJobs,
        jobs: jobs.slice(0, 20), // Limit to first 20
        hiringVelocity,
        departmentBreakdown,
        techStack: Array.from(techStack),
        painSignals: Array.from(painSignals),
      };
    });

    return data;
  });
}
```

### Company Website Deep Scraper: `server/ai/scrapers/companyWebsite.ts`

```typescript
import { scrapeWithBrowserless } from '../browserlessClient';
import { Page } from 'puppeteer-core';

interface CompanyWebsiteData {
  homepage: {
    title: string;
    description: string;
    heroMessage: string;
    primaryCTA: string;
  };
  about: {
    mission: string;
    values: string[];
    leadership: Array<{ name: string; title: string }>;
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
  techStack: string[]; // Detected from page source
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

export async function scrapeCompanyWebsite(websiteUrl: string): Promise<CompanyWebsiteData> {
  return scrapeWithBrowserless(websiteUrl, async (page: Page) => {
    const data: CompanyWebsiteData = {
      homepage: { title: '', description: '', heroMessage: '', primaryCTA: '' },
      about: { mission: '', values: [], leadership: [], founded: '', employees: '' },
      products: [],
      caseStudies: [],
      blog: [],
      techStack: [],
      contactInfo: { email: '', phone: '', address: '' },
    };

    // Scrape homepage
    data.homepage = await page.evaluate(() => ({
      title: document.title || '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      heroMessage: document.querySelector('h1')?.textContent?.trim() || '',
      primaryCTA: document.querySelector('a.cta, a.btn-primary, a[href*="demo"], a[href*="contact"]')?.textContent?.trim() || '',
    }));

    // Detect tech stack from page source
    const pageContent = await page.content();
    data.techStack = detectTechStack(pageContent);

    // Try to find and scrape About page
    const aboutLink = await page.$('a[href*="about"]');
    if (aboutLink) {
      await aboutLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

      data.about = await page.evaluate(() => {
        const getText = (selector: string): string => {
          const el = document.querySelector(selector);
          return el?.textContent?.trim() || '';
        };

        return {
          mission: getText('.mission, [class*="mission"]') || getText('p'),
          values: Array.from(document.querySelectorAll('[class*="value"] h3, [class*="value"] h4'))
            .map(el => el.textContent?.trim() || '').filter(Boolean),
          leadership: Array.from(document.querySelectorAll('[class*="team"] [class*="member"], [class*="leadership"] [class*="person"]'))
            .map(el => ({
              name: el.querySelector('h3, h4, [class*="name"]')?.textContent?.trim() || '',
              title: el.querySelector('p, [class*="title"], [class*="role"]')?.textContent?.trim() || '',
            })).filter(l => l.name),
          founded: '',
          employees: '',
        };
      });
    }

    // Try to find contact info
    const contactLink = await page.$('a[href*="contact"]');
    if (contactLink) {
      await contactLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

      data.contactInfo = await page.evaluate(() => {
        const pageText = document.body.innerText;

        // Extract email
        const emailMatch = pageText.match(/[\w.-]+@[\w.-]+\.\w+/);

        // Extract phone
        const phoneMatch = pageText.match(/\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

        return {
          email: emailMatch?.[0] || '',
          phone: phoneMatch?.[0] || '',
          address: '', // Complex to extract reliably
        };
      });
    }

    return data;
  });
}

function detectTechStack(html: string): string[] {
  const detected: string[] = [];

  const signatures: Record<string, string[]> = {
    'React': ['react', '_reactRootContainer', 'data-reactroot'],
    'Vue.js': ['vue', '__vue__', 'data-v-'],
    'Angular': ['ng-', 'angular'],
    'WordPress': ['wp-content', 'wp-includes'],
    'Shopify': ['shopify', 'cdn.shopify'],
    'HubSpot': ['hubspot', 'hs-scripts'],
    'Salesforce': ['salesforce', 'pardot'],
    'Google Analytics': ['google-analytics', 'gtag', 'ga.js'],
    'Segment': ['segment', 'analytics.js'],
    'Intercom': ['intercom'],
    'Drift': ['drift'],
    'Marketo': ['marketo', 'munchkin'],
    'Cloudflare': ['cloudflare'],
    'AWS': ['amazonaws', 'cloudfront'],
    'Stripe': ['stripe'],
  };

  for (const [tech, patterns] of Object.entries(signatures)) {
    if (patterns.some(p => html.toLowerCase().includes(p))) {
      detected.push(tech);
    }
  }

  return detected;
}
```

---

## Integration with Research Orchestrator

### Updated `server/ai/leadResearch.ts`

```typescript
import { scrapeLinkedInCompany } from './scrapers/linkedInCompany';
import { scrapeLinkedInProfile } from './scrapers/linkedInProfile';
import { scrapeCompanyJobs } from './scrapers/jobPostings';
import { scrapeCompanyWebsite } from './scrapers/companyWebsite';

interface ResearchOptions {
  mode: 'fast' | 'deep';
  sources?: {
    linkedInCompany?: boolean;
    linkedInProfile?: boolean;
    companyWebsite?: boolean;
    jobPostings?: boolean;
    news?: boolean;
    reviews?: boolean;
  };
}

export async function researchLead(
  lead: Lead,
  options: ResearchOptions = { mode: 'fast' }
): Promise<ResearchPacket> {
  const { mode, sources } = options;

  const researchTasks: Promise<any>[] = [];
  const results: Record<string, any> = {};

  // Always do fast/API-based research
  researchTasks.push(
    fetchGoogleNews(lead.companyName).then(r => results.news = r),
    fetchBasicCompanyInfo(lead.companyWebsite).then(r => results.basicInfo = r),
  );

  // Add deep research if requested
  if (mode === 'deep') {
    // LinkedIn Company (via Browserless)
    if (sources?.linkedInCompany !== false && lead.companyLinkedIn) {
      researchTasks.push(
        scrapeLinkedInCompany(lead.companyLinkedIn)
          .then(r => results.linkedInCompany = r)
          .catch(e => {
            console.error('LinkedIn company scrape failed:', e);
            results.linkedInCompany = null;
          })
      );
    }

    // LinkedIn Profile (via Browserless)
    if (sources?.linkedInProfile !== false && lead.contactLinkedIn) {
      researchTasks.push(
        scrapeLinkedInProfile(lead.contactLinkedIn)
          .then(r => results.linkedInProfile = r)
          .catch(e => {
            console.error('LinkedIn profile scrape failed:', e);
            results.linkedInProfile = null;
          })
      );
    }

    // Company Website Deep Scrape (via Browserless)
    if (sources?.companyWebsite !== false && lead.companyWebsite) {
      researchTasks.push(
        scrapeCompanyWebsite(lead.companyWebsite)
          .then(r => results.websiteDeep = r)
          .catch(e => {
            console.error('Website deep scrape failed:', e);
            results.websiteDeep = null;
          })
      );
    }

    // Job Postings (via Browserless)
    if (sources?.jobPostings !== false) {
      researchTasks.push(
        scrapeCompanyJobs(lead.companyName)
          .then(r => results.jobPostings = r)
          .catch(e => {
            console.error('Job postings scrape failed:', e);
            results.jobPostings = null;
          })
      );
    }
  }

  // Execute all research in parallel
  await Promise.allSettled(researchTasks);

  // Synthesize with Gemini AI
  const dossier = await synthesizeResearch(lead, results, mode);

  return dossier;
}

async function synthesizeResearch(
  lead: Lead,
  rawData: Record<string, any>,
  mode: 'fast' | 'deep'
): Promise<ResearchPacket> {
  const prompt = `
You are a sales intelligence analyst. Synthesize the following research data into an actionable dossier for an SDR.

LEAD:
- Company: ${lead.companyName}
- Contact: ${lead.contactName} (${lead.contactTitle})
- Website: ${lead.companyWebsite}

RAW RESEARCH DATA:
${JSON.stringify(rawData, null, 2)}

RESEARCH MODE: ${mode}

Generate a comprehensive dossier with:
1. Company Intelligence (size, industry, growth signals)
2. Contact Intelligence (background, communication style, interests)
3. Pain Points (with confidence levels and evidence)
4. Product Matches (which Hawk Ridge products fit their needs)
5. Talk Track (personalized opening and key points)
6. Discovery Questions (5 questions to uncover needs)
7. Objection Handles (likely objections and responses)
8. Buying Signals (indicators they're ready to buy)
9. Red Flags (reasons they might not be a good fit)
10. Confidence Assessment (overall data quality)

Return as JSON.
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  const dossier = JSON.parse(result.response.text());

  return dossier;
}
```

---

## API Endpoints

### Research Endpoint Updates

```typescript
// POST /api/leads/:id/research
app.post('/api/leads/:id/research', requireAuth, async (req, res) => {
  const leadId = req.params.id;
  const { mode = 'fast', sources } = req.body;

  try {
    const lead = await storage.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Start research (may take 30-60 seconds for deep mode)
    const researchPacket = await researchLead(lead, { mode, sources });

    // Save to database
    await storage.createResearchPacket({
      leadId,
      ...researchPacket,
      mode,
      createdAt: new Date(),
    });

    res.json(researchPacket);
  } catch (error) {
    console.error('Research failed:', error);
    res.status(500).json({ message: 'Research failed', error: error.message });
  }
});
```

### Request Examples

**Fast Research (3-5 seconds):**
```json
POST /api/leads/123/research
{
  "mode": "fast"
}
```

**Deep Research (30-60 seconds):**
```json
POST /api/leads/123/research
{
  "mode": "deep",
  "sources": {
    "linkedInCompany": true,
    "linkedInProfile": true,
    "companyWebsite": true,
    "jobPostings": true,
    "news": true
  }
}
```

---

## Frontend Updates

### Research Button Options

```tsx
// In leads.tsx or lead detail view

const [researchMode, setResearchMode] = useState<'fast' | 'deep'>('fast');

const triggerResearch = useMutation({
  mutationFn: async () => {
    const res = await fetch(`/api/leads/${leadId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mode: researchMode }),
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leads', leadId] });
    toast({
      title: 'Research Complete',
      description: researchMode === 'deep'
        ? 'Deep intelligence gathered from multiple sources'
        : 'Quick research complete',
    });
  },
});

return (
  <div className="flex gap-2">
    <Button
      variant="outline"
      onClick={() => {
        setResearchMode('fast');
        triggerResearch.mutate();
      }}
      disabled={triggerResearch.isPending}
    >
      {triggerResearch.isPending && researchMode === 'fast' ? (
        <Loader2 className="animate-spin mr-2" />
      ) : (
        <Zap className="mr-2" />
      )}
      Quick Research
    </Button>

    <Button
      onClick={() => {
        setResearchMode('deep');
        triggerResearch.mutate();
      }}
      disabled={triggerResearch.isPending}
    >
      {triggerResearch.isPending && researchMode === 'deep' ? (
        <Loader2 className="animate-spin mr-2" />
      ) : (
        <Search className="mr-2" />
      )}
      Deep Research
    </Button>
  </div>
);
```

---

## Cost & Usage Considerations

### Browserless.io Pricing

| Plan | Concurrent Sessions | Monthly Cost | Notes |
|------|--------------------:|-------------:|-------|
| Starter | 2 | $50 | ~1,000 sessions |
| Growth | 5 | $200 | ~5,000 sessions |
| Business | 10 | $400 | ~10,000 sessions |
| Enterprise | Custom | Custom | Unlimited |

### Optimization Strategies

1. **Cache Results**: Store scraped data for 24-48 hours
2. **Batch Processing**: Queue deep research for off-peak hours
3. **Selective Scraping**: Only deep scrape high-value leads (Fit Score > 70)
4. **Fallback Gracefully**: If Browserless fails, use fast path data

### Rate Limiting

```typescript
import pLimit from 'p-limit';

// Limit to 5 concurrent Browserless sessions
const browserlessLimit = pLimit(5);

export async function scrapeWithRateLimit<T>(
  url: string,
  scraper: (page: Page) => Promise<T>
): Promise<T> {
  return browserlessLimit(() => scrapeWithBrowserless(url, scraper));
}
```

---

## Error Handling & Monitoring

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `TimeoutError` | Page load too slow | Increase timeout, retry |
| `ProtocolError` | Browser disconnected | Retry with new session |
| `Navigation failed` | Page blocked/redirected | Use proxy rotation |
| `Element not found` | Page structure changed | Update selectors |

### Logging

```typescript
import { createLogger } from './utils/logger';

const logger = createLogger('browserless');

export async function scrapeWithBrowserless<T>(
  url: string,
  scraper: (page: Page) => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  logger.info('Starting scrape', { url });

  try {
    const result = await doScrape(url, scraper);

    logger.info('Scrape completed', {
      url,
      duration: Date.now() - startTime,
      success: true,
    });

    return result;
  } catch (error) {
    logger.error('Scrape failed', {
      url,
      duration: Date.now() - startTime,
      error: error.message,
    });

    throw error;
  }
}
```

---

## Security Considerations

1. **Never store LinkedIn credentials** - Use only public profile scraping
2. **Respect robots.txt** where appropriate
3. **Rate limit requests** to avoid detection
4. **Rotate user agents** to appear more natural
5. **Monitor for blocks** and adapt strategies

---

## Questions for Discovery

Add these to the client questionnaire:

| Category | Question | Client Response |
|----------|----------|-----------------|
| **Data Sources** | Do you have LinkedIn Sales Navigator? | |
| **Data Sources** | Do you have ZoomInfo, Apollo, or similar? | |
| **Compliance** | Any restrictions on web scraping? | |
| **Volume** | How many deep researches per day? | |
| **Budget** | Approved budget for Browserless/scraping services? | |

---

## Next Steps

1. [ ] Add `BROWSERLESS_API_KEY` to environment secrets
2. [ ] Install `puppeteer-core` dependency
3. [ ] Create scraper modules
4. [ ] Update research orchestrator
5. [ ] Add UI toggle for fast/deep research
6. [ ] Set up monitoring and error tracking
7. [ ] Test with sample leads
8. [ ] Document scraper maintenance procedures
