import { test, expect } from '@playwright/test';
import { toCheckout, shot } from './helpers';
import { CheckoutPage } from './pages/CheckoutPage';

// Data-driven checks for the checkout form: boundaries, special characters, unicode.
// One table row = one test, so a new case is one new line.

const accepted: [string, string, string, string][] = [
  ['czech diacritics', 'Žluťoučký', 'Kůň úpěl', '11000'],
  ['one-character values', 'A', 'B', '1'],
  ['very long values (300 chars)', 'a'.repeat(300), 'b'.repeat(300), '9'.repeat(300)],
  ['special characters', "O'Brien-Smith", 'Müller & Søn', '110 00'],
  ['emoji', '🙂', '🚀', '11000'],
  ['markup as plain text', '<b>bold</b>', '</div>', '11000'],
];

test.describe('CHK-DATA: valid input is accepted', () => {
  for (const [name, first, last, zip] of accepted) {
    test(`TC-CHK-10 ${name}`, { tag: '@regression' }, async ({ page }) => {
      await toCheckout(page);
      const c = new CheckoutPage(page);
      await c.fill(first, last, zip);
      await c.next.click();
      await expect(page).toHaveURL(/checkout-step-two/);
    });
  }
});

test.describe('CHK-DATA: input that should be rejected', () => {
  test('BUG-014 a first name made only of spaces is rejected', { tag: '@regression' }, async ({ page }, info) => {
    test.fail(true, 'BUG-014');
    await toCheckout(page);
    const c = new CheckoutPage(page);
    await c.fill('     ', 'Novák', '11000');
    await c.next.click();
    await shot(page, `BUG-014-${info.project.name}`);
    await expect(c.error).toContainText('First Name is required');
  });

  test('BUG-014b a postal code made only of spaces is rejected', { tag: '@regression' }, async ({ page }) => {
    test.fail(true, 'BUG-014');
    await toCheckout(page);
    const c = new CheckoutPage(page);
    await c.fill('Jan', 'Novák', '   ');
    await c.next.click();
    await expect(c.error).toContainText('Postal Code is required');
  });
});

test.describe('CHK-FLOW: state between steps', () => {
  test('TC-CHK-20 cancel on step 1 returns to the cart and keeps the item', { tag: '@regression' }, async ({ page }) => {
    await toCheckout(page);
    await page.locator('[data-test="cancel"]').click();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(1);
  });

  test('TC-CHK-21 after the order the cart is empty', { tag: '@regression' }, async ({ page }) => {
    await toCheckout(page);
    const c = new CheckoutPage(page);
    await c.fill('Jan', 'Novák', '11000');
    await c.next.click();
    await c.finish.click();
    await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
  });

  test('TC-CHK-22 order overview lists the chosen product and its price', { tag: '@regression' }, async ({ page }) => {
    await toCheckout(page);
    const c = new CheckoutPage(page);
    await c.fill('Jan', 'Novák', '11000');
    await c.next.click();
    await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText('Sauce Labs Backpack');
    await expect(page.locator('[data-test="subtotal-label"]')).toContainText('29.99');
  });

  test('TC-CHK-23 tax is 8% of the item total (rounded to cents)', { tag: '@regression' }, async ({ page }) => {
    await toCheckout(page);
    const c = new CheckoutPage(page);
    await c.fill('Jan', 'Novák', '11000');
    await c.next.click();
    const num = async (s: string) => parseFloat((await page.locator(s).textContent())!.replace(/[^0-9.]/g, ''));
    const sub = await num('[data-test="subtotal-label"]');
    const tax = await num('[data-test="tax-label"]');
    expect(tax).toBeCloseTo(Math.round(sub * 8) / 100, 2);
  });
});
