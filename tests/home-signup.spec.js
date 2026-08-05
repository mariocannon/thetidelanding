import { expect, test } from '@playwright/test';

const ENDPOINT = '**/rest/v1/subscribers*';
const SURVEY_URL = 'https://thetide.co.nz/reader-survey/';

/** Signs up with an intercepted Supabase insert, so no row is ever written. */
async function signUp(page, { status = 201 } = {}) {
  await page.route(ENDPOINT, (route) => route.fulfill({ status, body: '' }));
  // The survey lives on the live domain; stub it so the test stays local.
  await page.route(SURVEY_URL, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Reader survey</h1>' }),
  );
  await page.goto('/');
  await page.fill('#email', 'coastie@example.com');
  await page.click('button[type="submit"]');
}

test('a new signup lands on the reader survey', async ({ page }) => {
  await signUp(page);
  await expect(page).toHaveURL(SURVEY_URL);
});

test('an already-subscribed email lands there too', async ({ page }) => {
  await signUp(page, { status: 409 });
  await expect(page).toHaveURL(SURVEY_URL);
});

test('a failed signup stays put', async ({ page }) => {
  await signUp(page, { status: 500 });
  await expect(page.locator('#form-note')).toHaveClass(/error/);
  await expect(page).toHaveURL('/');
});

test('an invalid email never reaches Supabase', async ({ page }) => {
  let posted = false;
  await page.route(ENDPOINT, (route) => {
    posted = true;
    return route.fulfill({ status: 201, body: '' });
  });
  await page.goto('/');
  await page.fill('#email', 'not-an-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('#form-note')).toHaveText(/valid email/);
  expect(posted).toBe(false);
});
