/**
 * The Tide's Hibiscus Coast business directory — the category taxonomy.
 *
 * This file holds the *categories* (slug, name, SEO copy, wave, towns list) —
 * hand-kept here, the same as ever. The *listings* inside a published category
 * no longer live in a sibling file: they come from `DirectoryListing` in the
 * ad manager's Supabase project (`tlderdsxnonhemkdxqns`), the same "Newsletter
 * ad management" project `/submit-event` and `/submit-classified` already
 * write to — fetched over PostgREST at build time with a top-level `await`.
 * See `supabase/newsletter-ads/migrations` for the table and the read policy,
 * and `supabase/README.md` for the two manual deploy steps that make this
 * live in production.
 *
 * A category goes live by carrying `published: true` below — that, not the
 * presence of a file, is what gets it a fetch, a URL, a route, a hub tile and
 * its counts. Categories without it are the build queue: they render nowhere
 * on the public page, whatever rows the operator has already added for them
 * in the ad manager (see the note on `published` below).
 *
 *   {
 *     slug:       'plumbers',              // URL segment under the hub
 *     name:       'Plumbers',              // tile heading and breadcrumb
 *     tileBlurb:  'One line, hand-written.',
 *     schemaType: 'Plumber',               // schema.org LocalBusiness subtype
 *     wave:        1,                      // which build wave it belongs to
 *     published:   true,                   // fetches listings and gets a page
 *     intro:      'Hand-written SEO intro for the category page.',
 *     href:       '/…',                    // only to override the derived URL
 *   }
 *
 * Towns are sections *within* a category page, never pages of their own — the
 * Coast is too small to carry a page per category per town without them all
 * reading as the same page.
 */

/** Where the hub lives. Category pages hang off it. */
export const BASE = '/hibiscus-coast-business-directory';

/** Every town the directory covers. A listing's `town` must be one of these. */
export const towns = [
  'Orewa',
  'Whangaparāoa',
  'Silverdale',
  'Red Beach',
  'Millwater',
  'Stanmore Bay',
  'Manly',
  'Gulf Harbour',
  'Arkles Bay',
  'Hatfields Beach',
];

/**
 * The hub is deliberately not indexable until it has enough behind it to be
 * worth landing on. Below this many live categories it ships `noindex, follow`
 * and stays out of the sitemap — links still flow, nothing thin gets crawled.
 * Crossing the threshold flips it on its own; there is no switch to remember.
 */
export const INDEX_THRESHOLD = 3;

