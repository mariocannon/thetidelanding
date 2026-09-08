import { expect, test } from '@playwright/test';

// The seeker-facing listings page is built from a build-time PostgREST fetch of
// `Job` in the shared Newsletter ad management project — the same arrangement
// tests/directory.spec.js runs against for the directory. This repo has no
// credential to plant a row there and shouldn't, so these tests check the
// page's own chrome and its behaviour with whatever the shared project
// currently holds (an empty board until the table and its policies deploy).

test.beforeEach(async ({ page }) => {
  await page.goto('/hibiscus-coast-jobs');
});

test('carries a full, canonical head', async ({ page }) => {
  await expect(page).toHaveTitle(/Hibiscus Coast Jobs/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://thetide.co.nz/hibiscus-coast-jobs'
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f0e7d6');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Hibiscus Coast Jobs/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /svg\+xml/);
});

test('leads with the logo and the one clear action', async ({ page }) => {
  await expect(page.locator('.head .home img')).toHaveAttribute('src', '/logo.webp');
  await expect(page.locator('h1')).toHaveText('Jobs on the Coast');
  await expect(page.locator('.foot .post a')).toHaveAttribute('href', '/hibiscus-coast-jobs/post');
});

test('links to the privacy page', async ({ page }) => {
  await expect(page.locator('.privacy-link a')).toHaveAttribute('href', '/privacy');
});

test('shows a per-listing JobPosting block when there are listings, and none when empty', async ({
  page,
}) => {
  const listings = page.locator('.job');
  const ldBlocks = page.locator('script[type="application/ld+json"]');
  const n = await listings.count();
  expect(await ldBlocks.count()).toBe(n);

  if (n === 0) {
    await expect(page.locator('.empty').first()).toBeVisible();
  } else {
    const first = JSON.parse(await ldBlocks.first().textContent());
    expect(first['@type']).toBe('JobPosting');
    expect(first.title).toBeTruthy();
    expect(first.hiringOrganization['@type']).toBe('Organization');
    expect(first.validThrough).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  }
});

test('macronises Ōrewa anywhere it shows a town', async ({ page }) => {
  const towns = await page
    .locator('.job .meta, .filters .chip')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent));
  for (const text of towns) {
    expect(text).not.toMatch(/\bOrewa\b/);
  }
});

test('never scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});

test('loads nothing from anywhere else at runtime', async ({ page }) => {
  const offsite = [];
  page.on('request', (request) => {
    if (!new URL(request.url()).host.startsWith('localhost')) offsite.push(request.url());
  });
  await page.goto('/hibiscus-coast-jobs', { waitUntil: 'networkidle' });
  expect(offsite).toEqual([]);
});
