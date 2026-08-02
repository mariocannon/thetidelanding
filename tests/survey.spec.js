import { expect, test } from '@playwright/test';
import { allowedValues } from './schema.mjs';

const ENDPOINT = '**/rest/v1/survey_responses*';

// The three answers the table insists on.
const REQUIRED = {
  area: 'Manly',
  topic: 'Event coverage',
  email: 'reader@example.com',
};

const option = (page, field, value) =>
  page.locator(`[data-field="${field}"] label.pill:has(input[value="${value}"])`);

const note = (page) => page.locator('#form-note');

async function answerRequired(page) {
  await page.selectOption('#area', REQUIRED.area);
  await option(page, 'topics', REQUIRED.topic).click();
  await page.fill('#email', REQUIRED.email);
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
  await page.goto('/survey');
});

test('offers exactly the options the database will accept', async ({ page }) => {
  const areas = await page.locator('[data-field="area"] option').evaluateAll((options) =>
    options.map((o) => o.value).filter(Boolean)
  );
  expect(areas.sort()).toEqual(allowedValues('area').sort());

  for (const field of [
    'topics',
    'education',
    'age_range',
    'gender',
    'relationship_status',
    'home_ownership',
    'home_value',
    'household_income',
    'investments',
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
    'investments',
    'children_at_home',
  ]) {
    await expect(option(page, field, 'Prefer not to say')).toHaveCount(1);
  }
  // Worded differently because "not sure" is the honest answer here.
  await expect(option(page, 'home_value', 'Not sure or prefer not to say')).toHaveCount(1);
});

test('asks for the area, a topic and an email before it posts anything', async ({ page }) => {
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

  await option(page, 'topics', REQUIRED.topic).click();
  await page.fill('#email', 'not-an-email');
  await page.click('button[type="submit"]');
  await expect(note(page)).toHaveText('Please enter a valid email address.');

  expect(posted).toBe(0);
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
  await expect(progress).toHaveText('0 of 14 answered');

  await page.selectOption('#area', REQUIRED.area);
  await expect(progress).toHaveText('1 of 14 answered');

  // Q13 joins the count only once it appears.
  await option(page, 'children_at_home', 'Yes').click();
  await expect(progress).toHaveText('2 of 15 answered');
  await option(page, 'children_at_home', 'No').click();
  await expect(progress).toHaveText('2 of 14 answered');
});

test('posts skipped questions as null and lowercases the email', async ({ page }) => {
  await page.selectOption('#area', REQUIRED.area);
  await option(page, 'topics', REQUIRED.topic).click();
  await option(page, 'topics', 'Real estate').click();
  await page.fill('#email', 'Reader@Example.COM');

  expect(await submit(page)).toEqual({
    area: REQUIRED.area,
    topics: [REQUIRED.topic, 'Real estate'],
    occupation: null,
    education: null,
    age_range: null,
    gender: null,
    relationship_status: null,
    home_ownership: null,
    home_value: null,
    household_income: null,
    investments: null,
    children_at_home: null,
    children_ages: null,
    pets: null,
    email: 'reader@example.com',
  });

  await expect(note(page)).toHaveText('Thanks — that genuinely shapes what we write about.');
  await expect(page.locator('#survey-form')).toBeHidden();
  await expect(page.locator('#progress')).toBeHidden();
});

test('sends the answers it was given', async ({ page }) => {
  await answerRequired(page);
  await page.fill('#occupation', 'Builder');
  await option(page, 'age_range', '35-44').click();
  await option(page, 'home_ownership', 'I own my home and am moving soon').click();
  await option(page, 'household_income', '$150,000-$199,999').click();
  await option(page, 'children_at_home', 'Yes').click();
  await option(page, 'children_ages', '6-10').click();
  await option(page, 'children_ages', '14-18').click();
  await option(page, 'pets', 'Yes, a dog or dogs').click();

  expect(await submit(page)).toMatchObject({
    occupation: 'Builder',
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

test('thanks a reader who has already answered', async ({ page }) => {
  await answerRequired(page);
  // 409: the unique index on lower(email) — one response per reader.
  await submit(page, { status: 409 });

  await expect(note(page)).toHaveText("You've already filled this in — thanks again.");
  await expect(note(page)).toHaveClass(/success/);
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
