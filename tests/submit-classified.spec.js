import { expect, test } from '@playwright/test';
import { ADS_MIGRATIONS, allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/Classified*';
const STORAGE = '**/storage/v1/object/creative/**';

/** A real 1×1 PNG, so the picker and the preview get something to work with. */
const PNG = {
  name: 'kayak.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  ),
};

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
  // The post outlives the click, so settle on an outcome before reading what
  // was sent — reading straight after the click is a race, and on a slow run
  // it reads nothing.
  await expect(status === 201 ? page.locator('#sent') : message(page)).toBeVisible();
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
    // Nobody ticked the upgrade, so there is no photo and nothing to invoice.
    featured: false,
    imageUrl: null,
    featuredFee: 0,
    featuredPaid: 'UNPAID',
  });

  await expect(page.locator('#classified-form')).toBeHidden();
  await expect(page.locator('#sent h2')).toHaveText('Thanks — your listing is in.');
  await expect(page.locator('#sent-featured')).toBeHidden();
});

/**
 * Submits a featured listing, intercepting both hops — the photo going up and
 * the listing going in — and returns what each one was sent.
 */
async function submitFeatured(page, { storage = 200, status = 201 } = {}) {
  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  let upload = null;
  let body = null;

  await page.route(STORAGE, async (route) => {
    upload = {
      url: route.request().url(),
      type: route.request().headers()['content-type'],
      method: route.request().method(),
      headers: route.request().headers(),
    };
    await route.fulfill({ status: storage, contentType: 'application/json', body: '{}' });
  });
  await page.route(ENDPOINT, async (route) => {
    body = JSON.parse(route.request().postData());
    await route.fulfill({ status, body: '' });
  });

  await page.click('button[type="submit"]');
  // Settle on an outcome before reading what was sent, so nothing is read
  // mid-flight.
  if (storage === 200 && status === 201) await expect(page.locator('#sent')).toBeVisible();
  else await expect(message(page)).toBeVisible();

  return { upload, body };
}

test('keeps the photo picker out of the way until the upgrade is ticked', async ({ page }) => {
  await expect(page.locator('#featured')).not.toBeChecked();
  await expect(page.locator('#photo')).toBeHidden();

  await page.check('#featured');
  await expect(page.locator('#photo')).toBeVisible();
  await expect(page.locator('#preview')).toBeHidden();
});

test('asks for a photo once someone ticks the upgrade', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await fillRequired(page);
  await page.check('#featured');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');

  await expect(error(page, 'image')).toHaveText('Add a photo, or untick featuring it');
  expect(posted).toBe(0);
});

test('refuses a file that is not an image we take', async ({ page }) => {
  await fillRequired(page);
  await page.check('#featured');
  await page.setInputFiles('#image', {
    name: 'poster.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'image')).toHaveText('That image must be a PNG, JPG, GIF or WEBP.');
});

test('refuses a photo over 5MB', async ({ page }) => {
  await fillRequired(page);
  await page.check('#featured');
  await page.setInputFiles('#image', {
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'image')).toHaveText('That image must be 5MB or smaller.');
});

test('puts the photo in the bucket and files the listing pointing at it', async ({ page }) => {
  await fillRequired(page);
  await page.check('#featured');
  await page.setInputFiles('#image', PNG);
  await expect(page.locator('#preview')).toBeVisible();

  const { upload, body } = await submitFeatured(page);

  // A generated name under the prefix the storage policy pins photos to — the
  // submitter's filename never reaches the URL.
  expect(upload.method).toBe('POST');
  expect(upload.type).toBe('image/png');
  // A publishable key is not a JWT: the gateway takes it on `apikey` and
  // refuses it as a Bearer token, so the upload must not send one.
  expect(upload.headers.apikey).toMatch(/^sb_publishable_/);
  expect(upload.headers.authorization).toBeUndefined();
  expect(upload.url).toMatch(
    /\/storage\/v1\/object\/creative\/public-classifieds\/[0-9a-f-]{36}\.png$/
  );
  expect(upload.url).not.toContain('kayak');

  expect(body).toMatchObject({
    featured: true,
    // The public URL of what just went up, which is the only shape the insert
    // policy accepts.
    imageUrl: upload.url.replace('/object/creative/', '/object/public/creative/'),
    // Asking for the upgrade is not paying for it.
    featuredFee: 1.99,
    featuredPaid: 'UNPAID',
    status: 'DRAFT',
    source: 'PUBLIC',
  });
});

test('tells a featured submitter an invoice is coming', async ({ page }) => {
  await fillRequired(page);
  await page.check('#featured');
  await page.setInputFiles('#image', PNG);
  await submitFeatured(page);

  await expect(page.locator('#sent-featured')).toBeVisible();
  await expect(page.locator('#sent-featured')).toContainText('$1.99');
  // How long the upgrade lasts, said again once the listing is in.
  await expect(page.locator('#sent-featured')).toContainText('two weeks');
});

test('says how long a featured listing stays featured', async ({ page }) => {
  await expect(page.locator('.check-hint')).toContainText('two weeks');
});

test('files nothing when the photo will not upload', async ({ page }) => {
  await fillRequired(page);
  await page.check('#featured');
  await page.setInputFiles('#image', PNG);

  const { body } = await submitFeatured(page, { storage: 400 });

  // No listing without its photo — a featured row with no image is one the
  // policy would refuse anyway.
  expect(body).toBeNull();
  await expect(message(page)).toHaveText('Could not upload that photo. Please try again.');
  await expect(page.locator('#classified-form')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
});

test('drops the photo when the upgrade is un-ticked', async ({ page }) => {
  await fillRequired(page);
  await page.check('#featured');
  await page.setInputFiles('#image', PNG);
  await page.uncheck('#featured');

  await expect(page.locator('#photo')).toBeHidden();
  await expect(page.locator('#preview')).toBeHidden();

  let uploads = 0;
  await page.route(STORAGE, async (route) => {
    uploads += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  expect(await submit(page)).toMatchObject({
    featured: false,
    imageUrl: null,
    featuredFee: 0,
  });
  expect(uploads).toBe(0);
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
