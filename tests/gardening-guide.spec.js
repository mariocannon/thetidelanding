import { expect, test } from '@playwright/test';

import { guides } from '../src/data/gardening-guides.js';
import { pages as guidePages } from '../src/data/gardening-guides.generated.js';

/** Newest first, the order the hub shows them in. */
const newestFirst = [...guides].sort((a, b) => b.date.localeCompare(a.date));
const featured = newestFirst[0];

test('the hub shows the newest guide inline, with the PDF to download', async ({ page }) => {
  test.skip(guides.length === 0, 'no guides in src/data/gardening-guides.js yet');
  await page.goto('/gardening-guide');

  await expect(page.locator('h1')).toHaveText("The Tide's Local Gardening Guide");
  await expect(page.locator('.guide .guide-head h2')).toHaveText(featured.label);

  // One image per section in the manifest, in order, all pointing at this
  // month's folder.
  const manifest = guidePages[featured.slug] ?? [];
  expect(manifest.length).toBeGreaterThan(0);
  const srcs = await page
    .locator('.guide-pages img')
    .evaluateAll((imgs) => imgs.map((img) => new URL(img.src).pathname));
  expect(srcs).toEqual(manifest.map((p) => `/gardening-guide/${featured.slug}/${p.src}`));

  // Both download links point at the copied PDF.
  const pdfHrefs = await page
    .locator(`a.pdf`)
    .evaluateAll((links) => links.map((a) => new URL(a.href).pathname));
  expect(new Set(pdfHrefs)).toEqual(new Set([`/gardening-guide/${featured.slug}.pdf`]));
});

test('every image and the PDF actually resolve', async ({ page, request }) => {
  test.skip(guides.length === 0, 'no guides yet');
  await page.goto('/gardening-guide');

  const urls = await page
    .locator('.guide-pages img')
    .evaluateAll((imgs) => imgs.map((img) => img.src));
  urls.push(await page.locator('a.pdf').first().getAttribute('href'));

  for (const url of urls) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
  }
});

test('the reserved space matches the image, so nothing shifts on load', async ({ page }) => {
  test.skip(guides.length === 0, 'no guides yet');
  await page.goto('/gardening-guide');
  // width/height attributes are set from the manifest — the ratio the browser
  // reserves has to be the ratio the file actually is.
  const manifest = guidePages[featured.slug] ?? [];
  const attrs = await page.locator('.guide-pages img').evaluateAll((imgs) =>
    imgs.map((img) => ({
      w: Number(img.getAttribute('width')),
      h: Number(img.getAttribute('height')),
    }))
  );
  expect(attrs).toEqual(manifest.map((p) => ({ w: p.w, h: p.h })));
});

test('earlier months are listed under the featured one, newest first', async ({ page }) => {
  test.skip(guides.length === 0, 'no guides yet');
  await page.goto('/gardening-guide');

  const earlier = newestFirst.slice(1);
  const links = page.locator('.earlier li a');
  await expect(links).toHaveCount(earlier.length);
  if (earlier.length > 0) {
    const hrefs = await links.evaluateAll((as) => as.map((a) => new URL(a.href).pathname));
    expect(hrefs).toEqual(earlier.map((g) => `/gardening-guide/${g.slug}`));
  }
});

test('each guide has its own page at /gardening-guide/<slug>', async ({ page }) => {
  test.skip(guides.length === 0, 'no guides yet');
  for (const guide of guides) {
    await page.goto(`/gardening-guide/${guide.slug}`);
    await expect(page.locator('h1')).toHaveText(guide.label);
    await expect(page.locator('.back')).toHaveAttribute('href', '/gardening-guide');
    const manifest = guidePages[guide.slug] ?? [];
    await expect(page.locator('.guide-pages img')).toHaveCount(manifest.length);
  }
});

test('the page loads nothing from anywhere else', async ({ page }) => {
  const offsite = [];
  page.on('request', (request) => {
    if (!new URL(request.url()).host.startsWith('localhost')) offsite.push(request.url());
  });
  await page.goto('/gardening-guide', { waitUntil: 'networkidle' });
  // scroll so the lazy images below the fold get their chance too
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  expect(offsite).toEqual([]);
});

test('the subscribe form posts the email and nothing else', async ({ page }) => {
  let posted;
  await page.route('**/rest/v1/subscribers*', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ status: 201, body: '' });
  });

  await page.goto('/gardening-guide');
  await page.fill('#email', ' Coastie@Example.COM ');
  await page.click('#subscribe-form button[type="submit"]');

  await expect(page.locator('#subscribe-note')).toHaveClass(/success/);
  expect(posted).toEqual({ email: 'coastie@example.com' });
});

test('never scrolls sideways', async ({ page }) => {
  for (const path of ['/gardening-guide', `/gardening-guide/${featured?.slug ?? '2026-09'}`]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow, path).toBe(false);
  }
});
