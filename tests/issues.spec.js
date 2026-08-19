import { expect, test } from '@playwright/test';

import { issues } from '../src/data/issues.js';

/** The archive as the page should render it: newest first. */
const newestFirst = [...issues].sort((a, b) => b.date.localeCompare(a.date));

test('every issue in the data file is listed, newest first', async ({ page }) => {
  test.skip(issues.length === 0, 'no issues in src/data/issues.js yet');
  await page.goto('/issues');
  await expect(page.locator('.issue')).toHaveCount(issues.length);
  await expect(page.locator('.issue-title a')).toHaveText(
    newestFirst.map((issue) => issue.title)
  );
});

test('each issue links out to its own copy, in a new tab', async ({ page }) => {
  test.skip(issues.length === 0, 'no issues in src/data/issues.js yet');
  await page.goto('/issues');
  const links = page.locator('.issue-title a');

  for (let i = 0; i < issues.length; i++) {
    const link = links.nth(i);
    await expect(link).toHaveAttribute('href', newestFirst[i].url);
    // The issues live on Beehiiv, so every link leaves the site: absolute,
    // https, and safe to open in a new tab.
    expect(newestFirst[i].url).toMatch(/^https:\/\//);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});

test('with nothing to read, the home page never sends anyone here', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.archive-link a');
  if (issues.length === 0) {
    await expect(link).toHaveCount(0);
    return;
  }

  // And when there is something to read, the link has to reach it —
  // `trailingSlash: 'never'` makes /issues/ a 404, not a redirect.
  await link.click();
  await expect(page).toHaveURL('/issues');
  await expect(page.locator('h1')).toHaveText('Every issue of The Tide');
});

test('the page loads nothing from anywhere else', async ({ page }) => {
  const offsite = [];
  page.on('request', (request) => {
    if (!new URL(request.url()).host.startsWith('localhost')) offsite.push(request.url());
  });
  // The Beehiiv URLs are links, never fetches: opening the archive must not
  // put a request to anyone else in a reader's browser.
  await page.goto('/issues', { waitUntil: 'networkidle' });
  expect(offsite).toEqual([]);
});

test('the subscribe form posts the email and nothing else', async ({ page }) => {
  let posted;
  await page.route('**/rest/v1/subscribers*', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ status: 201, body: '' });
  });

  await page.goto('/issues');
  await page.fill('#email', ' Coastie@Example.COM ');
  await page.click('#subscribe-form button[type="submit"]');

  await expect(page.locator('#subscribe-note')).toHaveClass(/success/);
  expect(posted).toEqual({ email: 'coastie@example.com' });
});

test('an invalid email never reaches Supabase', async ({ page }) => {
  let posted = false;
  await page.route('**/rest/v1/subscribers*', (route) => {
    posted = true;
    return route.fulfill({ status: 201, body: '' });
  });

  await page.goto('/issues');
  await page.fill('#email', 'not-an-email');
  await page.click('#subscribe-form button[type="submit"]');

  await expect(page.locator('#subscribe-note')).toHaveText(/valid email/);
  expect(posted).toBe(false);
});

test('never scrolls sideways', async ({ page }) => {
  await page.goto('/issues');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
