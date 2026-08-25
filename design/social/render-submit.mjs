// Render /submit-event and /submit-classified as share cards for the two
// calls-to-action that are buttons on the home page ("List your event",
// "Place a classified").
//
// Same idea as render-coffee.mjs, and the same 1200x630 og:image size: shoot
// the built page rather than keep a second copy of the pitch, so a card can't
// promise something the form doesn't. The headline, eyebrow and lede are the
// pages' own words — edit them in src/pages/submit-event.astro and
// src/pages/submit-classified.astro, then re-run this.
//
// Two cards from one script rather than two near-identical copies of
// render-coffee.mjs: the pages are built to the same skeleton (logo, eyebrow,
// h1, lede, form), so they crop the same way and only CARDS below differs.
//
// The one thing injected rather than screenshotted is the address line. A
// social image isn't clickable everywhere it gets posted, so the card has to
// say where to go in words; it names the page being shot and nothing else.
//
// Shoots straight at 1x like render-coffee.mjs — no Python/Pillow step.
//
// Usage: npm run build && node design/social/render-submit.mjs
import { createServer } from 'node:http';
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Same sandbox-Chromium fallback as playwright.config.mjs: the pre-installed
// browser's revision won't match the one this Playwright version wants.
function sandboxChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  return readdirSync(root)
    .filter((entry) => entry.startsWith('chromium-'))
    .map((entry) => `${root}/${entry}/chrome-linux/chrome`)
    .find(existsSync);
}

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist');
// 1200x630 is the standard og:image / Twitter summary_large_image size, and
// what render-coffee.mjs uses.
const WIDTH = 1200;
const HEIGHT = 630;

// The production host these pages live on — the same one orewa-best-coffee's
// canonical and og:url are built from.
const SITE = 'thetide.co.nz';

// `lede` is the one piece of copy overridden rather than screenshotted, and it
// is a trim of the page's own sentence, not a new claim — nothing is said here
// that /submit-event and /submit-classified don't say at greater length.
// Two reasons to trim:
//   - The classified lede says "Send yours below", which is true on the page
//     and false on a card, where there is no form below anything.
//   - Both pages spend their third sentence on process ("We'll confirm which
//     issue it appears in"), which is reassurance for someone mid-form and
//     just small grey text at thumbnail size.
// If the ledes change on the pages, change these with them.
const CARDS = [
  {
    path: '/submit-event/',
    out: 'submit-event-social.png',
    lede:
      "What's on runs in our weekly email to the Hibiscus Coast. " +
      'Tell us when and where it is, and how people can reach you.',
  },
  {
    path: '/submit-classified/',
    out: 'submit-classified-social.png',
    lede:
      'Classifieds run in our weekly email to the Hibiscus Coast. ' +
      'A headline, up to 70 words, and a phone number or email so readers can reach you.',
  },
];

const TYPES = {
  '.html': 'text/html',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const file = join(DIST, path.endsWith('/') ? `${path}index.html` : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch({ executablePath: sandboxChromium() });

for (const card of CARDS) {
  const out = join(ROOT, 'public/social', card.out);
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:${port}${card.path}`, { waitUntil: 'networkidle' });

  // The address line, in the page's own markup so it inherits the page's type
  // and sits in the flow the CSS below centres. `trailingSlash: 'never'`, so
  // the path is written the way the site serves it.
  await page.evaluate(
    ([site, path, lede]) => {
      document.querySelector('.lede').textContent = lede;
      const line = document.createElement('p');
      line.className = 'social-url';
      line.textContent = `${site}${path.replace(/\/$/, '')}`;
      document.querySelector('main').append(line);
    },
    [SITE, card.path, card.lede],
  );

  // Strip the form and the page furniture and let the pitch fill the space it
  // frees up — logo, eyebrow, headline, lede, address. The form itself is 20
  // fields long and never had a hope of surviving a 630px-tall crop.
  await page.addStyleTag({
    content: `
      /* Astro scopes the page's own rules with a data attribute, which outranks
         anything injected here — so every override has to be !important. */
      form, .sent, .footnote, .cross-link, .privacy-link, .waves {
        display: none !important;
      }
      main {
        width: min(52rem, 100% - 6rem) !important;
        padding-block: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        min-height: ${HEIGHT}px !important;
      }
      .home img { width: 9rem !important; }
      .eyebrow {
        margin-top: 1.6rem !important;
        font-size: 1.15rem !important;
        letter-spacing: 0.22em !important;
      }
      h1 {
        margin-top: 1rem !important;
        font-size: 3.5rem !important;
        line-height: 1.12 !important;
      }
      .lede {
        margin-top: 1.25rem !important;
        font-size: 1.35rem !important;
        line-height: 1.5 !important;
        max-width: 38rem !important;
      }
      /* Sea Glass pill, Deep Harbor text — the home page's button, at rest. */
      .social-url {
        align-self: center !important;
        margin-top: 1.75rem !important;
        padding: 0.7rem 1.5rem !important;
        font-size: 1.3rem !important;
        font-weight: 700 !important;
        color: #23313c !important;
        background: #a2c5d3 !important;
        border-radius: 0.65rem !important;
      }
    `,
  });
  await page.screenshot({ path: out });
  await page.close();
  console.log('wrote', out, `${WIDTH}x${HEIGHT}`);
}

await browser.close();
server.close();
