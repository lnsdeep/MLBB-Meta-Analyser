import { test, expect } from '@playwright/test';

/**
 * Headless runner for the iframe-based mobile viewport overflow suite
 * (tests/test_layout.html): 6 device widths x 7 tools.
 */
test.describe.configure({ mode: 'serial' });
test.setTimeout(300000);

test('Mobile viewport layout overflow suite passes', async ({ page }) => {
  test.skip(test.info().project.name === 'chromium', 'Device-width matrix is project-independent; run once on a mobile project');

  await page.goto('/tests/test_layout.html', { waitUntil: 'networkidle' });

  await page.waitForFunction(() => {
    const el = document.getElementById('layoutStatus');
    return el && el.dataset.total !== undefined && Number(el.dataset.total) > 0;
  }, { timeout: 240000 });

  const status = await page.evaluate(() => {
    const el = document.getElementById('layoutStatus');
    return {
      passed: el.dataset.passed === 'true',
      total: Number(el.dataset.total),
      failed: Number(el.dataset.failed),
      text: el.textContent.trim(),
    };
  });

  console.log(`Layout suite: ${status.text}`);
  if (status.failed > 0) {
    const failures = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.result-card.fail')).map(c => c.textContent.trim()));
    for (const f of failures) console.error(`FAIL: ${f}`);
  }

  expect(status.total).toBeGreaterThan(0);
  expect(status.failed).toBe(0);
  expect(status.passed).toBe(true);
});
