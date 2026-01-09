# Playwright UX Utilities

Playwright-powered tools for the **UX Agent** to perform UI audits, testing, and analysis.

## Overview

These utilities enable the UX Agent to:
- **Capture Screenshots**: Visual documentation of UI states
- **Audit Accessibility**: WCAG compliance checking with axe-core
- **Test User Flows**: Automated workflow testing and performance measurement

## Tools

### 1. Screenshot Utility

Capture screenshots of pages for visual analysis.

**Usage:**
```bash
# Single screenshot
npm run playwright:screenshot http://localhost:5000/leads "leads-page"

# Full page screenshot
npm run playwright:screenshot http://localhost:5000/dashboard "dashboard" -- --full-page

# Responsive screenshots (mobile, tablet, desktop)
npm run playwright:screenshot http://localhost:5000/coaching "coaching" -- --responsive
```

**From Code:**
```typescript
import { captureScreenshot, captureResponsiveScreenshots } from './screenshot';

// Single screenshot
await captureScreenshot({
  url: 'http://localhost:5000/leads',
  name: 'leads-page',
  fullPage: true,
});

// Responsive screenshots
await captureResponsiveScreenshots('http://localhost:5000/dashboard', 'dashboard');
```

**Output:** `screenshots/` directory with timestamped PNG files

---

### 2. Accessibility Audit

Perform WCAG accessibility audits using axe-core.

**Usage:**
```bash
# Audit a page
npm run playwright:accessibility http://localhost:5000/leads

# Audit generates both JSON and Markdown reports
```

**From Code:**
```typescript
import { auditAccessibility, auditMultiplePages, saveReport } from './accessibility-audit';

// Audit single page
const report = await auditAccessibility('http://localhost:5000/leads');
saveReport(report);

// Audit multiple pages
const reports = await auditMultiplePages([
  { url: 'http://localhost:5000/leads', name: 'Leads' },
  { url: 'http://localhost:5000/dashboard', name: 'Dashboard' },
  { url: 'http://localhost:5000/coaching', name: 'Coaching' },
]);
```

**Report Contents:**
- Total violations by severity (critical, serious, moderate, minor)
- Detailed description of each issue
- How-to-fix guidance with links
- Affected HTML elements
- JSON + Markdown formats

**Output:** `accessibility-reports/` directory

---

### 3. User Flow Testing

Test critical user workflows and measure performance.

**Usage:**
```bash
# Run all predefined flows
npm run playwright:flows

# Run with custom base URL
npm run playwright:flows http://localhost:5000
```

**Pre-defined Flows:**
1. **Dashboard Overview** - Load dashboard, verify metrics and leaderboard
2. **Lead Creation** - Navigate → Create Lead → Fill Form → Submit
3. **Call Preparation** - View lead → Open research → Start call
4. **Manager Call Review** - Open call → View transcript → Generate analysis

**From Code:**
```typescript
import { executeUserFlow, LeadIntelFlows } from './user-flow';

// Run a specific flow
const report = await executeUserFlow(
  'Lead Creation',
  'http://localhost:5000',
  LeadIntelFlows.createLead('http://localhost:5000')
);

// Create custom flow
const customFlow = [
  {
    name: 'Navigate to page',
    action: async (page) => {
      await page.goto('http://localhost:5000/custom');
    },
    validate: async (page) => {
      return page.locator('h1').isVisible();
    },
  },
  // ... more steps
];

const result = await executeUserFlow('My Custom Flow', 'http://localhost:5000', customFlow);
```

**Report Contents:**
- Flow name and total duration
- Success/failure status
- Step-by-step breakdown with timings
- Error messages and screenshots on failure

**Output:** `flow-reports/` directory

---

## Quick Commands

```bash
# Development
npm run dev                          # Start dev server

# UX Agent Commands
npm run playwright:screenshot <url> [name]           # Screenshot
npm run playwright:accessibility <url>               # Accessibility audit
npm run playwright:flows [baseUrl]                   # User flow tests
npm run ux:audit-all                                 # Run all audits

# Playwright Test Suite
npm run test:e2e                     # Run E2E tests
npm run test:ui                      # Run tests with UI viewer
```

---

## Integration with UX Agent

The UX Agent uses these utilities to:

### 1. **Design Audits**
```
UX Agent: "Let me capture screenshots of the current UI"
→ Runs: captureResponsiveScreenshots()
→ Analyzes: Visual hierarchy, spacing, responsiveness
→ Reports: Friction points and improvement recommendations
```

### 2. **Accessibility Checks**
```
UX Agent: "Checking WCAG compliance..."
→ Runs: auditAccessibility()
→ Analyzes: Violations by severity
→ Reports: Critical issues with fix recommendations
→ Proposes: Accessibility improvements
```

### 3. **Workflow Analysis**
```
UX Agent: "Testing user flows..."
→ Runs: executeUserFlow() for critical paths
→ Measures: Performance and success rates
→ Identifies: Bottlenecks and failure points
→ Recommends: Workflow optimizations
```

### 4. **Before/After Comparisons**
```
UX Agent: "Measuring impact of changes..."
→ Captures: Screenshots before changes
→ Implements: UX improvements
→ Captures: Screenshots after changes
→ Compares: Visual and performance metrics
→ Reports: Improvement impact
```

---

## Output Directories

```
hawkridgesales/
├── screenshots/                    # UI screenshots
├── accessibility-reports/          # Accessibility audit reports
├── flow-reports/                   # User flow test reports
└── test-results/                   # Playwright test results
```

---

## Configuration

### playwright.config.ts

Configure test behavior, browsers, and viewports:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,

  use: {
    baseURL: 'http://localhost:5000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'tablet', use: { ...devices['iPad Pro'] } },
  ],
});
```

---

## Best Practices

### For Screenshot Utility
- Use descriptive names for screenshots
- Capture responsive views for all breakpoints
- Take full-page screenshots for long pages
- Organize screenshots by feature/page

### For Accessibility Audit
- Run audits on all primary pages
- Address critical and serious issues first
- Re-audit after fixes
- Include audits in CI/CD pipeline

### For User Flow Testing
- Test critical paths (lead creation, call flow, etc.)
- Validate each step with assertions
- Measure performance (< 3s for key actions)
- Update flows when UI changes

---

## Troubleshooting

### Playwright browser not found
```bash
npx playwright install chromium
```

### Script execution fails
```bash
# Ensure server is running
npm run dev

# Check the base URL is correct
npm run playwright:flows http://localhost:5000
```

### TypeScript errors
```bash
# Ensure dependencies are installed
npm install

# Check TypeScript configuration
npm run check
```

---

## Examples

### Complete UX Audit Workflow

```bash
# 1. Start development server
npm run dev

# 2. Capture current state
npm run playwright:screenshot http://localhost:5000/leads "leads-before"

# 3. Run accessibility audit
npm run playwright:accessibility http://localhost:5000/leads

# 4. Test user flows
npm run playwright:flows

# 5. Make UX improvements based on findings
# ... (UX Agent implements changes)

# 6. Capture improved state
npm run playwright:screenshot http://localhost:5000/leads "leads-after"

# 7. Re-run audits to measure improvement
npm run ux:audit-all
```

---

## Resources

- **Playwright Docs**: https://playwright.dev/
- **Axe-core Rules**: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Playwright Best Practices**: https://playwright.dev/docs/best-practices

---

**Built for the UX Agent 🎨**

These tools empower the UX Agent to perform comprehensive UI audits and deliver data-driven UX improvements.
