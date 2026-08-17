import { expect, test } from '@playwright/test';
import { ADS_MIGRATIONS, allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/Event*';
const STORAGE = '**/storage/v1/object/creative/**';

/** A real 1×1 PNG, so the picker and the preview get something to work with. */
const PNG = {
  name: 'market.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  ),
};

/** The endpoint refuses submissions returned faster than a person could type. */
const MIN_SECONDS = 3;

/** yyyy-MM-dd, `days` from now — so the fixture never ages into the past. */
function day(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const START = day(30);
const END = day(31);

const field = (page, name) => page.locator(`.field[data-field="${name}"]`);
const error = (page, name) => field(page, name).locator('.error');
const message = (page) => page.locator('#form-message');

async function fillRequired(page) {
  await page.fill('#title', 'Ōrewa Night Market');
  await page.fill('#startDate', START);
  await page.fill('#location', 'Ōrewa Community Centre, Ōrewa');
  await page.fill('#body', 'Stalls, food trucks and live music along the beachfront. Free entry.');
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
  await page.goto('/submit-event');
});

test('offers exactly the categories the policy will accept', async ({ page }) => {
  const rendered = await page
    .locator('#category option')
    .evaluateAll((options) => options.map((option) => option.value));

  expect(rendered.sort()).toEqual(allowedValues('category', ADS_MIGRATIONS, 'Event').sort());
  await expect(page.locator('#category')).toHaveValue('COMMUNITY');
});

test('files the event as an unassigned draft from the public form', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#startTime', '17:00');
  await page.fill('#endDate', END);
  await page.fill('#endTime', '21:30');
  await page.selectOption('#category', 'MARKET');
  await page.fill('#ticketUrl', 'https://example.co.nz/tickets');
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#contactPhone', '021 555 0134');

  expect(await submit(page)).toEqual({
    title: 'Ōrewa Night Market',
    body: 'Stalls, food trucks and live music along the beachfront. Free entry.',
    location: 'Ōrewa Community Centre, Ōrewa',
    category: 'MARKET',
    // Coast wall-clock time, the way the desk reads it off the page — not
    // shifted into UTC.
    startsAt: `${START}T17:00:00`,
    endsAt: `${END}T21:30:00`,
    contactName: 'Sam Rivers',
    contactEmail: 'sam@example.co.nz',
    contactPhone: '021 555 0134',
    ticketUrl: 'https://example.co.nz/tickets',
    status: 'DRAFT',
    source: 'PUBLIC',
    issueId: null,
    // Nobody ticked the upgrade, so there is no photo and nothing to invoice.
    featured: false,
    imageUrl: null,
    featuredFee: 0,
    featuredPaid: 'UNPAID',
  });

  await expect(page.locator('#event-form')).toBeHidden();
  await expect(page.locator('#sent h2')).toHaveText('Thanks — your event is in.');
  await expect(page.locator('#sent-featured')).toBeHidden();
});

test('sends a date with no time as midnight', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');

  expect(await submit(page)).toMatchObject({
    startsAt: `${START}T00:00:00`,
    endsAt: null,
    contactPhone: null,
    ticketUrl: null,
  });
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
  await page.fill('#contactName', 'Sam Rivers');
  await page.check('#featured');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');

  await expect(error(page, 'image')).toHaveText('Add a photo, or untick featuring it');
  expect(posted).toBe(0);
});

test('refuses a file that is not an image we take', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
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
  await page.fill('#contactName', 'Sam Rivers');
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
  await page.fill('#contactName', 'Sam Rivers');
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
    /\/storage\/v1\/object\/creative\/public-events\/[0-9a-f-]{36}\.png$/
  );
  expect(upload.url).not.toContain('market');

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
  await page.fill('#contactName', 'Sam Rivers');
  await page.check('#featured');
  await page.setInputFiles('#image', PNG);
  await submitFeatured(page);

  await expect(page.locator('#sent-featured')).toBeVisible();
  await expect(page.locator('#sent-featured')).toContainText('$1.99');
});

test('files nothing when the photo will not upload', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await page.check('#featured');
  await page.setInputFiles('#image', PNG);

  const { body } = await submitFeatured(page, { storage: 400 });

  // No listing without its photo — a featured row with no image is one the
  // policy would refuse anyway.
  expect(body).toBeNull();
  await expect(message(page)).toHaveText('Could not upload that photo. Please try again.');
  await expect(page.locator('#event-form')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
});

test('drops the photo when the upgrade is un-ticked', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
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
  await expect(error(page, 'title')).toHaveText('Give your event a name');
  await expect(error(page, 'body')).toHaveText('Tell us about your event');
  await expect(error(page, 'location')).toHaveText('Where is it on?');
  await expect(error(page, 'contactName')).toHaveText('Tell us who to credit this to');
  await expect(error(page, 'startDate')).toHaveText('When is it on?');
  expect(posted).toBe(0);
});

test('wants an email or a phone number, not necessarily both', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
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

test('counts the words and refuses copy over the cap', async ({ page }) => {
  const counter = page.locator('#body-count');
  await expect(counter).toHaveText('No copy yet — up to 70 words');

  await page.fill('#body', 'Stalls, food trucks and live music. Free entry.');
  await expect(counter).toHaveText('8 words');

  await page.fill('#body', Array.from({ length: 74 }, (_, i) => `word${i}`).join(' '));
  await expect(counter).toHaveText('74 words — 4 over the 70-word maximum');

  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#body', Array.from({ length: 74 }, (_, i) => `word${i}`).join(' '));

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'body')).toHaveText(
    'Listings run to 70 words at most. 74 words — 4 over the 70-word maximum.'
  );
});

test('refuses an event that has already been', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#startDate', day(-2));

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'startDate')).toHaveText(
    'That date has already been — check the year, or send us the next one'
  );
});

test('refuses an end that lands before the start', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#endDate', day(29));

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'endDate')).toHaveText('The event cannot finish before it starts');
});

test('asks for an end date to go with an end time', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#endTime', '21:30');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'endDate')).toHaveText('Add an end date to go with that time');
});

test('wants a full URL for tickets', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await page.fill('#ticketUrl', 'example.co.nz/tickets');

  await page.waitForTimeout(MIN_SECONDS * 1000 + 200);
  await page.click('button[type="submit"]');
  await expect(error(page, 'ticketUrl')).toHaveText(
    'Enter a full URL starting with http:// or https://'
  );
});

test('tells a bot nothing it can learn from', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
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
  await page.fill('#contactName', 'Sam Rivers');
  await page.click('button[type="submit"]');

  await expect(message(page)).toHaveText('That was quick — give it another go.');
  expect(posted).toBe(0);
});

test('lets someone try again when the insert fails', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await submit(page, { status: 500 });

  await expect(message(page)).toHaveText('Something went wrong saving that. Please try again.');
  await expect(page.locator('#event-form')).toBeVisible();

  const button = page.locator('button[type="submit"]');
  await expect(button).toBeEnabled();
  await expect(button).toHaveText('Send my event');
});

test('offers a clean form to whoever has a second event', async ({ page }) => {
  await fillRequired(page);
  await page.fill('#contactName', 'Sam Rivers');
  await submit(page);

  await page.click('#send-another');
  await expect(page.locator('#event-form')).toBeVisible();
  await expect(page.locator('#title')).toHaveValue('');
  await expect(page.locator('#body-count')).toHaveText('No copy yet — up to 70 words');
});

test('never scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
