import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openRag, RAG, stubHit } from './rag.helpers';

// UI flows of the RAG demo. Presets only: the page shows a stored answer, no model call happens.
// "/api/hit" (click counter) is stubbed in every test so the production statistics stay clean.

test.describe('RAG-UI: what a visitor sees', () => {
  test('TC-RAG-40 page loads with title, heading and 6 preset questions', { tag: '@rag' }, async ({ page }) => {
    await openRag(page);
    await expect(page).toHaveTitle(/Pracovní právo/);
    await expect(page.locator('h1').first()).toContainText('Každá věta má zdroj');
    await expect(page.locator('#chips button')).toHaveCount(6);
  });

  test('TC-RAG-41 a preset question shows an answer with citations', { tag: '@rag' }, async ({ page, isMobile }) => {
    test.skip(isMobile, 'on a phone the preset chips are hidden by design; the phone flow is TC-RAG-49');
    await openRag(page);
    await page.locator('#chips button').first().click();
    // the demo plays a short "thinking" animation first, then writes the stored answer
    await expect(page.locator('#log .msg.bot').last()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#log .cite').first()).toBeVisible();
  });

  test('TC-RAG-42 clicking a citation opens the source card with the law text', { tag: '@rag' }, async ({ page, isMobile }) => {
    test.skip(isMobile, 'on a phone the answer panel is hidden by design');
    await openRag(page);
    await page.locator('#chips button').first().click();
    await page.locator('#log .cite').first().click({ timeout: 20_000 });
    await expect(page.locator('#src')).toContainText(/§/);
    await expect(page.locator('#src')).not.toContainText('Tady uvidíš původní text');
  });

  test('TC-RAG-43 choosing a category fills the question list', { tag: '@rag' }, async ({ page }) => {
    await openRag(page);
    expect(await page.locator('#cats button').count()).toBeGreaterThanOrEqual(5);
    await page.locator('#cats button').nth(1).click();
    await expect(page.locator('#qs .qb').first()).toBeVisible();
  });

  test('TC-RAG-44 the text filter finds a question and shows a message when nothing matches', { tag: '@rag' }, async ({ page }) => {
    await openRag(page);
    await page.locator('#filter').fill('dovolen');
    await expect.poll(() => page.locator('#qs .qb').count()).toBeGreaterThan(0);
    await page.locator('#filter').fill('zzzzqqqq');
    await expect(page.locator('#qs')).toContainText('taková otázka není');
  });

  test('TC-RAG-45 the map draws one point per chunk (2475)', { tag: '@rag' }, async ({ page }) => {
    await openRag(page);
    await expect.poll(() => page.locator('svg circle').count()).toBe(2475);
  });

  test('TC-RAG-46 a legal disclaimer is visible', { tag: '@rag' }, async ({ page }) => {
    await openRag(page);
    await expect(page.locator('.warnline').first()).toBeVisible();
    await expect(page.locator('.warnline').first()).toContainText(/právní|poradenství|nenahrazuje|informativní/i);
  });

  test('TC-RAG-47 phone: the page does not scroll sideways', { tag: '@rag' }, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only');
    await openRag(page);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(1);
  });

  test('TC-RAG-49 phone: a question can be chosen from the categories', { tag: '@rag' }, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only');
    await openRag(page);
    await expect(page.locator('#chips button').first()).toBeHidden();
    await page.locator('#cats button').nth(1).click();
    await expect(page.locator('#qs .qb').first()).toBeVisible();
  });

  test('TC-RAG-48 clicking a preset sends a click counter request (stubbed here)', { tag: '@rag' }, async ({ page, isMobile }) => {
    test.skip(isMobile, 'on a phone the preset chips are hidden by design');
    const hits: string[] = [];
    await page.route('**/api/hit', (route) => {
      hits.push(route.request().method());
      return route.fulfill({ status: 204, body: '' });
    });
    await page.goto(RAG + '/');
    await page.locator('#chips button').first().click();
    await expect.poll(() => hits.length).toBeGreaterThan(0);
    expect(hits[0]).toBe('POST');
  });
});

test.describe('RAG-QUALITY: accessibility, errors, speed, headers', () => {
  test('TC-RAG-52 first content shows in under 4 s (largest paint)', { tag: ['@rag', '@perf'] }, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'the LCP API exists in Chromium only');
    await stubHit(page);
    await page.goto(RAG + '/', { waitUntil: 'load' });
    const lcp = await page.evaluate(
      () => new Promise<number>((resolve) => {
        new PerformanceObserver((l) => resolve(l.getEntries().at(-1)!.startTime)).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(-1), 3000);
      })
    );
    test.info().annotations.push({ type: 'lcp-ms', description: String(Math.round(lcp)) });
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(4000);
  });

  test('TC-RAG-53 the page is served over HTTPS with HSTS', { tag: ['@rag', '@security'] }, async ({ request }) => {
    const res = await request.get(RAG + '/');
    expect(res.headers()['strict-transport-security']).toMatch(/max-age=\d+/);
  });

  // ---- known defects of the target (expected to fail, see reports/BUG-REPORTS.md) ----

  test('BUG-RAG-01 the page loads without failed requests and console errors', { tag: '@rag' }, async ({ page }) => {
    test.fail(true, 'BUG-RAG-01');
    const { consoleErrors, failed } = await openRag(page);
    await page.waitForTimeout(1500);
    // today: 404 for /_vercel/insights/script.js on every load
    expect([...failed, ...consoleErrors.filter((e) => !/Failed to load resource/.test(e))]).toEqual([]);
  });

  test('BUG-RAG-02 no WCAG A/AA violations (axe-core)', { tag: ['@rag', '@a11y'] }, async ({ page, browserName }) => {
    test.fail(true, 'BUG-RAG-02');
    test.skip(browserName !== 'chromium', 'axe on 2475 map points takes too long in Firefox and WebKit; the rules are the same in all browsers');
    await openRag(page);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    // today: color-contrast (desktop x15, phone x1); on a phone also button-name x2 and link-name x6 (icon-only controls)
    expect(res.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`)).toEqual([]);
  });

  test('BUG-RAG-03 security headers: CSP, X-Content-Type-Options, frame protection', { tag: ['@rag', '@security'] }, async ({ request }) => {
    test.fail(true, 'BUG-RAG-03');
    const h = (await request.get(RAG + '/')).headers();
    const missing = [
      !h['content-security-policy'] && 'Content-Security-Policy',
      h['x-content-type-options'] !== 'nosniff' && 'X-Content-Type-Options: nosniff',
      !h['x-frame-options'] && !/frame-ancestors/.test(h['content-security-policy'] ?? '') && 'X-Frame-Options / frame-ancestors',
    ].filter(Boolean);
    expect(missing).toEqual([]);
  });

  test('BUG-RAG-04 third-party scripts carry a Subresource Integrity hash', { tag: ['@rag', '@security'] }, async ({ request }) => {
    test.fail(true, 'BUG-RAG-04');
    const html = await (await request.get(RAG + '/')).text();
    const external = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:\/\/[^"]+)"[^>]*>/g)].filter((m) => /<script|stylesheet/.test(m[0]));
    const without = external.filter((m) => !/integrity=/.test(m[0])).map((m) => m[1]);
    // today: unpkg.com (Phosphor icons) and cdnjs.cloudflare.com (d3) are loaded without integrity
    expect(without).toEqual([]);
  });
});
