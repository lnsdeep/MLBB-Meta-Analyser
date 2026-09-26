import { test, expect } from '@playwright/test';

/**
 * Headless runner for the in-browser unit test suite (tests/unit_tests.html).
 * Waits for window.__TEST_RESULTS__ and asserts every assertion passed.
 */
test('All browser-based unit tests pass', async ({ page }) => {
  await page.goto('/tests/unit_tests.html', { waitUntil: 'networkidle' });

  // Wait for test completion (suite fetches data + runs 130+ assertions)
  await page.waitForFunction(() => window.__TEST_RESULTS__?.total > 0, { timeout: 30000 });

  const results = await page.evaluate(() => window.__TEST_RESULTS__);

  console.log(`Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}`);

  // Log any failures
  if (results.failed > 0) {
    const failures = results.results.filter(r => !r.passed);
    for (const f of failures) {
      console.error(`FAIL: ${f.name} — ${f.details}`);
    }
  }

  expect(results.allPassed).toBe(true);
  expect(results.failed).toBe(0);
});
