import { expect, test } from '@playwright/test';
import { ADS_MIGRATIONS, allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/Classified*';

/** The form refuses submissions returned faster than a person could type. */
const MIN_SECONDS = 3;

const field = (page, name) => page.locator(`.field[data-field="${name}"]`);
const error = (page, name) => field(page, name).locator('.error');
const message = (page) => page.locator('#form-message');

const LISTING =
  'Tidy 4.2m alloy runabout on a braked trailer. New bearings, 40hp four-stroke, always garaged.';

async function fillRequired(page) {
  await page.fill('#headline', 'Tidy 4.2m alloy runabout, Ōrewa');
  await page.fill('#body', LISTING);
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#contactEmail', 'sam@example.co.nz');
}

/** Submits the form and returns the JSON body it tried to POST, if any. */
async function submit(page, { status = 201, wait = true } = {}) {
  if (wait) await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  let body = null;
  await page.route(ENDPOINT, async (route) => {
    body = JSON.parse(route.request().postData());
    await route.fulfill({ status, body: '' });
  });
  await page.click('button[type="submit"]');
  return body;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/submit-classified');
});

test('offers exactly the categories the policy will accept', async ({ page }) => {
  const rendered = await page
    .locator('#category option')
    .evaluateAll((options) => options.map((option) => option.value));

  expect(rendered.sort()).toEqual(allowedValues('category', ADS_MIGRATIONS, 'Classified').sort());
  await expect(page.locator('#category')).toHaveValue('FOR_SALE');
});

test('files the listing as an unassigned draft from the public form', async ({ page }) => {
  await fillRequired(page);
  await page.selectOption('#category', 'SERVICES');
  await page.fill('#contactPhone', '021 555 0134');

  expect(await submit(page)).toEqual({
    headline: 'Tidy 4.2m alloy runabout, Ōrewa',
    body: LISTING,
    category: 'SERVICES',
    contactName: 'Sam Rivers',
    contactEmail: 'sam@example.co.nz',
    contactPhone: '021 555 0134',
    status: 'DRAFT',
    source: 'PUBLIC',
    issueId: null,
  });

  await expect(page.locator('#classified-form')).toBeHidden();
  await expect(page.locator('#sent h2')).toHaveText('Thanks — your listing is in.');
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
  await expect(error(page, 'headline')).toHaveText('Give your listing a headline');
  await expect(error(page, 'body')).toHaveText('Write your listing');
  await expect(error(page, 'contactName')).toHaveText('Tell us who to credit this to');
  expect(posted).toBe(0);
});

test('wants an email or a phone number, not necessarily both', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactEmail', '');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'contactEmail')).toHaveText(
    'Add an email or a phone number so readers can reply'
  );

  await page.fill('#contactPhone', '021 555 0134');
  expect(await submit(page, { wait: false })).toMatchObject({
    contactEmail: null,
    contactPhone: '021 555 0134',
  });
});

test('refuses an email address that is not one', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactEmail', 'sam at example');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'contactEmail')).toHaveText('Enter a valid email address');
});

test('counts the words and refuses copy over the cap', async ({ page }) => {
  const counter = page.locator('#body-count');
  await expect(counter).toHaveText('No copy yet — up to 70 words');

  await page.fill('#body', 'Tidy runabout, always garaged. Ready to fish.');
  await expect(counter).toHaveText('7 words');

  await page.fill('#body', Array.from({ length: 74 }, (_, i) => `word${i}`).join(' '));
  await expect(counter).toHaveText('74 words — 4 over the 70-word maximum');

  await fillRequired(page);
  await page.fill('#body', Array.from({ length: 74 }, (_, i) => `word${i}`).join(' '));

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'body')).toHaveText(
    'Listings run to 70 words at most. 74 words — 4 over the 70-word maximum.'
  );
});

test('says nothing useful to a bot', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  // The honeypot is filled and the form comes back instantly — either alone is
  // enough to refuse it, and the honeypot answers the way a success does.
  await fillRequired(page);
  // Set rather than filled: the honeypot is off-screen in a clipped box, which
  // is the point — a person cannot reach it and Playwright cannot type into it.
  await page.locator('#website').evaluate((input) => {
    input.value = 'https://example.com';
  });
  await page.click('button[type="submit"]');

  await expect(page.locator('#sent h2')).toHaveText('Thanks — your listing is in.');
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
  await expect(page.locator('#classified-form')).toBeVisible();
});

test('never scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