const rawCategories = [
  {
    slug: 'cafes',
    name: 'Cafés & coffee',
    tileBlurb:
      'Where Coasties actually go for a flat white, from the ones worth a detour to the ones worth a morning.',
    schemaType: 'CafeOrCoffeeShop',
    wave: 1,
    published: true,
    intro:
      "Orewa has its own roundup — there are enough good ones on that one strip to justify it, and it's linked below. This is everywhere else: the peninsula, Stanmore Bay, Manly and the marina, where the coffee is more spread out and worth knowing about in advance. A couple roast their own, one is small enough that you will wait for a table on a Saturday, and one is the only reason to walk up from the boatyard.",
    // Orewa is deliberately not on the category page — it has its own roundup,
    // it was here first, and two pages listing the same four cafés would split
    // the same query between them and win neither.
    seeAlso: {
      name: 'Best coffee in Orewa',
      href: '/orewa-best-coffee',
      note: 'Orewa has enough good ones on one strip to be its own list.',
    },
  },
  {
    slug: 'plumbers',
    name: 'Plumbers',
    tileBlurb:
      'The ones who turn up when they say they will — for the burst pipe and for the bathroom you have been putting off.',
    schemaType: 'Plumber',
    wave: 1,
    published: true,
    intro:
      "Every plumber here is based on the Coast rather than driving up from town, which is the difference between an hour and a morning when something is leaking. Most cover the whole stretch from Silverdale out to Gulf Harbour, and a few run around the clock for the burst pipe that never picks a weekday. Where someone is a Master Plumbers member, a certifying gasfitter or a registered drainlayer, we've said so — that's the thing worth checking before you agree to the big job, not after.",
  },
  {
    slug: 'electricians',
    name: 'Electricians',
    tileBlurb:
      'Registered sparkies working the Coast, for everything from a dead socket to a whole rewire.',
    schemaType: 'Electrician',
    wave: 1,
    published: true,
    intro:
      "Electrical work is the one trade where the paperwork matters as much as the job — a Certificate of Compliance is what your insurer asks for after a fire, and what a buyer's lawyer asks for at sale. Everyone here is registered and working out of the Coast rather than driving up from town. Where a firm is a Master Electricians member, that adds a workmanship guarantee on top of the certificate, which is worth the difference on a rewire or a new build.",
  },
  {
    slug: 'mechanics',
    name: 'Mechanics & auto repair',
    tileBlurb:
      'WOFs, servicing and the second opinion worth getting before you agree to the big job.',
    schemaType: 'AutoRepair',
    wave: 1,
    published: true,
    intro:
      "Most of the Coast's workshops sit in Silverdale, close enough to the motorway that a WOF and a service can be a lunch-hour job rather than a day without the car. The mobile mechanics are the other half of the picture — they come to the driveway, which is worth more than it sounds if the car is the reason you cannot get anywhere. Where a place has a specialty, a European marque or heavy diesel, we've said so, because that is usually the difference between a diagnosis and a guess.",
  },
  {
    slug: 'hairdressers',
    name: 'Hairdressers & barbers',
    tileBlurb:
      'Salons and barbers from Orewa to Gulf Harbour, including the ones you still need to book a fortnight ahead.',
    schemaType: 'HairSalon',
    wave: 1,
  },
  // Wave two — sequenced after Search Console has had a look at wave one.
  {
    slug: 'restaurants',
    name: 'Restaurants & takeaways',
    tileBlurb: 'Dinner out and dinner picked up, from the beachfront to the highway.',
    schemaType: 'Restaurant',
    wave: 2,
  },
  {
    slug: 'builders',
    name: 'Builders & renovations',
    tileBlurb: 'Renovations, decks and new builds, from people with the Coast in their consent history.',
    schemaType: 'GeneralContractor',
    wave: 2,
  },
  {
    slug: 'painters',
    name: 'Painters & decorators',
    tileBlurb: 'Interior, exterior and the roof you have been eyeing since winter.',
    schemaType: 'HousePainter',
    wave: 2,
  },
  {
    slug: 'landscaping',
    name: 'Landscaping & lawn care',
    tileBlurb: 'Lawns, hedges, retaining and the seaside gardens that ask a bit more of everyone.',
    schemaType: 'LocalBusiness',
    wave: 2,
  },
  {
    slug: 'real-estate',
    name: 'Real estate agents',
    tileBlurb: 'Who is actually selling on the Coast, street by street.',
    schemaType: 'RealEstateAgent',
    wave: 2,
  },
  {
    slug: 'dentists',
    name: 'Dentists',
    tileBlurb: 'Check-ups, emergencies and the practices taking new patients.',
    schemaType: 'Dentist',
    wave: 2,
  },

  // Wave three.
  {
    slug: 'beauty',
    name: 'Beauty & day spas',
    tileBlurb: 'Facials, nails, brows and somewhere to disappear for an hour.',
    schemaType: 'BeautySalon',
    wave: 3,
  },
  {
    slug: 'physio',
    name: 'Physio, chiro & massage',
    tileBlurb: 'For the netball knee, the desk shoulder and the surf that did not go to plan.',
    schemaType: 'Physiotherapy',
    wave: 3,
  },
  {
    slug: 'vets',
    name: 'Vets & pet care',
    tileBlurb: 'Clinics, groomers and after-hours, for the dogs that own the estuary path.',
    schemaType: 'VeterinaryCare',
    wave: 3,
  },
  {
    slug: 'gyms',
    name: 'Gyms & fitness',
    tileBlurb: 'Gyms, studios and the classes people on the Coast keep showing up to.',
    schemaType: 'HealthClub',
    wave: 3,
  },
  {
    slug: 'childcare',
    name: 'Childcare & early learning',
    tileBlurb: 'Daycares, kindys and home-based care, with an honest word on waitlists.',
    schemaType: 'ChildCare',
    wave: 3,
  },
  {
    slug: 'cleaners',
    name: 'Cleaners',
    tileBlurb: 'Homes, moves and end-of-tenancy, plus windows nobody else wants to do.',
    schemaType: 'LocalBusiness',
    wave: 3,
  },
  {
    slug: 'movers',
    name: 'Movers & storage',
    tileBlurb: 'Moving up the Coast, down it, or into a shed for a while.',
    schemaType: 'MovingCompany',
    wave: 3,
  },
  {
    slug: 'accountants',
    name: 'Accountants & bookkeepers',
    tileBlurb: 'For the small Coast business, the rental and the GST return.',
    schemaType: 'AccountingService',
    wave: 3,
  },
];

