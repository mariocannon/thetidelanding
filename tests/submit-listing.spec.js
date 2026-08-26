import { expect, test } from '@playwright/test';
import { ADS_MIGRATIONS, allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/DirectoryListing*';

/** The form refuses submissions returned faster than a person could type. */
const MIN_SECONDS = 3;

const field = (page, name) => page.locator(`.field[data-field="${name}"]`);
const error = (page, name) => field(page, name).locator('.error');
const message = (page) => page.locator('#form-message');

/** Clears directoryListingSchema's 61-character floor with room to spare. */
const BLURB =
  'Family-run plumbers covering Orewa to Gulf Harbour, day or night. Registered, insured, and we turn up when we say we will.';

async function fillRequired(page) {
  await page.fill('#name', 'Coast Plumbing & Gas');
  await page.fill('#blurb', BLURB);
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
  // The post outlives the click, so settle on an outcome before reading what
  // was sent — reading straight after the click is a race, and on a slow run
  // it reads nothing.
  await expect(status === 201 ? page.locator('#sent') : message(page)).toBeVisible();
  return body;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/submit-listing');
});

test('offers exactly the categories the policy will accept', async ({ page }) => {
  const rendered = await page
    .locator('#category option')
    .evaluateAll((options) => options.map((option) => option.value));

  expect(rendered.sort()).toEqual(
    allowedValues('category', ADS_MIGRATIONS, 'DirectoryListing').sort()
  );
  // The first category in the list is the default, same as Event/Classified
  // default to a sensible first pick rather than leaving the select blank.
  await expect(page.locator('#category')).toHaveValue('cafes');
});

test('offers exactly the towns the policy will accept', async ({ page }) => {
  const rendered = await page
    .locator('#town option')
    .evaluateAll((options) => options.map((option) => option.value));

  expect(rendered.sort()).toEqual(allowedValues('town', ADS_MIGRATIONS, 'DirectoryListing').sort());
  await expect(page.locator('#town')).toHaveValue('Orewa');
});

test('files the listing as an unpublished, unfeatured submission from the public form', async ({
  page,
}) => {
  await fillRequired(page);
  await page.selectOption('#category', 'plumbers');
  await page.selectOption('#town', 'Silverdale');
  await page.fill('#phone', '09 123 4567');
  await page.fill('#url', 'https://coastplumbing.example.co.nz');
  await page.fill('#contactPhone', '021 555 0134');

  expect(await submit(page)).toEqual({
    name: 'Coast Plumbing & Gas',
    category: 'plumbers',
    town: 'Silverdale',
    blurb: BLURB,
    phone: '09 123 4567',
    url: 'https://coastplumbing.example.co.nz',
    contactName: 'Sam Rivers',
    contactEmail: 'sam@example.co.nz',
    contactPhone: '021 555 0134',
    // Not negotiable from outside: submissions are unpublished, unfeatured
    // drafts waiting on the operator.
    status: 'PENDING',
    source: 'PUBLIC',
    featured: false,
  });

  await expect(page.locator('#listing-form')).toBeHidden();
  await expect(page.locator('#sent h2')).toHaveText("Thanks — it's in.");
});

test('sends blank optional fields as null, not empty strings', async ({ page }) => {
  await fillRequired(page);

  expect(await submit(page)).toMatchObject({
    phone: null,
    url: null,
    contactPhone: null,
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
  await expect(error(page, 'name')).toHaveText('Give the business a name');
  await expect(error(page, 'blurb')).toHaveText('Tell us about the business');
  await expect(error(page, 'contactName')).toHaveText('Tell us who to credit this to');
  expect(posted).toBe(0);
});

test('wants an email or a phone number, not necessarily both', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactEmail', '');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'contactEmail')).toHaveText(
    'Add an email or a phone number so we can reach you'
  );

  await page.fill('#contactPhone', '021 555 0134');
  expect(await submit(page, { wait: false })).toMatchObject({
    contactEmail: null,
    contactPhone: '021 555 0134',
  });
});

test('counts the characters and refuses a blurb under the floor', async ({ page }) => {
  const counter = page.locator('#blurb-count');
  await expect(counter).toHaveText('No copy yet — write at least 61 characters');

  await page.fill('#blurb', 'Too short a pitch.');
  await expect(counter).toHaveText('18 characters — 43 more to go');

  await page.fill('#blurb', BLURB);
  await expect(counter).toHaveText(`${BLURB.length} characters`);

  await fillRequired(page);
  await page.fill('#blurb', 'Too short a pitch.');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'blurb')).toHaveText(
    'Write at least 61 characters — anything shorter reads as too thin to be a recommendation'
  );
});

test('refuses a blurb over the ceiling', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#blurb', 'x'.repeat(601));

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'blurb')).toHaveText('Keep this to 600 characters or fewer');
});

test('wants a full URL for the website', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#url', 'coastplumbing.example.co.nz');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'url')).toHaveText(
    'Enter a full URL starting with http:// or https://'
  );
});

test('wants a phone number that looks like one', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#phone', 'call me maybe');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'phone')).toHaveText('Enter a valid phone number');
});

test('tells a bot nothing it can learn from', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await fillRequired(page);
  await page.locator('#website').fill('https://spam.example');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');

  // Answers the way a success does, and posts nothing.
  await expect(page.locator('#sent')).toBeVisible();
  expect(posted).toBe(0);
});

test('refuses a form filled in faster than a person could type it', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await fillRequired(page);
  await page.click('button[type="submit"]');

  await expect(message(page)).toHaveText('That was quick — give it another go.');
  expect(posted).toBe(0);
});

test('lets someone try again when the insert fails', async ({ page }) => {
  await fillRequired(page);
  await submit(page, { status: 500 });

  await expect(message(page)).toHaveText('Something went wrong saving that. Please try again.');
  await expect(page.locator('#listing-form')).toBeVisible();

  const button = page.locator('button[type="submit"]');
  await expect(button).toBeEnabled();
  await expect(button).toHaveText('Add my business');
});

test('offers a clean form to whoever has a second business', async ({ page }) => {
  await fillRequired(page);
  await submit(page);

  await page.click('#send-another');
  await expect(page.locator('#listing-form')).toBeVisible();
  await expect(page.locator('#name')).toHaveValue('');
  await expect(page.locator('#blurb-count')).toHaveText('No copy yet — write at least 61 characters');
});

test('links back to the directory and out to the privacy page', async ({ page }) => {
  await expect(page.locator('.cross-link a[href="/hibiscus-coast-business-directory"]')).toBeVisible();
  await expect(page.locator('.privacy-link a[href="/privacy"]')).toBeVisible();
});

test('never scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
