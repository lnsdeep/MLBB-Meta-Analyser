import { test, expect } from '@playwright/test';

const TOOLS = ["tier", "counter", "draft", "synergy", "radar", "movers", "guide"];
const THEMES = ['dark', 'light'];

for (const theme of THEMES) {
  for (const tool of TOOLS) {
    test(`${theme} mode - ${tool} tab renders without overflow`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem('mlbb_theme', t); } catch (e) {}
      }, theme);
      await page.goto(`/?tool=${tool}`, { waitUntil: 'networkidle' });
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(500);

      const appliedTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'));
      expect(appliedTheme).toBe(theme);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });

      expect(hasOverflow).toBe(false);
    });
  }
}
