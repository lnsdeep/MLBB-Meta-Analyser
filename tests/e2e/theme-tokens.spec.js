import { test, expect } from '@playwright/test';

test.describe('Theme Token Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic theme baseline for token checks
    await page.addInitScript(() => {
      try { localStorage.setItem('mlbb_theme', 'dark'); } catch (e) {}
    });
  });

  test('Dark mode tokens render correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        bgPrimary: s.getPropertyValue('--bg-primary').trim(),
        textPrimary: s.getPropertyValue('--text-primary').trim(),
        overlayBg: s.getPropertyValue('--overlay-bg').trim(),
        thumbBg: s.getPropertyValue('--thumb-placeholder-bg').trim(),
        badgeCc: s.getPropertyValue('--badge-cc-color').trim(),
      };
    });
    expect(tokens.bgPrimary.toLowerCase()).toBe('#0b0f19');
    expect(tokens.textPrimary.toLowerCase()).toBe('#f8fafc');
    expect(tokens.overlayBg).toBe('rgba(11, 15, 25, 0.75)');
    expect(tokens.thumbBg.toLowerCase()).toBe('#1e293b');
    expect(tokens.badgeCc.toLowerCase()).toBe('#34d399');
  });

  test('Light mode tokens render correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        bgPrimary: s.getPropertyValue('--bg-primary').trim(),
        textPrimary: s.getPropertyValue('--text-primary').trim(),
        overlayBg: s.getPropertyValue('--overlay-bg').trim(),
        drawerOverlayBg: s.getPropertyValue('--drawer-overlay-bg').trim(),
        thumbBg: s.getPropertyValue('--thumb-placeholder-bg').trim(),
        badgeCc: s.getPropertyValue('--badge-cc-color').trim(),
        badgeSpell: s.getPropertyValue('--badge-spell-tag').trim(),
      };
    });
    expect(tokens.bgPrimary.toLowerCase()).toBe('#f8fafc');
    expect(tokens.textPrimary.toLowerCase()).toBe('#0f172a');
    expect(tokens.overlayBg).toBe('rgba(15, 23, 42, 0.45)');
    expect(tokens.drawerOverlayBg).toBe('rgba(15, 23, 42, 0.4)');
    expect(tokens.thumbBg.toLowerCase()).toBe('#e2e8f0');
    expect(tokens.badgeCc.toLowerCase()).toBe('#059669');
    expect(tokens.badgeSpell.toLowerCase()).toBe('#92400e');
  });

  test('Theme toggle persists to localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();

    const savedTheme = await page.evaluate(() => localStorage.getItem('mlbb_theme'));
    expect(['light', 'dark']).toContain(savedTheme);

    // Reload: persisted theme is applied pre-paint (FOUC prevention)
    await page.reload({ waitUntil: 'networkidle' });
    const appliedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(appliedTheme).toBe(savedTheme);
  });

  test('No hardcoded dark colors on visible elements (light mode)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      try { localStorage.setItem('mlbb_theme', 'light'); } catch (e) {}
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const issues = await page.evaluate(() => {
      const bad = new Set(['rgb(30, 41, 59)', 'rgb(11, 15, 25)']);
      const out = [];
      for (const el of document.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // Tooltips are intentionally always-dark; skip ::before/::after-only nodes
        if (bad.has(style.backgroundColor)) {
          out.push(`${el.tagName}.${el.className}: bg=${style.backgroundColor}`);
        }
      }
      return out;
    });

    expect(issues).toHaveLength(0);
  });
});
