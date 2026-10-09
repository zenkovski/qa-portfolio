import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { toCheckout, shot } from './helpers';

// Basic, non-destructive security checks that any tester can do from the browser.
// The target is a public practice shop built for this purpose. Nothing is attacked, nothing is stored.

test.describe('SEC: session and input handling', () => {
  test('BUG-011 a made-up session cookie must not open the catalog', { tag: '@security' }, async ({ context, page }, info) => {
    test.fail(true, 'BUG-011');
    await context.addCookies([{ name: 'session-username', value: 'standard_user', domain: 'www.saucedemo.com', path: '/' }]);
    await page.goto('/inventory.html');
    await shot(page, `BUG-011-${info.project.name}`);
    // correct behaviour: a cookie that was not issued by a real login is rejected
    await expect(page.locator('[data-test="error"]')).toContainText('only access');
  });

  test('BUG-012 the session cookie is HttpOnly and Secure', { tag: '@security' }, async ({ context, page }) => {
    test.fail(true, 'BUG-012');
    await new LoginPage(page).loginOk();
    const c = (await context.cookies()).find((x) => x.name === 'session-username')!;
    expect(c, 'session cookie exists').toBeTruthy();
    expect(c.httpOnly).toBe(true);
    expect(c.secure).toBe(true);
  });

  test('TC-SEC-03 plain http redirects to https', { tag: '@security' }, async ({ request }) => {
    const res = await request.get('http://www.saucedemo.com/', { maxRedirects: 0 }).catch((e) => e);
    // a redirect to https or a refused connection is fine; an open http page is not
    const status = 'status' in res ? res.status() : 0;
    const loc = 'headers' in res ? (res.headers()['location'] ?? '') : '';
    expect(status === 0 || (status >= 300 && status < 400 && loc.startsWith('https://'))).toBe(true);
  });

  test('TC-SEC-04 script in the login field is not executed', { tag: '@security' }, async ({ page }) => {
    let dialog = '';
    page.on('dialog', async (d) => { dialog = d.message(); await d.dismiss(); });
    const login = new LoginPage(page);
    await login.login('<img src=x onerror=alert(1)>', '<script>alert(2)</script>');
    await page.waitForTimeout(500);
    expect(dialog).toBe('');
    await expect(login.error).toBeVisible();
    expect(await login.error.innerHTML()).not.toContain('<img');
  });

  test('TC-SEC-05 script in checkout fields is not executed', { tag: '@security' }, async ({ page }) => {
    let dialog = '';
    page.on('dialog', async (d) => { dialog = d.message(); await d.dismiss(); });
    await toCheckout(page);
    await page.locator('[data-test="firstName"]').fill('<img src=x onerror=alert(1)>');
    await page.locator('[data-test="lastName"]').fill('"><script>alert(2)</script>');
    await page.locator('[data-test="postalCode"]').fill("' OR 1=1 --");
    await page.locator('[data-test="continue"]').click();
    await page.waitForTimeout(500);
    expect(dialog).toBe('');
  });

  test('TC-SEC-06 cart and checkout pages need a logged-in session', { tag: '@security' }, async ({ page }) => {
    for (const path of ['/cart.html', '/checkout-step-one.html', '/checkout-step-two.html', '/checkout-complete.html']) {
      await page.goto(path);
      await expect(page.locator('[data-test="error"]'), path).toContainText('only access');
    }
  });

  test('TC-SEC-07 logging out ends the session', { tag: '@security' }, async ({ page }) => {
    await new LoginPage(page).loginOk();
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('[data-test="logout-sidebar-link"]').click();
    await page.goto('/inventory.html');
    await expect(page.locator('[data-test="error"]')).toContainText('only access');
  });
});
