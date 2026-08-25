/**
 * Plumbers — Hibiscus Coast business directory.
 *
 * Hand-kept, same as `coffee.js`. Every entry is a business *based* on the
 * Coast, not an Auckland-wide operator with an Orewa landing page — that
 * distinction is the whole reason this page deserves to exist.
 *
 *   {
 *     name:  'Business name',
 *     town:  'Orewa',                 // must appear in `towns` in ./index.js
 *     blurb: 'What they do, plainly.',
 *     url:   'https://…',             // optional
 *     phone: '021 000 000',           // optional
 *   }
 *
 * Details go stale — a number changes, a business closes. Recheck against the
 * `UPDATED` date on the page before letting it stand another quarter.
 */
export const plumbers = {
  intro:
    "Every plumber here is based on the Coast rather than driving up from town, which is the difference between an hour and a morning when something is leaking. Most cover the whole stretch from Silverdale out to Gulf Harbour, and a few run around the clock for the burst pipe that never picks a weekday. Where someone is a Master Plumbers member, a certifying gasfitter or a registered drainlayer, we've said so — that's the thing worth checking before you agree to the big job, not after.",

  listings: [
    {
      name: 'Grouse Plumbing',
      town: 'Whangaparāoa',
      blurb:
        'Residential and light commercial work the length of the peninsula — kitchens, bathrooms, hot water cylinders, spouting — with 24/7 call-outs for the things that will not wait. Master Plumbers and Site Safe members, which matters as much on a renovation as on an emergency.',
      url: 'https://grouseplumbing.co.nz/',
      phone: '021 0663 802',
    },
    {
      name: 'Laser Plumbing Silverdale',
      town: 'Silverdale',
      blurb:
        'On the Coast since 2009, covering plumbing, gasfitting and drainage from Silverdale out to Gulf Harbour. The Laser network behind them means a written quote and a guarantee on the work, which is the trade-off for not being the cheapest number you will get.',
      url: 'https://silverdale.laserplumbing.co.nz/',
    },
    {
      name: 'Flowpro Plumbers & Gasfitters',
      town: 'Silverdale',
      blurb:
        'Certified plumbers and gasfitters working out of Emirali Road, close enough to most of the Coast to make a same-day call realistic. General maintenance and gas work alike.',
      url: 'https://flowpro.co.nz/location/plumbers-hibiscus-coast-nz/',
    },
    {
      name: 'FlowFix Plumbing',
      town: 'Hatfields Beach',
      blurb:
        'A family-run outfit going since 2017, covering the Albany-to-Warkworth run. Bathroom and kitchen renovations, hot water cylinders, CCTV drain inspections, and the Dux Quest pipe replacement a lot of older Coast houses still need. Free quotes on the bigger jobs.',
      url: 'https://www.flowfix.co.nz/',
      phone: '027 265 4949',
    },
    {
      name: 'Millwater Plumbing',
      town: 'Millwater',
      blurb:
        'Certified plumber and licensed gasfitter working out of Millwater, minutes from Silverdale and the newer subdivisions — handy if you are in Milldale or Arra Hills and want someone who knows how those houses are put together. Eleven years on the Coast.',
      url: 'https://www.millwaterplumbing.co.nz/',
      phone: '021 750 686',
    },
    {
      name: 'Orewa Plumber',
      town: 'Orewa',
      blurb:
        'Fifteen years working Orewa and the surrounding beaches, from Orewa Point and Red Beach through to Gulf Harbour and Milldale. Homes and businesses both, with 24/7 availability.',
      url: 'https://orewaplumber.co.nz/',
      phone: '027 248 4935',
    },
  ],
};
