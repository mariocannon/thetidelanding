/**
 * The Tide's ranked roundup of fish and chip shops across the Hibiscus Coast,
 * kept by hand, same pattern as `coffee.js` and `issues.js`. First entry
 * shipped from the Play D queue in `drafts/directory/PLAYBOOK.md`.
 *
 *   {
 *     name:     'Shop name',
 *     town:     'Orewa',                       // must match a directory town
 *                                              // key (ASCII, per BRANDING §7)
 *     location: 'Street or landmark, Town',    // display line, Ōrewa macronised
 *     blurb:    "Why it's on the list, in the editor's voice (VOICE.md).",
 *     phone:    '09 000 0000',   // optional, enables a tel: link on the card
 *     url:      'https://…',      // optional, their site or Facebook
 *   }
 *
 * The array order IS the ranking. `hibiscus-coast-best-fish-and-chips.astro`
 * prints it 1..n and the ItemList schema mirrors it, so re-ordering here
 * re-ranks the page. When "Restaurants & takeaways" goes live as a directory
 * category, give its taxonomy entry a `seeAlso` pointing here (Play D step 5).
 *
 * `town` feeds a proper `PostalAddress` in the page's structured data. That's
 * a deliberate step past `coffee.js`, which keeps a plain-string address
 * because it doesn't always know a street number. Here we do, for all nine,
 * and a machine-readable locality is the main local-search lever a
 * "best fish and chips <place>" page has.
 *
 * Voice: the blurbs are the editor's, per `VOICE.md`, not the impersonal §7
 * register. First person, "and"/"&" joins, no em dashes, one plain opinion
 * then move on. The meta title and description on the page stay in §7.
 *
 * The order is editorial, built from a lot of Friday nights and asking around,
 * not one blind taste test. Every fact in a blurb (an address, a closing day,
 * "since 1998", a change of owner) was checked against at least two sources on
 * 29 Aug 2026. Keep it that way on any edit, and re-verify quarterly with the
 * rest of the directory (Play E). Chippies change hands often, and a couple on
 * the Coast closed while this was being written.
 */
export const fishAndChips = [
  {
    name: 'FIN Fish Butchery & Seafood',
    town: 'Orewa',
    location: 'Ōrewa Square, Shop 5 & 6, 350 Hibiscus Coast Highway, Ōrewa',
    blurb:
      "The McGregors are Ōrewa locals and they run this as a proper whole-fish butchery, New Zealand catch broken down in house, then they opened Fin & Chips right next door in June 2026 to batter it. There's a dedicated gluten-free fryer too, which is still rare up here. Ask what came in that morning and get that.",
    phone: '09 558 8568',
    url: 'https://www.finfishbutchery.co.nz/',
  },
  {
    name: 'Kippers Takeaways',
    town: 'Orewa',
    location: 'Opposite the beach, 292 Hibiscus Coast Highway, Ōrewa',
    blurb:
      "This is the Ōrewa default and it earns it. Panko-crumbed snapper and tarakihi, kūmara chips that come out crisp and not soft, and a chef who has clearly done this a while. They're closed Mondays so the Sunday night queue is a real thing. Get the chowder if it's on and a shake for the walk down to the sand.",
    phone: '09 426 3969',
    url: 'https://www.facebook.com/KippersTakeaways/',
  },
  {
    name: 'Red Beach Takeaways',
    town: 'Red Beach',
    location: '42 Red Beach Road, Red Beach',
    blurb:
      "For years this was the peninsula's answer to best on the Coast, crisp batter, sweet snapper and chips that aren't swimming in oil. It's changed hands lately and the regulars are split on it, so ask for your chips well drained and make your own call. The chicken burger has held up through the change either way.",
    phone: '09 426 6660',
  },
  {
    name: 'Millwater Takeaway',
    town: 'Millwater',
    location: '175 Millwater Parkway, Millwater',
    blurb:
      "If you're up the Millwater end and can't face the highway, this is the one to know. Snapper and a scoop done straight, plus crispy chicken, Vietnamese baguettes and a Chinese menu for when half the car wants something else. It rates well and it doesn't make you wait.",
    phone: '09 212 9691',
  },
  {
    name: 'Drunken Crayfish',
    town: 'Gulf Harbour',
    location: '69 Gulf Harbour Drive, Whangaparāoa',
    blurb:
      "Not really a chippy, it's a licensed seafood spot with actual tables, but the fish and chips travel well and people out that end rate them. Phone ahead and it's a 10 to 15 minute wait. Worth knowing about if you're already out past Gulf Harbour for something.",
    phone: '09 428 5042',
  },
  {
    name: 'Fish Bar',
    town: 'Stanmore Bay',
    location: '15 Karepiro Drive, Stanmore Bay',
    blurb:
      "The tidy little snapper shop for the western end of the peninsula. Clean counter, quick service, and you can order online if you'd rather not stand around. Closed Mondays. Nothing flash on the menu and that's fine, the point is fresh fish done properly on a Tuesday night.",
    phone: '09 424 7188',
  },
  {
    name: 'Manly Takeaways & Sun View Chinese',
    town: 'Manly',
    location: '62 Rawhiti Road, Manly',
    blurb:
      "Family run since 1998 and still the Manly one stop, fish, chips and a full Chinese menu off the one counter. The Manly Burger and the potato balls are what the regulars actually walk out with. Fast even on a Friday night.",
    phone: '09 424 1750',
  },
  {
    name: 'Ocean Eats',
    town: 'Silverdale',
    location: '17 Hibiscus Coast Highway, Silverdale',
    blurb:
      "Half fishmonger and half fry shop, so you can buy the snapper raw for the pan or have it battered to take away. The Silverdale pick if you like to see the fish before it goes in the crumb. There's live order tracking on their site too.",
  },
  {
    name: '687 Takeaways',
    town: 'Stanmore Bay',
    location: '687 Whangaparāoa Road, Stanmore Bay',
    blurb:
      "The workhorse for a mixed order, a scoop of chips, a piece of fish and a few spring rolls, no fuss. It's not the one you write home about and it doesn't try to be. But it's open, it's quick and it's on the way home.",
    phone: '09 428 3535',
  },
];
