const { defineConfig } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /tests\/setup\/.*\.spec\.js/,
    },
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.js/,
      use: {
        baseURL: process.env.API_BASE_URL || 'https://api.github.com',
        extraHTTPHeaders: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': process.env.GH_API_VERSION || '2022-11-28',
          'User-Agent': 'Playwright-Gist-Tests/1.0',
        },
      },
    },
    {
      name: 'ui',
      testMatch: /tests\/ui\/.*\.spec\.js/,
      dependencies: ['setup'],
      use: {
        headless: true,
        extraHTTPHeaders: undefined,
        userAgent: undefined,
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],

  reporter: [['list'], ['html', { open: 'always' }]],
  outputDir: 'test-results/',
});
