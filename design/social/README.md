# Social images

Social-share images rendered straight from the built site, not drawn
separately — so a card can't say something the live page doesn't. Each script
builds the site, boots a static file server against `dist/`, screenshots one
page in headless Chromium with its interactive parts hidden by injected CSS,
then downsamples with Pillow for clean type and edges.

| File | Size | Renders |
| --- | --- | --- |
| `thetide-northern-expressway-toll-question.png` (`render-question.mjs`) | 1080 × 1080 | `/questions` |
| `home-social.png` (`render-home.mjs`) | 1200 × 630 | `/` |
| `orewa-best-coffee-social.png` (`render-coffee.mjs`) | 1200 × 630 | `/orewa-best-coffee` |
| `submit-event-social.png`, `submit-classified-social.png` (`render-submit.mjs`) | 1200 × 630 | `/submit-event`, `/submit-classified` |

Rebuild after the source page's copy changes:

```sh
npm run build
node design/social/render-question.mjs
node design/social/render-home.mjs
node design/social/render-coffee.mjs
node design/social/render-submit.mjs
```

Needs Playwright's Chromium (already a dev dependency — `npx playwright
install chromium` if it isn't downloaded yet). `render-question.mjs`
additionally needs Pillow (`pip install pillow`) for its supersample-then-
downsample step, same as the banner and billboard renderers in `../banner`
and `../billboard`; `render-coffee.mjs` shoots straight at 1x and has no
Python dependency.

## Sizing

1080 × 1080 suits a square feed post (what `/questions` gets shared as).
1200 × 630 is the standard `og:image` / Twitter `summary_large_image` size —
use that for any page that carries those meta tags, which is what
`render-coffee.mjs` points `/orewa-best-coffee`'s tags at in
[`../../src/pages/orewa-best-coffee.astro`](../../src/pages/orewa-best-coffee.astro).

## Adding another page's og:image

1. Copy `render-coffee.mjs`, change `OUT` and the `page.goto` path.
2. Pick which elements to hide/enlarge in the injected `<style>` block — the
   goal is the page's identity (logo, headline, one line of context), not a
   miniature of the whole page; most content won't survive a 630px-tall crop
   anyway.
3. Point that page's `og:image` / `twitter:image` meta tags at the output
   filename in `public/social/`.

`render-submit.mjs` does two pages from one `CARDS` array instead of being
copied twice — they're built to the same skeleton, so only the path and the
output name differ.

`render-home.mjs` is the one card that keeps the waves: the home card has to
read as The Tide at a glance and the wave motif is half of that. It reserves
more bottom padding than the page does so no copy lands on them — the §2 rule
in [`BRANDING.md`](../../../bizdata/docs/BRANDING.md) applies to a share card
the same as to a page. It shows the coverage line rather than the tagline,
because a card has to say where we are for somebody who has never heard of
us, and it hides that section's `<h2>` — "What lands in your inbox" reads as a
dangling label with no form under it. Both the logo size and the coverage
copy's length are load-bearing on it fitting: the layout centres inside the
clear zone, so anything taller pushes the eyebrow off the top edge rather than
overflowing visibly. Look at the PNG after changing either.

## Cards that get posted, not just shared

`/questions` and the submit cards are posted to a feed on their own, rather
than riding along with a link preview, so they carry the address in words —
an image isn't clickable in every place it gets posted. `render-submit.mjs`
appends that line itself and styles it as the home page's button; it names
the page being shot, so it can't point somewhere the card isn't about.

Those two also trim the page's lede (`CARDS[].lede`) rather than shoot it
whole. Keep a trim a **trim**: it may drop a sentence that only makes sense
in front of the form ("Send yours below"), it may not add an offer or a
claim the page doesn't make. The point of shooting the built page is that a
card can't promise something the form doesn't — an override that adds copy
throws that away.
