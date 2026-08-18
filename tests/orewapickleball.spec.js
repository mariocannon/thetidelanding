import { expect, test } from '@playwright/test';
import { allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/pickleball_signups*';

const note = (page) => page.locator('#form-note');

async function fillRequired(page) {
  await page.fill('#name', 'Jo Kirkpatrick');
  await page.fill('#email', 'Jo@Example.CO.NZ');
  await page.selectOption('#location', 'Red Beach');
  await page.fill('#age', '54');
  await page.click('.pill:has-text("Never played")');
}

/** Submits the form and returns the JSON body it tried to POST, if any. */
async function submit(page, { status = 201 } = {}) {
  let body = null;
  await page.route(ENDPOINT, async (route) => {
    body = JSON.parse(route.request().postData());
    await route.fulfill({ status, body: '' });
  });
  await page.click('button[type="submit"]');
  // The post outlives the click, so settle on an outcome before reading what
  // was sent — reading straight after the click is a race.
  await expect(status === 201 ? page.locator('#done-step') : note(page)).toBeVisible();
  return body;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/orewapickleball');
});

test('offers exactly the suburbs the table will accept', async ({ page }) => {
  const rendered = await page
    .locator('#location option:not([disabled])')
    .evaluateAll((options) => options.map((option) => option.value));

  expect(rendered.sort()).toEqual(allowedValues('location').sort());
});

test('offers exactly the experience answers the table will accept', async ({ page }) => {
  const rendered = await page
    .locator('input[name="played_before"]')
    .evaluateAll((inputs) => inputs.map((input) => input.value));

  expect(rendered.sort()).toEqual(allowedValues('played_before').sort());
});

test('books a spot with the details the club asked for', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#phone', '021 555 0134');
  await page.click('.pill:has-text("I play socially")');

  expect(await submit(page)).toEqual({
    name: 'Jo Kirkpatrick',
    // Lower-cased on the way out, the same as every other signup on the site.
    email: 'jo@example.co.nz',
    phone: '021 555 0134',
    location: 'Red Beach',
    // A number, not the string the input hands over — the column is a smallint.
    age: 54,
    played_before: 'I play socially',
  });
});

test('an empty phone goes as null rather than an empty string', async ({ page }) => {
  await fillRequired(page);
  expect(await submit(page)).toMatchObject({ phone: null, played_before: 'Never played' });
});

test('a booked spot swaps the form for the confirmation', async ({ page }) => {
  await fillRequired(page);
  await submit(page);

  await expect(page.locator('#signup-step')).toBeHidden();
  await expect(page.locator('#done-step')).toContainText('Orewa Community Courts');
});

test('a failed booking keeps the form and lets you try again', async ({ page }) => {
  await fillRequired(page);
  await submit(page, { status: 500 });

  await expect(note(page)).toHaveClass(/error/);
  await expect(page.locator('#signup-step')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  await expect(page.locator('button[type="submit"]')).toHaveText('Book now!');
});

// Each required answer, left out on its own, has to stop the post — a booking
// the club cannot act on is worse than no booking.
const MISSING = [
  { field: 'name', clear: async (page) => page.fill('#name', ''), says: /your name/i },
  { field: 'email', clear: async (page) => page.fill('#email', 'not-an-email'), says: /valid email/i },
  {
    field: 'location',
    clear: async (page) => page.selectOption('#location', []),
    says: /suburb/i,
  },
  { field: 'age', clear: async (page) => page.fill('#age', ''), says: /age/i },
  {
    field: 'played_before',
    clear: async (page) =>
      page.locator('input[name="played_before"]:checked').evaluate((input) => {
        input.checked = false;
      }),
    says: /played before/i,
  },
];

for (const { field, clear, says } of MISSING) {
  test(`a missing ${field} never reaches Supabase`, async ({ page }) => {
    let posted = false;
    await page.route(ENDPOINT, (route) => {
      posted = true;
      return route.fulfill({ status: 201, body: '' });
    });

    await fillRequired(page);
    await clear(page);
    await page.click('button[type="submit"]');

    await expect(note(page)).toHaveClass(/error/);
    await expect(note(page)).toHaveText(says);
    expect(posted).toBe(false);
  });
}

test('an age outside the range the table accepts never reaches Supabase', async ({ page }) => {
  let posted = false;
  await page.route(ENDPOINT, (route) => {
    posted = true;
    return route.fulfill({ status: 201, body: '' });
  });

  await fillRequired(page);
  await page.fill('#age', '3');
  await page.click('button[type="submit"]');

  await expect(note(page)).toHaveClass(/error/);
  expect(posted).toBe(false);
});

test('never scrolls sideways', async ({ page }) => {
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
  await page.goto('/orewapickleball', { waitUntil: 'networkidle' });
  expect(offsite).toEqual([]);
});
