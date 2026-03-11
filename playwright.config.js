const { defineConfig } = require('@playwright/test');
const { baseURL } = require('./config/env');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 30000,
  },
  retries: 1,
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
    {
      name: 'edge',
      use: { channel: 'msedge' },
    },
  ],
});
