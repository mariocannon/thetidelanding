import { expect, test } from '@playwright/test';

import {
  BASE as PATH,
  categories,
  deriveCategory,
  INDEX_THRESHOLD,
  isIndexable,
  liveCategories,
  pagedCategories,
  towns,
} from '../src/data/directory/index.js';

// Importing the module above runs its build-time fetch against the ad
// manager's live `DirectoryListing` table (see the module's own doc comment)
// — every test below shares that one fetch, the same way the rest of this
// suite already depends on a live build. `deriveCategory` itself is pure
// (listings in, shaped category out), so the tests for it further down don't
// depend on what that fetch returned.

/**
 * The floor a category has to clear before it earns a page. A dynamic route
 * over a data file makes twenty thin pages exactly as cheap as two good ones,
 * and this is the thing that stops that being the path of least resistance.
 */
const MIN_LISTINGS = 5;

// --- The data file's own invariants ------------------------------------------
// A directory built from a data file is one careless paste away from turning
// into twenty thin templated pages. These are the rules that stop that, checked
// before anything renders.

test('every category has a slug, a name, a hand-written blurb and a schema type', () => {
  for (const category of categories) {
    expect(category.slug, `slug on ${category.name}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(category.name?.trim(), `name on ${category.slug}`).toBeTruthy();
    expect(category.schemaType?.trim(), `schemaType on ${category.slug}`).toBeTruthy();
    // Long enough that it had to be written rather than filled in.
    expect(category.tileBlurb?.trim().length ?? 0, `tileBlurb on ${category.slug}`).toBeGreaterThan(40);
  }
});

test('no two categories share a slug', () => {
  const slugs = categories.map((category) => category.slug);
  expect(slugs).toHaveLength(new Set(slugs).size);
});

test('a live category points somewhere real and says how many it holds', () => {
  for (const category of liveCategories) {
    expect(category.href, `href on ${category.slug}`).toMatch(/^\//);
    expect(category.count, `count on ${category.slug}`).toBeGreaterThan(0);
  }
});

test('the towns list has no duplicates', () => {
  expect(towns).toHaveLength(new Set(towns).size);
});

// --- What a category has to have before it gets a page ------------------------

test('no category ships a page with fewer listings than it takes to be useful', () => {
  for (const category of pagedCategories) {
    expect(category.listings.length, `listings in ${category.slug}`).toBeGreaterThanOrEqual(
      MIN_LISTINGS,
    );
  }
});

test('every category page opens with an intro somebody wrote', () => {
  for (const category of pagedCategories) {
    const intro = category.intro?.trim() ?? '';
    // Long enough that it can't be a placeholder or the tile blurb moved over.
    expect(intro.length, `intro on ${category.slug}`).toBeGreaterThanOrEqual(200);
    expect(intro, `intro on ${category.slug} repeats the tile blurb`).not.toBe(
      category.tileBlurb.trim(),
    );
  }
});

test('every listing names a real business in a town we cover', () => {
  for (const category of pagedCategories) {
    for (const listing of category.listings) {
      const where = `${category.slug} → ${listing.name}`;
      expect(listing.name?.trim(), `name in ${category.slug}`).toBeTruthy();
      expect(towns, `town on ${where}`).toContain(listing.town);
      // A one-liner isn't a recommendation. This is the difference between a
      // curated directory and a scraped one.
      expect(listing.blurb?.trim().length ?? 0, `blurb on ${where}`).toBeGreaterThan(60);
      // bizdata's own validation for this table accepts either scheme (its
      // seeded/operator-entered urls aren't guaranteed https) — this repo
      // isn't the source of truth for what's a valid listing url any more.
      if (listing.url) expect(listing.url, `url on ${where}`).toMatch(/^https?:\/\//);
      if (listing.phone) expect(listing.phone, `phone on ${where}`).toMatch(/^[\d\s+()-]{7,}$/);
    }
  }
});

test('no business is listed twice inside one category', () => {
  for (const category of pagedCategories) {
    const names = category.listings.map((listing) => listing.name);
    expect(names, `duplicate listing in ${category.slug}`).toHaveLength(new Set(names).size);
  }
});

test('the hub tile counts match what the category pages actually hold', () => {
  for (const category of pagedCategories) {
    expect(category.count, `count on ${category.slug}`).toBe(category.listings.length);
    expect(category.featured.length, `featured on ${category.slug}`).toBeLessThanOrEqual(3);
    expect(category.href).toBe(`${PATH}/${category.slug}`);
  }
});

test('the hub tile teaser leads with the featured listing, when there is one', () => {
  // Same "no live featured row today" caveat as the per-category featured
  // test above — self-validating, and backed by the deterministic
  // `deriveCategory` unit tests further down.
  for (const category of pagedCategories) {
    if (!category.featuredListing) continue;
    expect(category.featured[0], `teaser on ${category.slug}`).toBe(category.featuredListing.name);
  }
});

// --- The hub page -------------------------------------------------------------

test('the hub lists exactly the categories that have a page', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('.categories .card')).toHaveCount(liveCategories.length);

  const hrefs = await page
    .locator('.category-link')
    .evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
  expect(hrefs).toEqual(liveCategories.map((category) => category.href));
});

test('nothing on the hub links to a category that has not been built', async ({ page }) => {
  await page.goto(PATH);
  const built = new Set(liveCategories.map((category) => category.href));
  const dead = categories
    .filter((category) => !category.href)
    .map((category) => `${PATH}/${category.slug}`);

  const hrefs = await page
    .locator('main a')
    .evaluateAll((links) => links.map((link) => new URL(link.href).pathname));

  for (const href of hrefs) {
    expect(dead, `${href} is a category page that doesn't exist yet`).not.toContain(href);
    if (href.startsWith(`${PATH}/`)) expect(built).toContain(href);
  }
});

test('the build queue is only ever shown while the page is unindexed', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('.planned')).toHaveCount(isIndexable ? 0 : 1);
});