// The noticeboard lives in the Newsletter ad management project, not the
// one the-tide's own signup forms write to — same project, same publishable
// key, `src/pages/submit-event.astro` already hardcodes both.
const SUPABASE_URL = 'https://tlderdsxnonhemkdxqns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lX7NuQ4pMVbVnC0FXFNSzg_1P1jxwl9';

/**
 * One published category's rows, in DB order: the operator's featured pick
 * (if any) first, then the rest oldest-first. `select=*` is safe here — the
 * table has no column this repo shouldn't see, unlike Event/Classified, which
 * carry an operator-only `notes` field this project never reads.
 *
 * Throws on anything other than a clean 200 with a JSON array, on purpose: a
 * silent empty directory (RLS denying `anon` with a 200, a typo'd category, a
 * network blip) is worse than a build that fails loudly and gets noticed.
 */
async function fetchListings(slug) {
  const url =
    `${SUPABASE_URL}/rest/v1/DirectoryListing` +
    `?category=eq.${encodeURIComponent(slug)}&order=featured.desc,createdAt.asc&select=*`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
  } catch (cause) {
    throw new Error(`Directory: could not reach Supabase for "${slug}" listings.`, { cause });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Directory: fetching "${slug}" listings failed with ${response.status} ${response.statusText}. ${body}`.trim(),
    );
  }

  const listings = await response.json();
  if (!Array.isArray(listings)) {
    throw new Error(`Directory: unexpected response fetching "${slug}" listings (not an array).`);
  }
  return listings;
}

/**
 * Folds a published category's fetched listings into its taxonomy entry.
 * A category with no `listings` (not `published`) passes through unchanged —
 * the build queue, same as before.
 *
 * Pulled out as its own function, rather than inlined in the `.map` below, so
 * it can be unit tested against a synthetic `listings` array without needing
 * the network fetch above — see tests/directory.spec.js.
 */
export function deriveCategory(category, listings) {
  if (!listings) return category;

  // At most one `featured: true` row per category is enforced server-side in
  // the ad manager (a transaction, not this repo's job to re-check) — `find`
  // rather than `filter` on purpose, so this still behaves sanely if that
  // ever slipped.
  const featuredListing = listings.find((listing) => listing.featured) ?? null;
  const rest = listings.filter((listing) => listing !== featuredListing);

  // The hub tile teaser: the featured listing's name leads when there is one,
  // then fill to three with the rest in the order the page groups them.
  const featuredTeaser = [
    ...(featuredListing ? [featuredListing.name] : []),
    ...rest.map((listing) => listing.name),
  ].slice(0, 3);

  return {
    ...category,
    href: category.href ?? `${BASE}/${category.slug}`,
    listings,
    featuredListing,
    count: listings.length,
    featured: featuredTeaser,
  };
}

const publishedCategories = rawCategories.filter((category) => category.published);

// Only the categories with `published: true` fetch anything — the same gate
// the old `pages` map enforced, so a couple of rows added to `hairdressers`
// from the ad manager's new /directory page can't spawn a half-built public
// page before its intro copy is written and it clears the listings minimum
// `tests/directory.spec.js` enforces.
const fetchedListings = await Promise.all(
  publishedCategories.map((category) => fetchListings(category.slug)),
);
const listingsBySlug = new Map(
  publishedCategories.map((category, index) => [category.slug, fetchedListings[index]]),
);

/**
 * The taxonomy with each published category's fetched listings folded in —
 * its URL, listings, featured pick, count and the (up to three) names the hub
 * tile teaser shows. All derived, so a listing added in the ad manager shows
 * up here on the next build without anyone touching this file.
 */
export const categories = rawCategories.map((category) =>
  deriveCategory(category, listingsBySlug.get(category.slug)),
);

/** The categories the hub has somewhere to send a reader. */
export const liveCategories = categories.filter((category) => category.href);

/**
 * The categories that generate a page under the hub. Not the same set as
 * `liveCategories`: Cafés is live but points at the standalone Orewa roundup,
 * which is its own page and not built from a listings file.
 */
export const pagedCategories = categories.filter((category) => category.listings);

/** True once the hub carries enough to be worth landing on from a search. */
export const isIndexable = liveCategories.length >= INDEX_THRESHOLD;
