import { Page } from '@playwright/test';

export class CheckoutPage {
  constructor(readonly page: Page) {}
  firstName = this.page.locator('[data-test="firstName"]');
  lastName = this.page.locator('[data-test="lastName"]');
  postalCode = this.page.locator('[data-test="postalCode"]');
  next = this.page.locator('[data-test="continue"]');
  error = this.page.locator('[data-test="error"]');
  finish = this.page.locator('[data-test="finish"]');

  async fill(first: string, last: string, zip: string) {
    await this.firstName.fill(first);
    await this.lastName.fill(last);
    await this.postalCode.fill(zip);
  }
}
