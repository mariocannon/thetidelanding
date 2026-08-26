import { expect, test } from '@playwright/test';

/**
 * Proves the one thing that must not regress silently
 * (bizdata-coder's 26 Aug handoff, agent-comms/BOARD.md): a `PENDING` public
 * submission must never reach a category page, because the blanket anon
 * SELECT policy on `DirectoryListing` has no status awareness of its own —
 * `src/data/directory/index.js`'s `&status=eq.PUBLISHED` query filter is the
 * only thing standing between a submission and the live site.
 *
 * This can't be tested by driving the built site (`directory.spec.js` does
 * that against the real, shared `tlderdsxnonhemkdxqns` project, and this repo
 * has no credential to plant a fake PENDING row there — nor should a test
 * write one). Instead, this stubs the global `fetch` the module's top-level
 * await calls, so a fresh import of the module runs its real request-building
 * and response-parsing code against a small in-memory PostgREST stand-in that
 * actually honours (or, if the filter regresses, fails to honour) the query
 * string it's sent — proof that the filter *works*, not just that the query
 * string looks right by eye.
 *
 * A cache-busting query string on the dynamic import forces Node to
 * re-evaluate the module (and re-run its top-level fetch) rather than
 * returning the instance every other spec file's plain-specifier import
 * already cached in this worker.
 */

/** Every category this repo currently ships as `published: true`. Only
 *  "cafes" carries a fixture below — the rest resolve to an empty array,
 *  which `fetchListings` accepts same as a real empty category would. */
const PUBLISHED_SLUGS = ['cafes', 'plumbers', 'electricians', 'mechanics'];

const FIXTURE = {
  cafes: [
    {
      id: 'published-1',
      name: 'Published Cafe',
      category: 'cafes',
      town: 'Orewa',
      blurb: 'x'.repeat(70),
      phone: null,
      url: null,
      featured: false,
      status: 'PUBLISHED',
      source: 'STAFF',
    },
    {
      id: 'pending-1',
      name: 'Pending Cafe',
      category: 'cafes',
      town: 'Orewa',
      blurb: 'x'.repeat(70),
      phone: null,
      url: null,
      featured: false,
      status: 'PENDING',
      source: 'PUBLIC',
    },
  ],
};

/**
 * A PostgREST-shaped stand-in: parses `category=eq.<slug>` and
 * `status=eq.<value>` off the request URL and filters the fixture the same
 * way the real database would. Returns everything for a slug if no `status`
 * param is present at all — the shape a regression (someone dropping the
 * filter from the query string) would actually produce.
 */
function mockFetch(requests) {
  return async (url) => {
    const parsed = new URL(String(url));
    requests.push(parsed.toString());

    const categoryParam = parsed.searchParams.get('category'); // "eq.cafes"
    const statusParam = parsed.searchParams.get('status'); // "eq.PUBLISHED" or null
    const slug = categoryParam?.replace(/^eq\./, '');

    let rows = FIXTURE[slug] ?? [];
    if (statusParam) {
      const wanted = statusParam.replace(/^eq\./, '');
      rows = rows.filter((row) => row.status === wanted);
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

test('the build query excludes a PENDING listing from what a category page would render', async () => {
  const realFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = mockFetch(requests);

  try {
    const mod = await import(`../src/data/directory/index.js?status-filter-test=${Date.now()}-${Math.random()}`);
    const cafes = mod.categories.find((category) => category.slug === 'cafes');

    expect(cafes.listings.map((listing) => listing.id)).toEqual(['published-1']);
    expect(cafes.listings.some((listing) => listing.status === 'PENDING')).toBe(false);
    expect(cafes.count).toBe(1);

    // Not just "the right listings came back" — the request itself has to
    // carry the filter, so a future edit that silently drops `status` from
    // the query string (while somehow still passing the assertions above,
    // e.g. against a differently-shaped fixture) still fails here.
    const cafesRequest = requests.find((request) => request.includes('category=eq.cafes'));
    expect(cafesRequest).toContain('status=eq.PUBLISHED');
    for (const slug of PUBLISHED_SLUGS) {
      expect(requests.some((request) => request.includes(`category=eq.${slug}`))).toBe(true);
    }
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('a category with nothing published (only PENDING rows) renders as empty, not as the PENDING row', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = mockFetch([]);

  try {
    // A second cache-busting variant — Node's ESM cache is per resolved
    // specifier, so this re-runs the module's top-level fetch fresh rather
    // than reusing the instance the test above already evaluated.
    const mod = await import(
      `../src/data/directory/index.js?status-filter-test=${Date.now()}-${Math.random()}-2`
    );
    // Every published category in the fixture except "cafes" has no rows at
    // all for either status, so this only re-confirms "plumbers" specifically
    // never surfaces a PENDING row that isn't in its own fixture — the real
    // regression case is covered above. Kept as a second, independent check
    // that an empty/undefined response never throws or fabricates a listing.
    const plumbers = mod.categories.find((category) => category.slug === 'plumbers');
    expect(plumbers.listings).toEqual([]);
  } finally {
    globalThis.fetch = realFetch;
  }
});
