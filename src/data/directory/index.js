/**
 * The Tide's Hibiscus Coast business directory — the category taxonomy.
 *
 * This file holds *categories only*. The businesses inside each one live in a
 * sibling file named for its slug (`plumbers.js`, `marine.js`, …), the same
 * hand-kept way `coffee.js` and `issues.js` work. Nothing is fetched at build
 * or at load.
 *
 * A category goes live by being listed in `pages` below — add its file there
 * and it gets a URL, a route, a hub tile and its counts, all derived. There is
 * no `live` flag to forget to flip. Categories absent from `pages` are the
 * build queue: they render nowhere on the public page, because a directory of
 * dead ends is worse than a short one.
 *
 *   {
 *     slug:       'plumbers',              // URL segment under the hub
 *     name:       'Plumbers',              // tile heading and breadcrumb
 *     tileBlurb:  'One line, hand-written.',
 *     schemaType: 'Plumber',               // schema.org LocalBusiness subtype
 *     wave:        1,                      // which build wave it belongs to
 *     href:       '/…',                    // only to override the derived URL
 *   }
 *
 * Towns are sections *within* a category page, never pages of their own — the
 * Coast is too small to carry a page per category per town without them all
 * reading as the same page.
 */
import { cafes } from './cafes.js';
import { electricians } from './electricians.js';
import { marine } from './marine.js';
import { mechanics } from './mechanics.js';
import { plumbers } from './plumbers.js';

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

/**
 * The categories that have listings of their own, keyed by slug. Adding a file
 * here is what publishes a category — see `categories` at the foot of this file
 * for what gets derived from it.
 */
const pages = {
  cafes,
  plumbers,
  electricians,
  mechanics,
  marine,
};

const rawCategories = [
  {
    slug: 'cafes',
    name: 'Cafés & coffee',
    tileBlurb:
      'Where Coasties actually go for a flat white, from the ones worth a detour to the ones worth a morning.',
    schemaType: 'CafeOrCoffeeShop',
    wave: 1,
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
  },
  {
    slug: 'electricians',
    name: 'Electricians',
    tileBlurb:
      'Registered sparkies working the Coast, for everything from a dead socket to a whole rewire.',
    schemaType: 'Electrician',
    wave: 1,
  },
  {
    slug: 'mechanics',
    name: 'Mechanics & auto repair',
    tileBlurb:
      'WOFs, servicing and the second opinion worth getting before you agree to the big job.',
    schemaType: 'AutoRepair',
    wave: 1,
  },
  {
    slug: 'hairdressers',
    name: 'Hairdressers & barbers',
    tileBlurb:
      'Salons and barbers from Orewa to Gulf Harbour, including the ones you still need to book a fortnight ahead.',
    schemaType: 'HairSalon',
    wave: 1,
  },
  {
    slug: 'marine',
    name: 'Marine & boat services',
    tileBlurb:
      'Haul-outs, engines, antifoul and riggers — the trades that keep the Gulf Harbour fleet on the water.',
    schemaType: 'LocalBusiness',
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

/**
 * The taxonomy with each published category's own data folded in — its URL,
 * intro, listings, count and the three names the hub tile shows. All derived,
 * so a listing added to `plumbers.js` shows up in the count and the tile
 * without anyone having to remember to update them here.
 */
export const categories = rawCategories.map((category) => {
  const page = pages[category.slug];
  if (!page) return category;

  return {
    ...category,
    href: category.href ?? `${BASE}/${category.slug}`,
    intro: page.intro,
    listings: page.listings,
    count: page.listings.length,
    featured: page.listings.slice(0, 3).map((listing) => listing.name),
  };
});

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
