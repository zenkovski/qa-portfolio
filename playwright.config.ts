import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1, // tests run against public sites over the internet; one retry covers a short outage and shows as "flaky"
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] }, testIgnore: /api\// },
    { name: 'mobile-pixel', use: { ...devices['Pixel 7'] }, testIgnore: /api\// },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /api\// },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /api\// },
    { name: 'api', testMatch: /api\/.*\.spec\.ts/, use: { baseURL: undefined } },
  ],
});
