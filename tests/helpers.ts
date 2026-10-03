import { Page, expect } from '@playwright/test';

export const PASSWORD = 'secret_sauce'; // veřejné heslo ze stránky Sauce Demo, je to cvičná aplikace

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
}

export async function addAll(page: Page) {
  for (const id of PRODUCTS) {
    await page.locator(`[data-test="add-to-cart-${id}"]`).click();
  }
}

export const prices = async (page: Page) =>
  (await page.locator('[data-test="inventory-item-price"]').allTextContents()).map((t) => parseFloat(t.replace('$', '')));

export const names = async (page: Page) => page.locator('[data-test="inventory-item-name"]').allTextContents();
