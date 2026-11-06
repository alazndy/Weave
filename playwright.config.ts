import { defineConfig, devices } from '@playwright/test';

// Set PLAYWRIGHT_CHROMIUM_PATH to use a system Chromium instead of
// `npx playwright install chromium`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: 'pnpm exec vite',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
