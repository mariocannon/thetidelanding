import { expect, test } from '@playwright/test';
import { allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/survey_responses*';

// The two answers the table still insists on.
const REQUIRED = {
  area: 'Manly',
  topic: 'Event coverage',
};

const option = (page, field, value) =>
  page.locator(`[data-field="${field}"] label.pill:has(input[value="${value}"])`);

const note = (page) => page.locator('#form-note');

async function answerRequired(page) {
  await page.selectOption('#area', REQUIRED.area);
  await option(page, 'topics', REQUIRED.topic).click();
}

/** Answers the survey and returns the JSON body it tried to POST. */
async function submit(page, { status = 201 } = {}) {
  let body = null;
  await page.route(ENDPOINT, async (route) => {
    body = JSON.parse(route.request().postData());
    await route.fulfill({ status, body: '' });
  });
  await page.click('button[type="submit"]');
  await expect(note(page)).not.toHaveText(/^We never sell/);
  return body;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/reader-survey');
});

test('offers exactly the options the database will accept', async ({ page }) => {
  for (const field of ['area', 'hobby']) {
    const rendered = await page
      .locator(`[data-field="${field}"] option`)
      .evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
    expect(rendered.sort(), `options for ${field}`).toEqual(allowedValues(field).sort());
  }

  for (const field of [
    'topics',
    'education',
    'age_range',
    'gender',
    'relationship_status',
    'home_ownership',
    'household_income',
    'children_at_home',
    'children_ages',
    'pets',
  ]) {
    const rendered = await page
      .locator(`[data-field="${field}"] input`)
      .evaluateAll((inputs) => inputs.map((input) => input.value));
    expect(rendered.sort(), `options for ${field}`).toEqual(allowedValues(field).sort());
  }
});

test('every personal question offers a way out', async ({ page }) => {
  for (const field of [
    'education',
    'age_range',
    'gender',
    'relationship_status',
    'home_ownership',
    'household_income',
    'children_at_home',
  ]) {
    await expect(option(page, field, 'Prefer not to say')).toHaveCount(1);
  }
});

test('no longer asks what your home is worth or what you have invested', async ({ page }) => {
  await expect(page.locator('[data-field="home_value"]')).toHaveCount(0);
  await expect(page.locator('[data-field="investments"]')).toHaveCount(0);
});

test('asks for the area and a topic before it posts anything', async ({ page }) => {
  let posted = 0;
  await page.route(ENDPOINT, async (route) => {
    posted += 1;
    await route.fulfill({ status: 201, body: '' });
  });

  await page.click('button[type="submit"]');
  await expect(note(page)).toHaveText('Pick the part of the Coast you live on first.');

  await page.selectOption('#area', REQUIRED.area);
  await page.click('button[type="submit"]');
  await expect(note(page)).toHaveText('Pick at least one thing you want more of.');

  expect(posted).toBe(0);
});

