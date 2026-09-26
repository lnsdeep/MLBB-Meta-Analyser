// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Headless test runner for MLBB Meta Analyser.
 * Serves the static GitHub Pages site locally and runs browser-based unit
 * tests, theme-token validation, layout overflow checks, and visual smoke
 * tests across desktop + mobile viewports.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx serve . -l 8080 -s',
    port: 8080,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
