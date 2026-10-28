import { defineConfig, devices } from '@playwright/test';

const port = 3100;
// Locally Chromium runs on the installed Chrome; CI installs Playwright's own Chromium and WebKit.
const channel = process.env.CI ? undefined : 'chrome';
const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
// The accessibility and link-crawl suites do not depend on the browser, so they run once.
const onlyOnce = /(a11y|links|receipts)\.spec\.ts$/;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'on-first-retry' },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: desktop, channel },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], viewport: phone, channel },
      testIgnore: onlyOnce,
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: desktop },
      testIgnore: onlyOnce,
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 14'], viewport: phone },
      testIgnore: onlyOnce,
    },
  ],
  // Tests run against the production build: `npm run build` first.
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
