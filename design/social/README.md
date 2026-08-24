# Social images

Social-share images rendered straight from the built site, not drawn
separately — so a card can't say something the live page doesn't. Each script
builds the site, boots a static file server against `dist/`, screenshots one
page in headless Chromium with its interactive parts hidden by injected CSS,
then downsamples with Pillow for clean type and edges.

| File | Size | Renders |
| --- | --- | --- |
| `thetide-northern-expressway-toll-question.png` (`render-question.mjs`) | 1080 × 1080 | `/questions` |
| `orewa-best-coffee-social.png` (`render-coffee.mjs`) | 1200 × 630 | `/orewa-best-coffee` |

Rebuild after the source page's copy changes:

```sh
npm run build
node design/social/render-question.mjs
node design/social/render-coffee.mjs
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
