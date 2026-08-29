/**
 * The Tide's ranked roundup of fish and chip shops across the Hibiscus Coast —
 * kept by hand, same pattern as `coffee.js` and `issues.js`. This is the first
 * entry shipped from the Play D queue in `drafts/directory/PLAYBOOK.md`.
 *
 *   {
 *     name:     'Shop name',
 *     location: 'Street or landmark, Town',   // free text, like coffee.js
 *     blurb:    "Why it's on the list, and where it sits.",
 *     phone:    '09 000 0000',   // optional — enables a tel: link on the card
 *     url:      'https://…',      // optional — their site/Facebook, if any
 *   }
 *
 * The array order IS the ranking — `hibiscus-coast-best-fish-and-chips.astro`
 * prints it 1..n and the ItemList schema mirrors it. Re-ordering here re-ranks
 * the page. When "Restaurants & takeaways" goes live as a directory category,
 * give its taxonomy entry a `seeAlso` pointing here (Play D step 5).
 *
 * The order is editorial: built from what Coasties consistently say and what
 * each shop is known for, not one blind taste test. Every fact in a blurb —
 * an address, a closing day, "since 1998", a change of owner — was checked
 * against at least two sources on 29 Aug 2026. Keep it that way on any edit,
 * and re-verify quarterly with the rest of the directory (Play E): chippies
 * change hands often, and a couple on the Coast closed while this was written.
 */
export const fishAndChips = [
  {
    name: 'FIN Fish Butchery & Seafood',
    location: 'Ōrewa Square, 5–6/350 Hibiscus Coast Highway, Orewa',
    blurb:
      "Ōrewa locals Deahla and Jarrod McGregor run a whole-fish butchery here — traceable New Zealand catch, broken down in-house — and opened Fin & Chips next door in June 2026 to batter it. There's a dedicated gluten-free fryer, which on the Coast is rare. Ask what came in that morning.",
    phone: '09 558 8568',
    url: 'https://www.finfishbutchery.co.nz/',
  },
  {
    name: 'Kippers Takeaways',
    location: 'Opposite the beach, 292 Hibiscus Coast Highway, Orewa',
    blurb:
      "The Orewa default, and it earns it: an experienced chef, panko-crumbed snapper and tarakihi, and kūmara chips that come out crisp rather than soft. Closed Mondays, so the Sunday-night queue is a real thing. Get the chowder if it's on, and a shake for the walk to the sand.",
    phone: '09 426 3969',
    url: 'https://www.facebook.com/KippersTakeaways/',
  },
  {
    name: 'Red Beach Takeaways',
    location: '42 Red Beach Road, Red Beach',
    blurb:
      "For years the peninsula's answer to \"best on the Coast\" — crisp batter, sweet snapper, chips that aren't swimming in oil. It changed hands recently and the regulars are split, so ask for your chips well-drained and judge for yourself. The chicken burger has held up either way.",
    phone: '09 426 6660',
  },
  {
    name: 'Millwater Takeaway',
    location: '175 Millwater Parkway, Millwater',
    blurb:
      "The one to know if you're up the Millwater end and can't face the highway. Straight snapper and a scoop, plus crispy chicken, Vietnamese baguettes and a Chinese menu for when half the car wants something else. Rates well and doesn't make you wait.",
    phone: '09 212 9691',
  },
  {
    name: 'Drunken Crayfish',
    location: '69 Gulf Harbour Drive, Whangaparāoa',
    blurb:
      "Not strictly a chippy — it's a licensed seafood spot with tables — but the fish and chips travel well and locals rate them at the peninsula end. Phone ahead and it's a 10–15 minute wait. Worth it if you're already out past Gulf Harbour.",
    phone: '09 428 5042',
  },
  {
    name: 'Fish Bar',
    location: '15 Karepiro Drive, Stanmore Bay',
    blurb:
      "The tidy neighbourhood snapper shop for the western peninsula — clean counter, quick service, order online if you'd rather not stand around. Closed Mondays. Nothing flash on the menu; the point is fresh fish done properly on a Tuesday.",
    phone: '09 424 7188',
  },
  {
    name: 'Manly Takeaways & Sun View Chinese',
    location: '62 Rawhiti Road, Manly',
    blurb:
      "Family-run since 1998 and still the Manly one-stop: fish, chips and a full Chinese menu off the same counter. The Manly Burger and the potato balls are what the regulars actually order. Fast even on a Friday.",
    phone: '09 424 1750',
  },
  {
    name: 'Ocean Eats',
    location: '17 Hibiscus Coast Highway, Silverdale',
    blurb:
      "Half fishmonger, half fry shop — buy the snapper raw for the pan or battered to take away. The Silverdale pick if you like to see the fish before it's crumbed. Live order tracking on their site.",
  },
  {
    name: '687 Takeaways',
    location: '687 Whangaparāoa Road, Stanmore Bay',
    blurb:
      "The workhorse for a mixed order — a scoop of chips, a piece of fish, a few spring rolls, no fuss. Not the one you write home about, but it's open, it's quick, and it's on the way home.",
    phone: '09 428 3535',
  },
];
