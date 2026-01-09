import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Lead Intel UX Agent
 *
 * This configuration supports the UX Agent in performing:
 * - UI screenshots and visual testing
 * - Accessibility audits
 * - User workflow testing
 * - Responsive design testing
 */

export default defineConfig({
  // Test directory (for automated tests)
  testDir: './tests/e2e',

  // Timeout for each test
  timeout: 30 * 1000,

  // Fail fast on CI
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for different browsers and devices
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet viewport
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Web server configuration (auto-start if not running)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
