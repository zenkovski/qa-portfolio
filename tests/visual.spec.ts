import { test, expect, Page } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import * as fs from 'fs';
import { LoginPage } from './pages/LoginPage';
import { shot } from './helpers';

// Visual checks without stored baseline images.
// A baseline PNG made on one computer never matches a screenshot from another OS, so every comparison
// here is done inside one run: the same page for two users (or two loads), compared pixel by pixel.

async function catalogShot(page: Page, user: string) {
  await new LoginPage(page).loginOk(user);
  await page.locator('[data-test="inventory-item"]').first().waitFor();
  await page.waitForTimeout(400); // let images and fonts settle
  return PNG.sync.read(await page.screenshot());
}

function diffPixels(a: PNG, b: PNG, out?: PNG) {
  const { width, height } = a;
  const target = out ?? new PNG({ width, height });
  return pixelmatch(a.data, b.data, target.data, width, height, { threshold: 0.1, alpha: 0.35, diffColor: [255, 40, 90] });
}

/** Stacks images vertically into one PNG (used as evidence: standard / visual / difference). */
function stack(images: PNG[], gap = 6) {
  const width = images[0].width;
  const height = images.reduce((h, i) => h + i.height + gap, -gap);
  const out = new PNG({ width, height });
  out.data.fill(255);
  let y = 0;
  for (const img of images) { PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, y); y += img.height + gap; }
  return out;
}

test.describe('VIS: visual comparison', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'pixel comparison is only stable inside one engine; run on desktop Chromium');

  test('TC-VIS-01 the catalog renders identically on two loads (the check itself is stable)', { tag: '@visual' }, async ({ browser }) => {
    const shots: PNG[] = [];
    for (let i = 0; i < 2; i++) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      shots.push(await catalogShot(await ctx.newPage(), 'standard_user'));
      await ctx.close();
    }
    expect(diffPixels(shots[0], shots[1])).toBe(0);
  });

  test('BUG-015 visual_user: header and layout match standard_user', { tag: '@visual' }, async ({ browser }, info) => {
    test.fail(true, 'BUG-015');
    // Compare only the header strip (logo, cart, sort). Prices and images are covered by BUG-008/009.
    const header: PNG[] = [];
    for (const user of ['standard_user', 'visual_user']) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const pg = await ctx.newPage();
      const png = await catalogShot(pg, user);
      if (user === 'visual_user') await shot(pg, `BUG-015-${info.project.name}`);
      await ctx.close();
      const strip = new PNG({ width: png.width, height: 120 });
      PNG.bitblt(png, strip, 0, 0, png.width, 120, 0, 0);
      header.push(strip);
    }
    const diff = new PNG({ width: header[0].width, height: header[0].height });
    const n = diffPixels(header[0], header[1], diff);
    fs.mkdirSync('evidence', { recursive: true });
    // evidence: standard_user header, visual_user header, difference (red = changed pixels)
    fs.writeFileSync(`evidence/BUG-015-${info.project.name}-diff.png`, PNG.sync.write(stack([header[0], header[1], diff])));
    console.log('BUG-015 different header pixels:', n);
    expect(n, 'different pixels in the header strip').toBe(0);
  });
});