test('the hub stays out of the index until it is worth landing on', async ({ page }) => {
  const response = await page.goto(PATH);
  expect(response.status()).toBe(200);

  const expected = liveCategories.length >= INDEX_THRESHOLD ? 'index, follow' : 'noindex, follow';
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', expected);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://thetide.co.nz${PATH}`,
  );
});

test('the sitemap and the robots meta agree about the hub', async ({ page, request }) => {
  await page.goto(PATH);
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');

  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.ok()).toBeTruthy();
  const listed = (await sitemap.text()).includes(PATH);

  expect(listed, 'a noindex page must not be in the sitemap').toBe(!robots.includes('noindex'));
});

test('the structured data describes the same categories the page shows', async ({ page }) => {
  await page.goto(PATH);
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent)));

  const collection = blocks.find((block) => block['@type'] === 'CollectionPage');
  expect(collection).toBeTruthy();
  expect(collection.mainEntity.itemListElement.map((item) => item.name)).toEqual(
    liveCategories.map((category) => category.name),
  );

  // No invented ratings, anywhere. We don't collect them.
  expect(JSON.stringify(blocks)).not.toContain('aggregateRating');
});

test('every page in the directory carries a share card that exists', async ({ page, request }) => {
  for (const path of [PATH, ...pagedCategories.map((category) => category.href)]) {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image, `og:image on ${path}`).toBe(
      'https://thetide.co.nz/social/directory-social.png',
    );
    // A 404 in og:image is worse than a generic card — check the file is there.
    const asset = await request.get(new URL(image).pathname);
    expect(asset.ok(), `${image} is missing from public/social`).toBeTruthy();
  }
});

test('the breadcrumb walks back to the home page', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('.breadcrumb a[href="/"]')).toBeVisible();
  await expect(page.locator('.breadcrumb [aria-current="page"]')).toHaveText('Business directory');
});

// --- The category pages -------------------------------------------------------

/**
 * A category's listings with the operator's featured pick (if any) taken out
 * — what actually lands in the town groups. `!==` is safe here: within one
 * `categories` module instance, `featuredListing` is a reference into
 * `listings`, not a copy.
 */
const townGrouped = (category) =>
  category.listings.filter((listing) => listing !== category.featuredListing);

/** The order the page prints in: the featured pick, then everyone else in
 *  town (coast) order. */
const expectedOrder = (category) => [
  ...(category.featuredListing ? [category.featuredListing] : []),
  ...towns.flatMap((town) => townGrouped(category).filter((listing) => listing.town === town)),
];

