/**
 * Playwright Accessibility Audit Utility for UX Agent
 *
 * Performs WCAG accessibility audits using axe-core
 */

import { chromium, Browser, Page } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AccessibilityReport {
  url: string;
  timestamp: string;
  violations: AccessibilityIssue[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

/**
 * Inject axe-core into the page
 */
async function injectAxe(page: Page): Promise<void> {
  // Use CDN version of axe-core
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js',
  });
}

/**
 * Run accessibility audit on a page
 */
export async function auditAccessibility(url: string): Promise<AccessibilityReport> {
  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();

  try {
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle' });

    // Inject axe-core
    await injectAxe(page);

    // Run axe accessibility audit
    const results = await page.evaluate(() => {
      // @ts-ignore (axe is injected at runtime)
      return window.axe.run();
    });

    // Process results
    const violations: AccessibilityIssue[] = results.violations.map((violation: any) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node: any) => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary || '',
      })),
    }));

    // Calculate summary
    const summary = {
      total: violations.length,
      critical: violations.filter((v) => v.impact === 'critical').length,
      serious: violations.filter((v) => v.impact === 'serious').length,
      moderate: violations.filter((v) => v.impact === 'moderate').length,
      minor: violations.filter((v) => v.impact === 'minor').length,
    };

    const report: AccessibilityReport = {
      url,
      timestamp: new Date().toISOString(),
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
      summary,
    };

    return report;
  } finally {
    await browser.close();
  }
}

/**
 * Audit multiple pages and generate a combined report
 */
export async function auditMultiplePages(
  pages: Array<{ url: string; name: string }>
): Promise<Record<string, AccessibilityReport>> {
  const reports: Record<string, AccessibilityReport> = {};

  for (const page of pages) {
    console.log(`🔍 Auditing: ${page.name}...`);
    try {
      reports[page.name] = await auditAccessibility(page.url);
      console.log(`✅ ${page.name}: ${reports[page.name].summary.total} issues found`);
    } catch (error) {
      console.error(`❌ Failed to audit ${page.name}:`, error);
    }
  }

  return reports;
}

/**
 * Generate human-readable report
 */
export function generateReport(report: AccessibilityReport): string {
  let output = `
# Accessibility Audit Report

**URL:** ${report.url}
**Date:** ${report.timestamp}

## Summary

- **Total Violations:** ${report.summary.total}
  - 🔴 Critical: ${report.summary.critical}
  - 🟠 Serious: ${report.summary.serious}
  - 🟡 Moderate: ${report.summary.moderate}
  - 🔵 Minor: ${report.summary.minor}

- **Passed:** ${report.passes}
- **Incomplete:** ${report.incomplete}
- **Not Applicable:** ${report.inapplicable}

## Violations

`;

  if (report.violations.length === 0) {
    output += '✅ No accessibility violations found!\n';
  } else {
    report.violations.forEach((violation, index) => {
      const icon =
        violation.impact === 'critical'
          ? '🔴'
          : violation.impact === 'serious'
          ? '🟠'
          : violation.impact === 'moderate'
          ? '🟡'
          : '🔵';

      output += `
### ${index + 1}. ${icon} ${violation.help} (${violation.impact})

**Description:** ${violation.description}

**How to Fix:** [${violation.helpUrl}](${violation.helpUrl})

**Affected Elements (${violation.nodes.length}):**
`;

      violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
        output += `
${nodeIndex + 1}. \`${node.target.join(' > ')}\`
   \`\`\`html
   ${node.html}
   \`\`\`
`;
      });

      if (violation.nodes.length > 3) {
        output += `\n   ... and ${violation.nodes.length - 3} more\n`;
      }
    });
  }

  return output;
}

/**
 * Save report to file
 */
export function saveReport(report: AccessibilityReport, outputDir = 'accessibility-reports'): void {
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `accessibility-report-${timestamp}`;

  // Save JSON
  writeFileSync(
    join(outputDir, `${filename}.json`),
    JSON.stringify(report, null, 2),
    'utf-8'
  );

  // Save Markdown
  const markdown = generateReport(report);
  writeFileSync(join(outputDir, `${filename}.md`), markdown, 'utf-8');

  console.log(`📄 Report saved to ${outputDir}/${filename}.(json|md)`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npm run accessibility-audit <url>

Example:
  npm run accessibility-audit http://localhost:5000/leads
  npm run accessibility-audit http://localhost:5000/dashboard
    `);
    process.exit(1);
  }

  const url = args[0];

  (async () => {
    console.log(`🔍 Running accessibility audit on: ${url}\n`);
    const report = await auditAccessibility(url);

    // Print summary
    console.log('\n📊 Audit Results:');
    console.log(`   Total Issues: ${report.summary.total}`);
    console.log(`   - Critical: ${report.summary.critical}`);
    console.log(`   - Serious: ${report.summary.serious}`);
    console.log(`   - Moderate: ${report.summary.moderate}`);
    console.log(`   - Minor: ${report.summary.minor}`);
    console.log(`   Passed: ${report.passes}`);

    // Save report
    saveReport(report);

    // Exit with error code if critical or serious issues found
    if (report.summary.critical > 0 || report.summary.serious > 0) {
      process.exit(1);
    }
  })();
}
