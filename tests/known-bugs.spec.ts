import { test, expect } from '@playwright/test';
import { loginOk, addAll, prices, names, PRODUCTS } from './helpers';
import * as fs from 'fs';

// Tests that describe the CORRECT behaviour, but accounts problem_user, error_user, visual_user
// and performance_glitch_user get it wrong. Each is marked test.fail(): the suite stays green
// while the bug exists. When someone fixes it, the test starts to pass unexpectedly and says so.
// Every bug is described in reports/BUG-REPORTS.md.

const shot = async (page: any, name: string) => {
  fs.mkdirSync('evidence', { recursive: true });
  await page.screenshot({ path: `evidence/${name}.png`, fullPage: false });
};

test.describe('problem_user', () => {
  test.beforeEach(async ({ page }) => loginOk(page, 'problem_user'));

  test('BUG-001 each product has its own image', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-001');
    const srcs = await page.locator('.inventory_item_img img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
    await shot(page, `BUG-001-${info.project.name}`);
    expect(new Set(srcs).size).toBe(6);
  });

  test('BUG-002 sorting Z-A changes the order', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-002');
    const before = await names(page);
    await page.locator('[data-test="product-sort-container"]').selectOption('za');
    await shot(page, `BUG-002-${info.project.name}`);
    expect(await names(page)).toEqual([...before].sort().reverse());
  });

  test('BUG-003 all 6 products can be added to the cart', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-003');
    for (const id of PRODUCTS) await page.locator(`[data-test="add-to-cart-${id}"]`).click();
    await shot(page, `BUG-003-${info.project.name}`);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('6', { timeout: 2000 });
  });

  test('BUG-004 the Last Name field accepts a last name', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-004');
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[0]}"]`).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill('Jan');
    await page.locator('[data-test="lastName"]').fill('Novák');
    await shot(page, `BUG-004-${info.project.name}`);
    await expect(page.locator('[data-test="firstName"]')).toHaveValue('Jan', { timeout: 2000 });
    await expect(page.locator('[data-test="lastName"]')).toHaveValue('Novák', { timeout: 2000 });
  });
});

test.describe('error_user', () => {
  test.beforeEach(async ({ page }) => loginOk(page, 'error_user'));

  test('BUG-005 sorting does not raise an error', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-005');
    let alert = '';
    page.on('dialog', async (d) => { alert = d.message(); await d.dismiss(); });
    await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
    await page.waitForTimeout(500);
    await shot(page, `BUG-005-${info.project.name}`);
    expect(alert).toBe('');
  });

  test('BUG-006 all 6 products can be added to the cart', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-006');
    for (const id of PRODUCTS) await page.locator(`[data-test="add-to-cart-${id}"]`).click();
    await shot(page, `BUG-006-${info.project.name}`);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('6', { timeout: 2000 });
  });

  test('BUG-007 the last name is kept and checkout does not allow it empty', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-007');
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[0]}"]`).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill('Jan');
    await page.locator('[data-test="lastName"]').fill('Novák');
    await page.locator('[data-test="postalCode"]').fill('11000');
    await page.locator('[data-test="continue"]').click();
    await shot(page, `BUG-007-${info.project.name}`);
    await expect(page).toHaveURL(/checkout-step-one|checkout-step-two/);
    await expect(page.locator('[data-test="lastName"]')).toHaveValue('Novák', { timeout: 2000 });
  });
});

test.describe('visual_user', () => {
  test.beforeEach(async ({ page }) => loginOk(page, 'visual_user'));

  test('BUG-008 prices match the price list', { tag: '@bug' }, async ({ page }, info) => {
    test.fail(true, 'BUG-008');
    const expected = [29.99, 9.99, 15.99, 49.99, 7.99, 15.99];
    await shot(page, `BUG-008-${info.project.name}`);
    expect(await prices(page)).toEqual(expected);
  });

  test('BUG-009 the first product has its own image', { tag: '@bug' }, async ({ page }) => {
    test.fail(true, 'BUG-009');
    const src = await page.locator('.inventory_item_img img').first().getAttribute('src');
    expect(src).not.toContain('sl-404');
  });
});

// BUG-010 (slow login of performance_glitch_user) is tested in tests/performance.spec.ts on the median of 5 runs:
// a single run was not reliable, because the delay of this account is not always the same.
