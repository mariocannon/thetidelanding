import { expect, test } from '@playwright/test';

// The events calendar is built from a build-time PostgREST fetch of `Event`
// in the shared Newsletter ad management project — the same arrangement
// tests/hibiscus-coast-jobs.spec.js runs against for the jobs board. This
// repo has no credential to plant a row there and shouldn't, so these tests
// check the page's own chrome and its behaviour with whatever the shared
// project currently holds (an empty calendar until events are keyed in —
// see drafts/plans/EVENTS-CALENDAR-PAGE.md).

test.beforeEach(async ({ page }) => {
  await page.goto('/events');
});

test('carries a full, canonical head', async ({ page }) => {
  await expect(page).toHaveTitle(/What's on/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://thetide.co.nz/events'
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f0e7d6');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /What's on/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /svg\+xml/);
});

test('leads with the logo and the one clear action', async ({ page }) => {
  await expect(page.locator('.head .home img')).toHaveAttribute('src', '/logo.webp');
  await expect(page.locator('h1')).toHaveText('Events on the Coast');
  await expect(page.locator('.foot .post a')).toHaveAttribute('href', '/submit-event');
});

test('links to the privacy page', async ({ page }) => {
  await expect(page.locator('.privacy-link a')).toHaveAttribute('href', '/privacy');
});

test('renders a sensible empty state when there are no published events', async ({ page }) => {
  const groups = page.locator('.date-group');
  const n = await groups.count();

  if (n === 0) {
    await expect(page.locator('.empty').first()).toBeVisible();
    await expect(page.locator('.empty').first()).toContainText('get The Tide');
    await expect(page.locator('#calendar')).toHaveCount(0);
  } else {
    await expect(page.locator('.event').first()).toBeVisible();
  }
});

test('shows a per-event Event block only when there are listings', async ({ page }) => {
  const events = page.locator('.event');
  const ldBlocks = page.locator('script[type="application/ld+json"]');
  const n = await events.count();
  expect(await ldBlocks.count()).toBe(n);

  if (n > 0) {
    const first = JSON.parse(await ldBlocks.first().textContent());
    expect(first['@type']).toBe('Event');
    expect(first.name).toBeTruthy();
    expect(first.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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
  await page.goto('/events', { waitUntil: 'networkidle' });
  expect(offsite).toEqual([]);
});
