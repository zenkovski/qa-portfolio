import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { USERS } from './helpers';

// Login speed per account, measured as: click on Login -> catalog is visible.
// 5 runs per account, median and the slowest run are saved to reports/perf.json (the web page draws a chart from it).
// A median is used because one slow run (network hiccup) would spoil an average.

const RUNS = 5;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

test.describe('PERF: login time', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'timing is measured once, on desktop Chromium');
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  const result: Record<string, { median: number; max: number; runs: number[] }> = {};

  for (const user of [...USERS]) {
    test(`TC-PERF-01 ${user}: login timing (${RUNS} runs)`, { tag: '@perf' }, async ({ browser }) => {
      const runs: number[] = [];
      for (let i = 0; i < RUNS; i++) {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/');
        await page.locator('[data-test="username"]').fill(user);
        await page.locator('[data-test="password"]').fill('secret_sauce');
        const t0 = Date.now();
        await page.locator('[data-test="login-button"]').click();
        await page.locator('[data-test="inventory-item"]').first().waitFor({ timeout: 20_000 });
        runs.push(Date.now() - t0);
        await ctx.close();
      }
      result[user] = { median: median(runs), max: Math.max(...runs), runs };
      fs.mkdirSync('reports', { recursive: true });
      fs.writeFileSync('reports/perf.json', JSON.stringify({ measuredAt: new Date().toISOString(), runsPerUser: RUNS, users: result }, null, 2));
      if (user !== 'performance_glitch_user') expect(result[user].median, 'median login ms').toBeLessThan(1500);
    });
  }

  test('BUG-010b the slow account is at least 5x slower than a normal one (documents the delay)', { tag: '@perf' }, async () => {
    const slow = result['performance_glitch_user'].median;
    const normal = result['standard_user'].median;
    console.log(`median login: standard ${normal} ms, performance_glitch_user ${slow} ms`);
    expect(slow).toBeGreaterThan(normal * 5);
  });

  test('TC-PERF-02 the login page loads in under 3 seconds', { tag: '@perf' }, async ({ page }) => {
    await page.goto('/');
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) };
    });
    console.log('navigation timing', nav);
    expect(nav.load).toBeLessThan(3000);
  });
});
