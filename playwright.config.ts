import { defineConfig } from '@playwright/test';
import { baseURL } from './config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: [
    'smoke.spec.ts',
    'entity-smoke.spec.ts',
    'validation-and-edge-cases.spec.ts',
  ],
  timeout: 120000,
  expect: {
    timeout: 30000,
  },
  retries: isCI ? 2 : 0,
  workers: 4,
  fullyParallel: true,
  maxFailures: isCI ? 0 : 1,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never',
    }],
    ['json', {
      outputFile: 'playwright-report/results.json',
    }],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      suiteTitle: true,
    }],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    headless: true,
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
