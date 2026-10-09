import { defineConfig, devices } from '@playwright/test';

// Specs that only send HTTP requests (no page) run in the "api" project, once; all other specs run in the 4 browsers.
const NO_BROWSER = /(\/api\/|rag\.api\.spec|rag\.data\.spec)/;

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
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] }, testIgnore: NO_BROWSER },
    { name: 'mobile-pixel', use: { ...devices['Pixel 7'] }, testIgnore: NO_BROWSER },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: NO_BROWSER },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] }, testIgnore: NO_BROWSER },
    { name: 'api', testMatch: NO_BROWSER, use: { baseURL: undefined } },
  ],
});
