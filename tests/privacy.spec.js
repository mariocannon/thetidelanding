import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const PAGES = fileURLToPath(new URL('../src/pages', import.meta.url));

/** Every page a reader can land on, as the path it's served at. */
function paths() {
  return readdirSync(PAGES)
    .filter((file) => file.endsWith('.astro'))
    .map((file) => (file === 'index.astro' ? '/' : `/${file.replace('.astro', '')}`));
}

/** Every Supabase table the site's forms post to, read out of the pages. */
function tablesWrittenTo() {
  const tables = new Set();
  for (const file of readdirSync(PAGES).filter((name) => name.endsWith('.astro'))) {
    const src = readFileSync(`${PAGES}/${file}`, 'utf8');
    for (const [, table] of src.matchAll(/\/rest\/v1\/([A-Za-z_]+)/g)) tables.add(table);
  }
  return [...tables];
}

test('every page links to the privacy page', async ({ page }) => {
  for (const path of paths()) {
    if (path === '/privacy') continue;
    await page.goto(path);
    await expect(page.locator('.privacy-link a')).toHaveAttribute('href', '/privacy');
  }
});

test('the link goes somewhere — no trailing-slash 404', async ({ page }) => {
  await page.goto('/');
  await page.click('.privacy-link a');
  await expect(page).toHaveURL('/privacy');
  await expect(page.locator('h1')).toHaveText('What we do with your details');
});

test('every table a form writes to is accounted for', async ({ page }) => {
  await page.goto('/privacy');
  const described = new Set(
    (await page.locator('[data-tables]').evaluateAll((nodes) =>
      nodes.flatMap((node) => node.dataset.tables.split(' '))
    )).filter(Boolean)
  );

  // A form that starts posting somewhere new fails here rather than quietly
  // collecting details this page never mentions.
  for (const table of tablesWrittenTo()) {
    expect(described, `public.${table} is written to but not described on /privacy`).toContain(
      table
    );
  }
});

test('the page says how to reach us and how long we keep things', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute(
    'href',
    'mailto:hello@thetide.co.nz'
  );
  await expect(page.getByRole('heading', { name: 'How long we keep it' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your rights' })).toBeVisible();
});

test('never scrolls sideways', async ({ page }) => {
  await page.goto('/privacy');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});

test('the page loads nothing from anywhere else', async ({ page }) => {
  const offsite = [];
  page.on('request', (request) => {
    if (!new URL(request.url()).host.startsWith('localhost')) offsite.push(request.url());
  });
  await page.goto('/privacy', { waitUntil: 'networkidle' });
  expect(offsite).toEqual([]);
});
