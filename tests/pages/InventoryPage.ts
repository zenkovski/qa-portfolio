import { Page } from '@playwright/test';
import { PRODUCTS } from '../helpers';

export class InventoryPage {
  constructor(readonly page: Page) {}
  items = this.page.locator('[data-test="inventory-item"]');
  sort = this.page.locator('[data-test="product-sort-container"]');
  cartLink = this.page.locator('[data-test="shopping-cart-link"]');
  cartBadge = this.page.locator('[data-test="shopping-cart-badge"]');

  add(index = 0) { return this.page.locator(`[data-test="add-to-cart-${PRODUCTS[index]}"]`).click(); }
  openCart() { return this.cartLink.click(); }
}
