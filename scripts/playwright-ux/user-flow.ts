/**
 * Playwright User Flow Testing Utility for UX Agent
 *
 * Tests critical user workflows and measures performance
 */

import { chromium, Browser, Page } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface FlowStep {
  name: string;
  action: (page: Page) => Promise<void>;
  validate?: (page: Page) => Promise<boolean>;
}

interface FlowResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
}

interface UserFlowReport {
  flowName: string;
  timestamp: string;
  totalDuration: number;
  success: boolean;
  steps: FlowResult[];
}

/**
 * Execute a user flow and measure performance
 */
export async function executeUserFlow(
  flowName: string,
  baseUrl: string,
  steps: FlowStep[]
): Promise<UserFlowReport> {
  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();
  const results: FlowResult[] = [];
  const startTime = Date.now();

  try {
    for (const step of steps) {
      const stepStartTime = Date.now();
      let success = true;
      let error: string | undefined;

      try {
        // Execute step action
        await step.action(page);

        // Validate if validator provided
        if (step.validate) {
          success = await step.validate(page);
        }

        // Wait for network to be idle
        await page.waitForLoadState('networkidle');
      } catch (e) {
        success = false;
        error = e instanceof Error ? e.message : String(e);
      }

      const stepDuration = Date.now() - stepStartTime;

      // Capture screenshot on failure
      let screenshot: string | undefined;
      if (!success) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        screenshot = `screenshots/flow-error-${flowName}-${step.name}-${timestamp}.png`;
        await page.screenshot({ path: screenshot });
      }

      results.push({
        name: step.name,
        success,
        duration: stepDuration,
        error,
        screenshot,
      });

      // Stop flow on failure
      if (!success) {
        break;
      }
    }
  } finally {
    await browser.close();
  }

  const totalDuration = Date.now() - startTime;
  const success = results.every((r) => r.success);

  return {
    flowName,
    timestamp: new Date().toISOString(),
    totalDuration,
    success,
    steps: results,
  };
}

/**
 * Pre-defined user flows for Lead Intel
 */

export const LeadIntelFlows = {
  /**
   * Lead Creation Flow
   */
  createLead: (baseUrl: string): FlowStep[] => [
    {
      name: 'Navigate to Leads page',
      action: async (page) => {
        await page.goto(`${baseUrl}/leads`);
      },
      validate: async (page) => {
        return (await page.title()).includes('Leads');
      },
    },
    {
      name: 'Click Create Lead button',
      action: async (page) => {
        await page.click('button:has-text("Create Lead")');
      },
      validate: async (page) => {
        return page.locator('dialog').isVisible();
      },
    },
    {
      name: 'Fill lead form',
      action: async (page) => {
        await page.fill('input[name="companyName"]', 'Test Company');
        await page.fill('input[name="contactName"]', 'John Doe');
        await page.fill('input[name="email"]', 'john@test.com');
      },
    },
    {
      name: 'Submit form',
      action: async (page) => {
        await page.click('button[type="submit"]');
      },
      validate: async (page) => {
        // Wait for success toast or redirect
        await page.waitForTimeout(1000);
        return true;
      },
    },
  ],

  /**
   * Call Preparation Flow
   */
  callPrep: (baseUrl: string, leadId: number): FlowStep[] => [
    {
      name: 'Navigate to Call Prep',
      action: async (page) => {
        await page.goto(`${baseUrl}/call-prep?leadId=${leadId}`);
      },
      validate: async (page) => {
        return page.locator('text=Call Prep').isVisible();
      },
    },
    {
      name: 'View research brief',
      action: async (page) => {
        const researchSection = page.locator('[data-testid="research-brief"]');
        await researchSection.scrollIntoViewIfNeeded();
      },
      validate: async (page) => {
        const researchText = await page.locator('[data-testid="research-brief"]').textContent();
        return (researchText?.length ?? 0) > 0;
      },
    },
    {
      name: 'Click Call button',
      action: async (page) => {
        await page.click('button:has-text("Call")');
      },
      validate: async (page) => {
        // Verify softphone appears
        return page.locator('[data-testid="softphone"]').isVisible();
      },
    },
  ],

  /**
   * Dashboard Overview Flow
   */
  dashboardOverview: (baseUrl: string): FlowStep[] => [
    {
      name: 'Navigate to Dashboard',
      action: async (page) => {
        await page.goto(`${baseUrl}/dashboard`);
      },
      validate: async (page) => {
        return page.locator('text=Dashboard').isVisible();
      },
    },
    {
      name: 'Check metrics loaded',
      action: async (page) => {
        await page.waitForSelector('[data-testid="metric-card"]');
      },
      validate: async (page) => {
        const metricCards = await page.locator('[data-testid="metric-card"]').count();
        return metricCards >= 4; // Should have at least 4 KPI cards
      },
    },
    {
      name: 'Check leaderboard loaded',
      action: async (page) => {
        await page.waitForSelector('[data-testid="leaderboard"]');
      },
      validate: async (page) => {
        return page.locator('[data-testid="leaderboard"]').isVisible();
      },
    },
  ],

  /**
   * Manager Call Review Flow
   */
  managerCallReview: (baseUrl: string, callId: number): FlowStep[] => [
    {
      name: 'Navigate to Reports',
      action: async (page) => {
        await page.goto(`${baseUrl}/reports`);
      },
    },
    {
      name: 'Select call to review',
      action: async (page) => {
        await page.click(`[data-call-id="${callId}"]`);
      },
      validate: async (page) => {
        return page.locator('dialog:has-text("Call Review")').isVisible();
      },
    },
    {
      name: 'View transcript',
      action: async (page) => {
        const transcript = page.locator('[data-testid="transcript"]');
        await transcript.scrollIntoViewIfNeeded();
      },
      validate: async (page) => {
        const transcriptText = await page.locator('[data-testid="transcript"]').textContent();
        return (transcriptText?.length ?? 0) > 0;
      },
    },
    {
      name: 'View analysis',
      action: async (page) => {
        await page.click('button:has-text("Generate Analysis")');
        await page.waitForTimeout(2000); // Wait for AI analysis
      },
      validate: async (page) => {
        return page.locator('[data-testid="call-analysis"]').isVisible();
      },
    },
  ],
};

