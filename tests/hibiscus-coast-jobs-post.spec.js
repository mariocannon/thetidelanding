import { expect, test } from '@playwright/test';
import { ADS_MIGRATIONS, allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/Job*';
const MIN_SECONDS = 3;

const field = (page, name) => page.locator(`.field[data-field="${name}"]`);
const error = (page, name) => field(page, name).locator('.error');
const message = (page) => page.locator('#form-message');

const BODY =
  'Saturday and Sunday mornings through summer, roughly 7am to noon. You know your way around a machine and you are quick on the floor. Training on our blend provided.';

async function fillRequired(page) {
  await page.fill('#title', 'Weekend barista');
  await page.fill('#employer', 'Coastline Coffee');
  await page.fill('#body', BODY);
  await page.fill('#contactName', 'Jo Ngata');
  await page.fill('#contactEmail', 'jobs@example.co.nz');
}

async function submit(page, { status = 201, wait = true } = {}) {
  if (wait) await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  let body = null;
  await page.route(ENDPOINT, async (route) => {
    body = JSON.parse(route.request().postData());
    await route.fulfill({ status, body: '' });
  });
  await page.click('button[type="submit"]');
  await expect(status === 201 ? page.locator('#sent') : message(page)).toBeVisible();
  return body;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/hibiscus-coast-jobs/post');
});

test('offers exactly the options the insert policy will accept', async ({ page }) => {
  const options = (selector) =>
    page.locator(`${selector} option`).evaluateAll((els) => els.map((el) => el.value));

  expect((await options('#category')).sort()).toEqual(
    allowedValues('category', ADS_MIGRATIONS, 'Job').sort()
  );
  expect((await options('#town')).sort()).toEqual(
    allowedValues('town', ADS_MIGRATIONS, 'Job').sort()
  );
  expect((await options('#tier')).sort()).toEqual(
    allowedValues('tier', ADS_MIGRATIONS, 'Job').sort()
  );
  // jobType is a quoted identifier in the policy, so it isn't machine-read the
  // way the others are — JOB_TYPES from lib/enums.ts.
  expect((await options('#jobType')).sort()).toEqual(
    ['CASUAL', 'PART_TIME', 'FULL_TIME', 'FIXED_TERM', 'CONTRACT'].sort()
  );
});

test('files the role as an unpaid, unplaced draft from the public form', async ({ page }) => {
  await fillRequired(page);
  await page.selectOption('#category', 'HOSPITALITY');
  await page.selectOption('#jobType', 'CASUAL');
  await page.selectOption('#town', 'Orewa');
  await page.fill('#pay', '$24–$27/hr');

  const body = await submit(page);

  expect(body).toMatchObject({
    id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    title: 'Weekend barista',
    employer: 'Coastline Coffee',
    body: BODY,
    category: 'HOSPITALITY',
    jobType: 'CASUAL',
    town: 'Orewa',
    pay: '$24–$27/hr',
    applyUrl: null,
    contactName: 'Jo Ngata',
    contactEmail: 'jobs@example.co.nz',
    contactPhone: null,
    tier: 'STANDARD',
    status: 'DRAFT',
    source: 'PUBLIC',
    paid: 'UNPAID',
    issueId: null,
    notes: null,
    logoUrl: null,
  });
  // Standard price is one of the two the policy pins to that tier.
  expect([19.99, 49]).toContain(body.price);
  // A 30-day run, within the policy's ~month window.
  const days = (new Date(body.closesAt) - Date.now()) / 86_400_000;
  expect(days).toBeGreaterThan(28);
  expect(days).toBeLessThan(32);

  await expect(page.locator('#job-form')).toBeHidden();
  await expect(page.locator('#sent h2')).toHaveText('Thanks — the role is in.');
});

test('prices the Featured tier at $89', async ({ page }) => {
  await fillRequired(page);
  await page.selectOption('#tier', 'FEATURED');
  const body = await submit(page);
  expect(body.tier).toBe('FEATURED');
  expect(body.price).toBe(89);
});

test('preselects the tier from the query string, e.g. after a Stripe redirect', async ({ page }) => {
  await page.goto('/hibiscus-coast-jobs/post?tier=community');
  await expect(page.locator('#tier')).toHaveValue('COMMUNITY');
  await fillRequired(page);
  const body = await submit(page);
  expect(body.price).toBe(14.99);
});

test('counts the words and refuses copy over the cap', async ({ page }) => {
  const counter = page.locator('#body-count');
  await expect(counter).toHaveText('No copy yet — up to 70 words');

  await page.fill('#body', 'Weekend barista wanted, training provided.');
  await expect(counter).toHaveText('5 words');

  await fillRequired(page);
  await page.fill('#body', Array.from({ length: 74 }, (_, i) => `word${i}`).join(' '));
  await expect(counter).toHaveText('74 words — 4 over the 70-word maximum');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'body')).toHaveText(
    'Listings run to 70 words at most. 74 words — 4 over the 70-word maximum.'
  );
});

test('wants an email or a phone number, not necessarily both', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactEmail', '');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'contactEmail')).toHaveText(
    'Add an email or a phone number so applicants can reply'
  );

  await page.fill('#contactPhone', '021 555 0142');
  expect(await submit(page, { wait: false })).toMatchObject({
    contactEmail: null,
    contactPhone: '021 555 0142',
  });
});

test('checks the highlighted fields before it posts anything', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');

  await expect(message(page)).toHaveText('Check the highlighted fields.');
  await expect(error(page, 'title')).toHaveText('Give the role a title');
  await expect(error(page, 'employer')).toHaveText("Tell us who's hiring");
  expect(posted).toBe(0);
});

test('says nothing useful to a bot', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await fillRequired(page);
  await page.locator('#website').evaluate((input) => {
    input.value = 'https://example.com';
  });
  await page.click('button[type="submit"]');

  await expect(page.locator('#sent h2')).toHaveText('Thanks — the role is in.');
  expect(posted).toBe(0);
});

test('refuses a form returned faster than a person could type it', async ({ page }) => {
  await fillRequired(page);
  await page.click('button[type="submit"]');
  await expect(message(page)).toHaveText('That was quick — give it another go.');
});

test('says so when Supabase turns the listing away', async ({ page }) => {
  await fillRequired(page);
  await submit(page, { status: 400 });
  await expect(message(page)).toHaveText('Something went wrong saving that. Please try again.');
  await expect(page.locator('#job-form')).toBeVisible();
});

test('links to the privacy page', async ({ page }) => {
  await expect(page.locator('.privacy-link a')).toHaveAttribute('href', '/privacy');
});

test('never scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
