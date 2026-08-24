import { expect, test } from '@playwright/test';

const ENDPOINT = '**/rest/v1/subscribers*';
const SURVEY_PATH = '/reader-survey';

/** Signs up with an intercepted Supabase insert, so no row is ever written. */
async function signUp(page, { status = 201 } = {}) {
  await page.route(ENDPOINT, (route) => route.fulfill({ status, body: '' }));
  await page.goto('/');
  await page.fill('#email', 'coastie@example.com');
  await page.click('button[type="submit"]');
}

test('a new signup lands on the reader survey', async ({ page }) => {
  await signUp(page);
  await expect(page).toHaveURL(SURVEY_PATH);
  // Not just the URL: the survey page itself has to be there, which is what
  // /reader-survey/ with a trailing slash would fail.
  await expect(page.locator('#area')).toBeVisible();
});

test('an already-subscribed email lands there too', async ({ page }) => {
  await signUp(page, { status: 409 });
  await expect(page).toHaveURL(SURVEY_PATH);
  await expect(page.locator('#area')).toBeVisible();
});

test('a failed signup stays put', async ({ page }) => {
  await signUp(page, { status: 500 });
  await expect(page.locator('#form-note')).toHaveClass(/error/);
  await expect(page).toHaveURL('/');
});

// "Copy must never sit on top of the waves" is a hard rule in the brand guide,
// and it is the kind that gets broken by accident: it holds until somebody
// adds a line to the page, and then it silently doesn't. It was already broken
// at every viewport under ~1165px tall when the waves were `position: fixed`,
// because the space reserved above them only ever clears them on a page short
// enough not to scroll. Measured at the bottom of the scroll, which is where a
// fixed-position wave overlaps and an absolute one can't.
// Two different things can put copy on the waves, and they show up at
// opposite ends of the viewport range, so this sweeps heights as well as
// scroll positions:
//
//   - waves anchored to the viewport instead of the document, which fails on
//     any page long enough to scroll;
//   - a bottom reserve that doesn't cover the wave height, which fails only
//     once the viewport is tall enough for the two clamps to diverge — past
//     about 978px with the numbers this page uses.
//
// The project viewports are both under 900px tall, so neither project would
// catch the second one on its own.
const HEIGHTS = [700, 900, 1100, 1400];

test('no copy lands on the waves, at any height or scroll position', async ({ page }, testInfo) => {
  await page.goto('/');

  const worst = { gap: Infinity, culprit: null, at: 0, height: 0 };
  for (const height of HEIGHTS) {
    await page.setViewportSize({ width: page.viewportSize().width, height });
    const round = await measure(page);
    if (round.gap < worst.gap) Object.assign(worst, round, { height });
  }

  expect(
    worst.gap,
    `${worst.culprit} is ${-worst.gap}px under the waves ` +
      `at scrollY ${worst.at}, viewport height ${worst.height}`,
  ).toBeGreaterThanOrEqual(0);
  testInfo.annotations.push({
    type: 'wave clearance',
    description: `${worst.gap}px below ${worst.culprit} at ${worst.height}px tall`,
  });
});

/**
 * Smallest gap between the bottom of any on-screen copy and the top of the
 * waves, sampled down the scroll.
 *
 * Sampled rather than measured once at the bottom: at the very bottom the
 * document's foot and the viewport's foot are the same pixel, so viewport- and
 * document-anchored waves sit identically and the first failure mode above is
 * invisible. It only shows while there is still content below the fold to pass
 * underneath them.
 *
 * Measured against the waves' box, not their paint. The top quarter or so of
 * the box is transparent — the back wave's crest is the highest painted pixel
 * — so a small box overlap isn't necessarily visible. Measuring the box anyway
 * keeps the assertion to two numbers instead of resting on the path data
 * staying exactly as drawn.
 */
async function measure(page) {
  return page.evaluate(() => {
    const waves = document.querySelector('.waves');
    const copy = [...document.querySelectorAll('main *')].filter((el) => {
      // Leaf elements only — a wrapper's box spans its children and would
      // report their overlap as its own.
      if (el.children.length) return false;
      return el.textContent.trim() || el.tagName === 'IMG' || el.tagName === 'INPUT';
    });

    const max = document.documentElement.scrollHeight - window.innerHeight;
    let result = { gap: Infinity, culprit: null, at: 0 };

    for (let i = 0; i <= 10; i++) {
      window.scrollTo(0, Math.round((max * i) / 10));
      const wavesTop = waves.getBoundingClientRect().top;
      for (const el of copy) {
        const box = el.getBoundingClientRect();
        // Only what is actually on screen can be overlapped by the waves.
        if (box.bottom <= 0 || box.top >= window.innerHeight) continue;
        const gap = Math.round(wavesTop - box.bottom);
        if (gap < result.gap) {
          result = {
            gap,
            culprit: el.tagName.toLowerCase() + (el.className ? `.${el.className}` : ''),
            at: Math.round(window.scrollY),
          };
        }
      }
    }
    return result;
  });
}

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
