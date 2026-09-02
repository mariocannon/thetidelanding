/**
 * Every monthly Local Gardening Guide, newest first.
 *
 * The guide is laid out as an A4 PDF in `design/gardening-guide/`. Running
 * `node design/gardening-guide/publish.mjs` screenshots each section to
 * `public/gardening-guide/<slug>/*.png`, copies the PDF to
 * `public/gardening-guide/<slug>.pdf`, and writes the image manifest to
 * `gardening-guides.generated.js`. This file is the part kept by hand — one
 * entry per guide:
 *
 *   {
 *     slug: '2026-10',              // matches issue.slug in content.json; drives every path
 *     date: '2026-10-01',           // the issue it went out with, ISO, so it sorts
 *     label: 'October 2026',        // matches issue.label in content.json
 *     intro: 'One line for the earlier-months list and the page lede.',
 *   }
 *
 * Newest first is done at render time, so order here doesn't matter. While
 * this list is empty nothing links to /gardening-guide.
 */
export const guides = [
  {
    slug: '2026-09',
    date: '2026-09-03',
    label: 'September 2026',
    intro:
      "Spring's here, Coasties — what to sow now, September's planting calendar, and the community produce swap we're getting off the ground.",
  },
];