/**
 * Run all critical flows
 */
export async function runAllFlows(baseUrl: string): Promise<Record<string, UserFlowReport>> {
  const reports: Record<string, UserFlowReport> = {};

  console.log('🚀 Running all critical user flows...\n');

  // Dashboard overview
  console.log('1️⃣  Testing Dashboard Overview...');
  reports.dashboard = await executeUserFlow(
    'Dashboard Overview',
    baseUrl,
    LeadIntelFlows.dashboardOverview(baseUrl)
  );
  console.log(
    `   ${reports.dashboard.success ? '✅' : '❌'} ${reports.dashboard.totalDuration}ms\n`
  );

  // Lead creation
  console.log('2️⃣  Testing Lead Creation...');
  reports.leadCreation = await executeUserFlow(
    'Lead Creation',
    baseUrl,
    LeadIntelFlows.createLead(baseUrl)
  );
  console.log(
    `   ${reports.leadCreation.success ? '✅' : '❌'} ${reports.leadCreation.totalDuration}ms\n`
  );

  return reports;
}

/**
 * Generate flow report
 */
export function generateFlowReport(report: UserFlowReport): string {
  let output = `
# User Flow Test Report: ${report.flowName}

**Date:** ${report.timestamp}
**Total Duration:** ${report.totalDuration}ms
**Status:** ${report.success ? '✅ PASSED' : '❌ FAILED'}

## Steps

`;

  report.steps.forEach((step, index) => {
    const icon = step.success ? '✅' : '❌';
    output += `
### ${index + 1}. ${icon} ${step.name} (${step.duration}ms)

`;

    if (step.error) {
      output += `**Error:** ${step.error}\n\n`;
    }

    if (step.screenshot) {
      output += `**Screenshot:** ${step.screenshot}\n\n`;
    }
  });

  return output;
}

/**
 * Save flow report
 */
export function saveFlowReport(report: UserFlowReport, outputDir = 'flow-reports'): void {
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `flow-${report.flowName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

  // Save JSON
  writeFileSync(join(outputDir, `${filename}.json`), JSON.stringify(report, null, 2), 'utf-8');

  // Save Markdown
  const markdown = generateFlowReport(report);
  writeFileSync(join(outputDir, `${filename}.md`), markdown, 'utf-8');

  console.log(`📄 Flow report saved to ${outputDir}/${filename}.(json|md)`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:5000';

  (async () => {
    const reports = await runAllFlows(baseUrl);

    // Save all reports
    Object.values(reports).forEach((report) => {
      saveFlowReport(report);
    });

    // Summary
    console.log('\n📊 Summary:');
    Object.entries(reports).forEach(([name, report]) => {
      console.log(`   ${report.success ? '✅' : '❌'} ${name}: ${report.totalDuration}ms`);
    });

    // Exit with error if any flow failed
    const anyFailed = Object.values(reports).some((r) => !r.success);
    if (anyFailed) {
      process.exit(1);
    }
  })();
}