test('asks for nothing that identifies a reader', async ({ page }) => {
  await expect(page.locator('[data-field="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);

  await answerRequired(page);
  expect(await submit(page)).not.toHaveProperty('email');
});

test("only asks about children's ages when there are children", async ({ page }) => {
  const ages = page.locator('#children-ages');
  await expect(ages).toBeHidden();

  await option(page, 'children_at_home', 'Yes').click();
  await expect(ages).toBeVisible();
  await option(page, 'children_ages', '6-10').click();

  // Changing your mind clears the answer instead of smuggling it through.
  await option(page, 'children_at_home', 'No').click();
  await expect(ages).toBeHidden();
  await option(page, 'children_at_home', 'Yes').click();
  await expect(page.locator('#children-ages input:checked')).toHaveCount(0);
});

test('counts the questions it is actually asking', async ({ page }) => {
  const progress = page.locator('#progress-text');
  await expect(progress).toHaveText('0 of 12 answered');

  await page.selectOption('#area', REQUIRED.area);
  await expect(progress).toHaveText('1 of 12 answered');

  // The ages question joins the count only once it appears.
  await option(page, 'children_at_home', 'Yes').click();
  await expect(progress).toHaveText('2 of 13 answered');
  await option(page, 'children_at_home', 'No').click();
  await expect(progress).toHaveText('2 of 12 answered');
});

test('posts skipped questions as null', async ({ page }) => {
  await page.selectOption('#area', REQUIRED.area);
  await option(page, 'topics', REQUIRED.topic).click();
  await option(page, 'topics', 'Real estate').click();

  expect(await submit(page)).toEqual({
    area: REQUIRED.area,
    topics: [REQUIRED.topic, 'Real estate'],
    occupation: null,
    hobby: null,
    hobby_other: null,
    education: null,
    age_range: null,
    gender: null,
    relationship_status: null,
    home_ownership: null,
    household_income: null,
    children_at_home: null,
    children_ages: null,
    pets: null,
  });

  await expect(note(page)).toHaveText('Thanks — please keep an eye out for our welcome email.');
  await expect(page.locator('#survey-form')).toBeHidden();
  await expect(page.locator('#progress')).toBeHidden();
});

test('only asks what the hobby is when it is not on the list', async ({ page }) => {
  const other = page.locator('#hobby-other');
  await expect(other).toBeHidden();

  await page.selectOption('#hobby', 'Golf');
  await expect(other).toBeHidden();

  await page.selectOption('#hobby', 'Other');
  await expect(other).toBeVisible();
  await other.fill('Restoring old motorbikes');

  await answerRequired(page);
  expect(await submit(page)).toMatchObject({
    hobby: 'Other',
    hobby_other: 'Restoring old motorbikes',
  });
});

test('drops the typed hobby when a listed one is picked instead', async ({ page }) => {
  await answerRequired(page);
  await page.selectOption('#hobby', 'Other');
  await page.fill('#hobby-other', 'Restoring old motorbikes');
  await page.selectOption('#hobby', 'Golf');

  await expect(page.locator('#hobby-other')).toBeHidden();
  expect(await submit(page)).toMatchObject({ hobby: 'Golf', hobby_other: null });
});

test('sends the answers it was given', async ({ page }) => {
  await answerRequired(page);
  await page.fill('#occupation', 'Builder');
  await page.selectOption('#hobby', 'Exercising (gym, running, yoga)');
  await option(page, 'age_range', '35-44').click();
  await option(page, 'home_ownership', 'I own my home and am moving soon').click();
  await option(page, 'household_income', '$150,000-$199,999').click();
  await option(page, 'children_at_home', 'Yes').click();
  await option(page, 'children_ages', '6-10').click();
  await option(page, 'children_ages', '14-18').click();
  await option(page, 'pets', 'Yes, a dog or dogs').click();

  expect(await submit(page)).toMatchObject({
    occupation: 'Builder',
    hobby: 'Exercising (gym, running, yoga)',
    hobby_other: null,
    age_range: '35-44',
    home_ownership: 'I own my home and am moving soon',
    household_income: '$150,000-$199,999',
    children_at_home: 'Yes',
    children_ages: ['6-10', '14-18'],
    pets: ['Yes, a dog or dogs'],
  });
});

test('drops the ages when the children answer is taken back', async ({ page }) => {
  await answerRequired(page);
  await option(page, 'children_at_home', 'Yes').click();
  await option(page, 'children_ages', '0-2').click();
  await option(page, 'children_at_home', 'Prefer not to say').click();

  expect(await submit(page)).toMatchObject({
    children_at_home: 'Prefer not to say',
    children_ages: null,
  });
});

test('lets a reader try again when the insert fails', async ({ page }) => {
  await answerRequired(page);
  await submit(page, { status: 500 });

  await expect(note(page)).toHaveText('Something went wrong — please try again in a moment.');
  await expect(page.locator('#survey-form')).toBeVisible();

  const button = page.locator('button[type="submit"]');
  await expect(button).toBeEnabled();
  await expect(button).toHaveText('Send my answers');
});

test('never scrolls sideways', async ({ page }) => {
  await option(page, 'children_at_home', 'Yes').click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
