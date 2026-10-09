import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from './pages/LoginPage';
import { toCheckout } from './helpers';

// Accessibility checks with axe-core (WCAG 2.0/2.1 A + AA rules) on the main pages of the shop.
// Rule: any violation of the WCAG A/AA rules fails the run. Best-practice findings are BUG-013.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: any, extraRules: string[] = []) {
  const res = await new AxeBuilder({ page }).withTags([...WCAG, ...extraRules]).analyze();
  return res.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`);
}

const pages: [string, (p: any) => Promise<void>][] = [
  ['login', async (p) => new LoginPage(p).open()],
  ['catalog', async (p) => new LoginPage(p).loginOk()],
  ['cart', async (p) => { await new LoginPage(p).loginOk(); await p.locator('[data-test="shopping-cart-link"]').click(); }],
  ['checkout step 1', async (p) => toCheckout(p)],
];

test.describe('A11Y: WCAG A/AA rules (axe-core)', () => {
  for (const [name, go] of pages) {
    test(`TC-A11Y-01 ${name}: no WCAG A/AA violations`, { tag: '@a11y' }, async ({ page }) => {
      await go(page);
      expect(await scan(page)).toEqual([]);
    });
  }

  test('TC-A11Y-02 login works with the keyboard only', { tag: '@a11y' }, async ({ page, browserName, isMobile }) => {
    test.skip(browserName === 'webkit', 'Safari skips some controls with Tab by default, so the Tab order differs by design');
    test.skip(isMobile, 'keyboard test makes no sense on a touch device');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="username"]')).toBeFocused();
    await page.keyboard.type('standard_user');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="password"]')).toBeFocused();
    await page.keyboard.type('secret_sauce');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('TC-A11Y-03 every product image has alt text', { tag: '@a11y' }, async ({ page }) => {
    await new LoginPage(page).loginOk();
    const alts = await page.locator('.inventory_item_img img').evaluateAll((els) => els.map((e) => e.getAttribute('alt')));
    expect(alts.every((a) => a && a.trim().length > 0)).toBe(true);
  });

  test('BUG-013 pages have a main heading and all content sits in landmarks', { tag: '@a11y' }, async ({ page }) => {
    test.fail(true, 'BUG-013');
    await new LoginPage(page).open();
    // axe best-practice rules: page-has-heading-one, region
    expect(await scan(page, ['best-practice'])).toEqual([]);
  });
});
