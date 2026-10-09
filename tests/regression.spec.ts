import { test, expect } from '@playwright/test';
import { login, loginOk, addAll, prices, names, PRODUCTS } from './helpers';

// Regression suite: behaviour that SHOULD work (standard_user). Scenarios: docs/TEST-SCENARIOS.md.

test.describe('AUTH: login', () => {
  test('TC-AUTH-01 valid login opens the catalog', { tag: '@smoke' }, async ({ page }) => {
    await loginOk(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('TC-AUTH-02 a locked-out user gets a clear error', { tag: '@regression' }, async ({ page }) => {
    await login(page, 'locked_out_user');
    await expect(page.locator('[data-test="error"]')).toContainText('locked out');
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('TC-AUTH-03 a wrong password shows an error and blocks access', { tag: '@smoke' }, async ({ page }) => {
    await login(page, 'standard_user', 'spatne_heslo');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('TC-AUTH-04 an empty username shows an error', { tag: '@regression' }, async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('TC-AUTH-05 an empty password shows an error', { tag: '@regression' }, async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('TC-AUTH-06 a visitor who is not logged in cannot open the catalog by URL', { tag: '@regression' }, async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page.locator('[data-test="error"]')).toContainText('only access');
  });

  test('TC-AUTH-07 logout returns to the login page', { tag: '@regression' }, async ({ page }) => {
    await loginOk(page);
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('[data-test="logout-sidebar-link"]').click();
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });
});

test.describe('CAT: catalog', () => {
  test.beforeEach(async ({ page }) => loginOk(page));

  test('TC-CAT-01 shows 6 products with 6 different images', { tag: '@smoke' }, async ({ page }) => {
    await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(6);
    const srcs = await page.locator('.inventory_item_img img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
    expect(new Set(srcs).size).toBe(6);
  });

  test('TC-CAT-02 sorting A-Z and Z-A', { tag: '@regression' }, async ({ page }) => {
    const az = [...(await names(page))].sort();
    await page.locator('[data-test="product-sort-container"]').selectOption('az');
    expect(await names(page)).toEqual(az);
    await page.locator('[data-test="product-sort-container"]').selectOption('za');
    expect(await names(page)).toEqual([...az].reverse());
  });

  test('TC-CAT-03 sorting by price, both directions', { tag: '@regression' }, async ({ page }) => {
    await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
    const lohi = await prices(page);
    expect(lohi).toEqual([...lohi].sort((a, b) => a - b));
    await page.locator('[data-test="product-sort-container"]').selectOption('hilo');
    const hilo = await prices(page);
    expect(hilo).toEqual([...hilo].sort((a, b) => b - a));
  });

  test('TC-CAT-04 product detail matches the catalog', { tag: '@regression' }, async ({ page }) => {
    const name = (await names(page))[0];
    const price = (await page.locator('[data-test="inventory-item-price"]').first().textContent())!;
    await page.locator('[data-test="inventory-item-name"]').first().click();
    await expect(page.locator('[data-test="back-to-products"]')).toBeVisible(); // detail page is drawn
    await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(name);
    await expect(page.locator('[data-test="inventory-item-price"]')).toHaveText(price);
  });
});

test.describe('CART: cart', () => {
  test.beforeEach(async ({ page }) => loginOk(page));

  test('TC-CART-01 adding all 6 products sets the badge to 6', { tag: '@smoke' }, async ({ page }) => {
    await addAll(page);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('6');
  });

  test('TC-CART-02 removing a product lowers the badge', { tag: '@regression' }, async ({ page }) => {
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[0]}"]`).click();
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[1]}"]`).click();
    await page.locator(`[data-test="remove-${PRODUCTS[0]}"]`).click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('TC-CART-03 the cart contains exactly the chosen products', { tag: '@regression' }, async ({ page }) => {
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[2]}"]`).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(['Sauce Labs Bolt T-Shirt']);
  });

  test('TC-CART-04 the cart survives a page reload', { tag: '@regression' }, async ({ page }) => {
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[0]}"]`).click();
    await page.reload();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });
});

test.describe('CHK: checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginOk(page);
    await page.locator(`[data-test="add-to-cart-${PRODUCTS[0]}"]`).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
  });

  test('TC-CHK-01 a full purchase reaches the confirmation', { tag: '@smoke' }, async ({ page }) => {
    await page.locator('[data-test="firstName"]').fill('Jan');
    await page.locator('[data-test="lastName"]').fill('Novák');
    await page.locator('[data-test="postalCode"]').fill('11000');
    await page.locator('[data-test="continue"]').click();
    await expect(page).toHaveURL(/checkout-step-two/);
    await page.locator('[data-test="finish"]').click();
    await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
  });

  for (const [missing, fields, msg] of [
    ['first name', { lastName: 'Novák', postalCode: '11000' }, 'First Name is required'],
    ['last name', { firstName: 'Jan', postalCode: '11000' }, 'Last Name is required'],
    ['postal code', { firstName: 'Jan', lastName: 'Novák' }, 'Postal Code is required'],
  ] as const) {
    test(`TC-CHK-02 missing ${missing} shows an error`, { tag: '@regression' }, async ({ page }) => {
      for (const [k, v] of Object.entries(fields)) await page.locator(`[data-test="${k}"]`).fill(v);
      await page.locator('[data-test="continue"]').click();
      await expect(page.locator('[data-test="error"]')).toContainText(msg);
      await expect(page).toHaveURL(/checkout-step-one/);
    });
  }

  test('TC-CHK-03 overview total = items + tax', { tag: '@regression' }, async ({ page }) => {
    await page.locator('[data-test="firstName"]').fill('Jan');
    await page.locator('[data-test="lastName"]').fill('Novák');
    await page.locator('[data-test="postalCode"]').fill('11000');
    await page.locator('[data-test="continue"]').click();
    const num = async (sel: string) => parseFloat((await page.locator(sel).textContent())!.replace(/[^0-9.]/g, ''));
    const sub = await num('[data-test="subtotal-label"]');
    const tax = await num('[data-test="tax-label"]');
    const total = await num('[data-test="total-label"]');
    expect(total).toBeCloseTo(sub + tax, 2);
  });
});