for (const category of pagedCategories) {
  test(`/${category.slug} lists every business in its data file`, async ({ page }) => {
    const response = await page.goto(category.href);
    expect(response.status()).toBe(200);

    await expect(page.locator('.card')).toHaveCount(category.listings.length);
    await expect(page.locator('h1')).toContainText(category.name);
    await expect(page.locator('.lede')).toHaveText(category.intro);

    const shown = await page
      .locator('.card-name')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    expect(new Set(shown)).toEqual(new Set(category.listings.map((listing) => listing.name)));
  });

  test(`/${category.slug} groups its listings by town, in coast order`, async ({ page }) => {
    await page.goto(category.href);

    // Only what actually lands in a town section — a featured pick is pulled
    // out into its own block above these, so it shouldn't grow a one-listing
    // town a heading of its own if it's the only thing in that town.
    const expected = towns.filter((town) =>
      townGrouped(category).some((listing) => listing.town === town),
    );
    const headings = await page
      .locator('.town-name')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    expect(headings).toEqual(expected);
  });

  test(`/${category.slug} puts a featured listing above the town groups, and out of them`, async ({
    page,
  }) => {
    // No listing is seeded featured today (bizdata-coder's 26 Aug handoff),
    // so this exercises the "no featured pick" branch in the common case —
    // it's written to self-validate the moment the operator marks one
    // featured from the ad manager's /directory page and this rebuilds, with
    // no test change needed. The exact shaping this depends on (which
    // listing is pulled out, what leads the hub tile teaser) is covered
    // deterministically, independent of live data, by the `deriveCategory`
    // unit tests below.
    await page.goto(category.href);

    if (!category.featuredListing) {
      await expect(page.locator('.featured-listing')).toHaveCount(0);
      return;
    }

    await expect(page.locator('.featured-listing')).toHaveCount(1);
    await expect(page.locator('.featured-listing .card-name')).toContainText(
      category.featuredListing.name,
    );

    const townNames = await page
      .locator('.town .card-name')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
    expect(townNames, 'featured listing repeated inside a town group').not.toContain(
      category.featuredListing.name,
    );

    const sectionOrder = await page.evaluate(() =>
      [...document.querySelectorAll('.featured-listing, .town')].map((el) => el.className),
    );
    expect(sectionOrder[0]).toContain('featured-listing');
  });

  test(`/${category.slug} describes the same businesses in its structured data`, async ({
    page,
  }) => {
    await page.goto(category.href);
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent)));

    const itemList = blocks.find((block) => block['@type'] === 'ItemList');
    // Featured first, then town groups — same order the page renders in, not
    // the DB's featured-then-createdAt fetch order.
    expect(itemList.itemListElement.map((entry) => entry.item.name)).toEqual(
      expectedOrder(category).map((listing) => listing.name),
    );
    for (const entry of itemList.itemListElement) {
      expect(entry.item['@type']).toBe(category.schemaType);
    }

    // No invented ratings, on any page. We don't collect them.
    expect(JSON.stringify(blocks)).not.toContain('aggregateRating');

    const crumbs = blocks.find((block) => block['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement.map((entry) => entry.name)).toEqual([
      'The Tide',
      'Business directory',
      category.name,
    ]);
  });

  test(`/${category.slug} links back up to the hub and out to each business`, async ({ page }) => {
    await page.goto(category.href);
    await expect(page.locator(`.breadcrumb a[href="${PATH}"]`)).toBeVisible();
    await expect(page.locator(`.footnote a[href="${PATH}"]`)).toBeVisible();

    for (const listing of category.listings.filter((entry) => entry.url)) {
      const link = page.locator(`.card-name a[href="${listing.url}"]`);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test(`/${category.slug} never scrolls sideways`, async ({ page }) => {
    await page.goto(category.href);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('a category that hands off to a deeper page says so, and the link works', async ({ page }) => {
  const handoffs = pagedCategories.filter((category) => category.seeAlso);
  expect(handoffs.length, 'no category has a seeAlso to check').toBeGreaterThan(0);

  for (const category of handoffs) {
    await page.goto(category.href);
    const link = page.locator(`.see-also a[href="${category.seeAlso.href}"]`);
    await expect(link).toBeVisible();

    expect((await page.goto(category.seeAlso.href)).status()).toBe(200);
  }
});

test('the cafés page leaves Orewa to the Orewa roundup', async () => {
  // The two pages exist side by side only because they don't overlap. If Orewa
  // ever creeps onto the category page they start competing for one query.
  const cafes = pagedCategories.find((category) => category.slug === 'cafes');
  expect(cafes.listings.some((listing) => listing.town === 'Orewa')).toBe(false);
  expect(cafes.seeAlso.href).toBe('/orewa-best-coffee');
});

test('the Orewa roundup sits under the cafés category, four deep', async ({ page }) => {
  await page.goto('/orewa-best-coffee');
  const crumbs = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts
        .map((script) => JSON.parse(script.textContent))
        .find((block) => block['@type'] === 'BreadcrumbList'),
    );
  expect(crumbs.itemListElement.map((entry) => entry.name)).toEqual([
    'The Tide',
    'Business directory',
    'Cafés & coffee',
    'Best coffee in Orewa',
  ]);
  await expect(page.locator(`.breadcrumb a[href="${PATH}/cafes"]`)).toBeVisible();
});

test('every category page is reachable from the hub in one click', async ({ page }) => {
  await page.goto(PATH);
  for (const category of pagedCategories) {
    await expect(page.locator(`.categories a[href="${category.href}"]`)).toBeVisible();
  }
});

// --- The links in and out -----------------------------------------------------

test('the home page and the coffee roundup both point at the directory', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(`a[href="${PATH}"]`)).toBeVisible();

  await page.goto('/orewa-best-coffee');
  await expect(page.locator(`.breadcrumb a[href="${PATH}"]`)).toBeVisible();
});

test('someone can still subscribe from the directory', async ({ page }) => {
  await page.route('**/rest/v1/subscribers', (route) => route.fulfill({ status: 201, body: '' }));
  await page.goto(PATH);

  await page.fill('#subscribe-form #email', 'reader@example.com');
  await page.click('#subscribe-form button');

  await expect(page.locator('#subscribe-note')).toHaveClass(/success/);
  await expect(page.locator('#subscribe-form')).toBeHidden();
});

test('never scrolls sideways', async ({ page }) => {
  await page.goto(PATH);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

// --- deriveCategory — pure, no live data ---------------------------------------
//
// The page-level featured-listing tests above are self-validating but
// currently vacuous: nothing in the live `DirectoryListing` table is marked
// `featured` yet (bizdata-coder's 26 Aug handoff seeded all 21 rows
// unfeatured, and this repo has no credential to change a row in someone
// else's project from a test). `deriveCategory` is the one function that
// decides what a `featured: true` row does to a category — which listing
// leads, what it excludes from the town groups, what the hub tile teaser
// shows — so it's tested here directly, against a synthetic `listings` array,
// independent of the network fetch the rest of this file depends on.

const RAW = { slug: 'plumbers', href: undefined };

test('deriveCategory pulls the featured listing out and leads the teaser with it', () => {
  const a = { name: 'Ace Plumbing', town: 'Orewa', featured: false };
  const featured = { name: 'Best Plumbing', town: 'Silverdale', featured: true };
  const c = { name: 'Coast Plumbing', town: 'Manly', featured: false };

  const category = deriveCategory(RAW, [featured, a, c]);

  expect(category.featuredListing).toBe(featured);
  expect(category.listings).toEqual([featured, a, c]);
  expect(category.count).toBe(3);
  // Featured name first, then the rest in listing order, capped at three.
  expect(category.featured).toEqual(['Best Plumbing', 'Ace Plumbing', 'Coast Plumbing']);
});

test('deriveCategory caps the teaser at three even with a featured pick', () => {
  const featured = { name: 'Best Plumbing', town: 'Silverdale', featured: true };
  const rest = ['Ace', 'Coast', 'Delta', 'Echo'].map((name) => ({
    name,
    town: 'Orewa',
    featured: false,
  }));

  const category = deriveCategory(RAW, [featured, ...rest]);
  expect(category.featured).toEqual(['Best Plumbing', 'Ace', 'Coast']);
});

test('deriveCategory leaves featuredListing null and the teaser unchanged when nothing is featured', () => {
  const listings = ['Ace', 'Best', 'Coast', 'Delta'].map((name) => ({
    name,
    town: 'Orewa',
    featured: false,
  }));

  const category = deriveCategory(RAW, listings);
  expect(category.featuredListing).toBeNull();
  expect(category.featured).toEqual(['Ace', 'Best', 'Coast']);
});

test('deriveCategory passes a category through unchanged when it has no listings (unpublished)', () => {
  const category = deriveCategory(RAW, undefined);
  expect(category).toBe(RAW);
});

test('deriveCategory derives href from BASE and the slug when the category has none of its own', () => {
  const category = deriveCategory(RAW, []);
  expect(category.href).toBe(`${PATH}/plumbers`);
});

test('deriveCategory keeps an explicit href rather than deriving one', () => {
  const category = deriveCategory({ ...RAW, href: '/somewhere-else' }, []);
  expect(category.href).toBe('/somewhere-else');
});
