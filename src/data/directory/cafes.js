/**
 * Cafés & coffee — Hibiscus Coast business directory.
 *
 * Deliberately does NOT cover Orewa: `/orewa-best-coffee` is the Orewa
 * roundup, it was here first and it is the page that ranks. Two pages both
 * listing the same four Orewa cafés would compete with each other for the same
 * query and win neither. This one takes the rest of the Coast and hands Orewa
 * off — see `seeAlso` on the category in ./index.js.
 */
export const cafes = {
  intro:
    "Orewa has its own roundup — there are enough good ones on that one strip to justify it, and it's linked below. This is everywhere else: the peninsula, Stanmore Bay, Manly and the marina, where the coffee is more spread out and worth knowing about in advance. A couple roast their own, one is small enough that you will wait for a table on a Saturday, and one is the only reason to walk up from the boatyard.",

  listings: [
    {
      name: 'Cafe Hibiscus',
      town: 'Stanmore Bay',
      blurb:
        'A house roaster on Whangaparāoa Road, open from half six in the morning until four — early enough for the people who are actually up then. Generous breakfasts, quick service, outdoor seating.',
    },
    {
      name: 'Beans N Bites',
      town: 'Stanmore Bay',
      blurb:
        'All-day brunch, which is the useful kind — no cut-off at eleven for anybody who got the morning wrong. Table service inside and out.',
    },
    {
      name: 'At 719 Coffee and Eatery',
      town: 'Whangaparāoa',
      blurb:
        'Organic and locally sourced where they can get it, with baking done in-house. Weekdays and weekends both from eight until half two, so it is a morning place rather than a late-lunch one.',
    },
    {
      name: 'Local Cafe',
      town: 'Manly',
      blurb:
        'Tiny, on Rawhiti Road, and reckoned by a lot of people to be the best on the Coast. Everything is prepared on site with local produce, and the coffee has its own following. Weekdays only, seven until four.',
    },
    {
      name: 'Spinnakers Cafe & Bar',
      town: 'Gulf Harbour',
      blurb:
        'Inside the marina, looking out at the boats — licensed, so it works for a coffee after a haul-out or a beer after a day on the water. The obvious meeting point if you are down that end of the peninsula.',
    },
  ],
};
