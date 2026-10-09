import { Page, expect } from '@playwright/test';
import * as fs from 'fs';

export const PASSWORD = 'secret_sauce'; // public password shown on the Sauce Demo login page (practice app)

export const PRODUCTS = [
  'sauce-labs-backpack',
  'sauce-labs-bike-light',
  'sauce-labs-bolt-t-shirt',
  'sauce-labs-fleece-jacket',
  'sauce-labs-onesie',
  'test.allthethings()-t-shirt-(red)',
];

export async function login(page: Page, user: string, password = PASSWORD) {
  await page.goto('/');
  await page.locator('[data-test="username"]').fill(user);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();
}

export async function loginOk(page: Page, user = 'standard_user') {
  await login(page, user);
  await expect(page).toHaveURL(/inventory\.html/);
  // wait until the list is drawn: WebKit reports the URL before the products are in the page
  await expect(page.locator('[data-test="inventory-item"]').first()).toBeVisible();
}

export async function addAll(page: Page) {
  for (const id of PRODUCTS) {
    await page.locator(`[data-test="add-to-cart-${id}"]`).click();
  }
}

export const prices = async (page: Page) =>
  (await page.locator('[data-test="inventory-item-price"]').allTextContents()).map((t) => parseFloat(t.replace('$', '')));

export const names = async (page: Page) => page.locator('[data-test="inventory-item-name"]').allTextContents();

/** The test accounts of the practice app. */
export const USERS = ['standard_user', 'problem_user', 'error_user', 'visual_user', 'performance_glitch_user'] as const;

/** Goes to checkout step 1 with one product in the cart. */
export async function toCheckout(page: Page, user = 'standard_user') {
  await loginOk(page, user);
  await page.locator(`[data-test="add-to-cart-${PRODUCTS[0]}"]`).click();
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.locator('[data-test="checkout"]').click();
}

/** Saves a screenshot as evidence for a bug report. */
export async function shot(page: Page, name: string) {
  fs.mkdirSync('evidence', { recursive: true });
  await page.screenshot({ path: `evidence/${name}.png` });
}
