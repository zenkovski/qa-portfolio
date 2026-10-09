import { Page, expect } from '@playwright/test';
import { PASSWORD } from '../helpers';

/** Page Object: přihlašovací stránka. Selektory jsou na jednom místě, testy čtou jako věty. */
export class LoginPage {
  constructor(readonly page: Page) {}
  username = this.page.locator('[data-test="username"]');
  password = this.page.locator('[data-test="password"]');
  submit = this.page.locator('[data-test="login-button"]');
  error = this.page.locator('[data-test="error"]');

  async open() { await this.page.goto('/'); }

  async login(user: string, password = PASSWORD) {
    await this.open();
    await this.username.fill(user);
    await this.password.fill(password);
    await this.submit.click();
  }

  async loginOk(user = 'standard_user') {
    await this.login(user);
    await expect(this.page).toHaveURL(/inventory\.html/);
  }
}
