import { test, expect } from '@playwright/test';
import { loginOk, addAll, prices, names, PRODUCTS } from './helpers';
import * as fs from 'fs';

// Testy, které popisují SPRÁVNÉ chování, ale u účtů „problem_user“, „error_user“, „visual_user“
// a „performance_glitch_user“ aplikace chybuje. Každý je označen test.fail(): suite je zelená,
// dokud chyba existuje. Až ji někdo opraví, test začne „neočekávaně procházet“ a upozorní na to.
// Popis každé chyby je v reports/BUG-REPORTS.md.

const shot = async (page: any, name: string) => {
  fs.mkdirSync('evidence', { recursive: true });
  await page.screenshot({ path: `evidence/${name}.png`, fullPage: false });
};

test.describe('problem_user', () => {
  test.beforeEach(async ({ page }) => loginOk(page, 'problem_user'));

  test('BUG-001 produkty mají vlastní obrázky', async ({ page }, info) => {
    test.fail(true, 'BUG-001');
    const srcs = await page.locator('.inventory_item_img img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
    await shot(page, `BUG-001-${info.project.name}`);
    expect(new Set(srcs).size).toBe(6);
  });

  test('BUG-002 řazení Z–A změní pořadí', async ({ page }, info) => {
    test.fail(true, 'BUG-002');
    const before = await names(page);
    await page.locator('[data-test="product-sort-container"]').selectOption('za');
    await shot(page, `BUG-002-${info.project.name}`);
    expect(await names(page)).toEqual([...before].sort().reverse());
  });

  test('BUG-003 všech 6 produktů jde přidat do košíku', async ({ page }, info) => {
    test.fail(true, 'BUG-003');
    for (const id of PRODUCTS) await page.locator(`[data-test="add-to-cart-${id}"]`).click();
    await shot(page, `BUG-003-${info.project.name}`);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('6', { timeout: 2000 });
  });

  test('BUG-004 pole Příjmení v pokladně přijme příjmení', async ({ page }, info) => {
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

  test('BUG-005 řazení nehlásí chybu', async ({ page }, info) => {
    test.fail(true, 'BUG-005');
    let alert = '';
    page.on('dialog', async (d) => { alert = d.message(); await d.dismiss(); });
    await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
    await page.waitForTimeout(500);
    await shot(page, `BUG-005-${info.project.name}`);
    expect(alert).toBe('');
  });

  test('BUG-006 všech 6 produktů jde přidat do košíku', async ({ page }, info) => {
    test.fail(true, 'BUG-006');
    for (const id of PRODUCTS) await page.locator(`[data-test="add-to-cart-${id}"]`).click();
    await shot(page, `BUG-006-${info.project.name}`);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('6', { timeout: 2000 });
  });

  test('BUG-007 příjmení se uloží a pokladna ho nenechá prázdné', async ({ page }, info) => {
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

  test('BUG-008 ceny odpovídají ceníku', async ({ page }, info) => {
    test.fail(true, 'BUG-008');
    const expected = [29.99, 9.99, 15.99, 49.99, 7.99, 15.99];
    await shot(page, `BUG-008-${info.project.name}`);
    expect(await prices(page)).toEqual(expected);
  });

  test('BUG-009 první produkt má vlastní obrázek', async ({ page }) => {
    test.fail(true, 'BUG-009');
    const src = await page.locator('.inventory_item_img img').first().getAttribute('src');
    expect(src).not.toContain('sl-404');
  });
});

test.describe('performance_glitch_user', () => {
  test('BUG-010 přihlášení trvá do 2 sekund', async ({ page }) => {
    test.fail(true, 'BUG-010');
    const t0 = Date.now();
    await page.goto('/');
    await page.locator('[data-test="username"]').fill('performance_glitch_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/inventory/, { timeout: 15_000 });
    const ms = Date.now() - t0;
    console.log(`performance_glitch_user: přihlášení trvalo ${ms} ms`);
    expect(ms).toBeLessThan(2000);
  });
});
