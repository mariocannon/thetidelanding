// Render the home page as its own og:image / Twitter card.
//
// Copied from render-coffee.mjs — same reasoning: shoot the built page rather
// than keep a separate copy of the headline, so the card a reader sees in a
// feed can't say something the live page doesn't. Edit the copy in
// src/pages/index.astro, then re-run this.
//
// Unlike the other cards here, this one keeps the waves: the home card is the
// one that has to look like The Tide at a glance, and the wave motif is half
// the brand's identity. Bottom padding is reserved so no copy lands on them —
// see "The tide" in bizdata/docs/BRANDING.md.
//
// Usage: npm run build && node design/social/render-home.mjs
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
const OUT = join(ROOT, 'public/social/home-social.png');
// 1200x630 is the standard og:image / Twitter summary_large_image size — see
// the meta tags in src/pages/index.astro.
const WIDTH = 1200;
const HEIGHT = 630;

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
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });

// Strip the interactive parts — the form, its note and the footer links — and
// keep the page's identity: eyebrow, logo, and one line of context. A signup
// field is not clickable in a feed, so showing one would only promise
// something the card can't deliver.
//
// The coverage line is the context line rather than the tagline: it names the
// patch, which is what a card has to establish for somebody who has never
// heard of us. Showing both overflows 630px and pushes the eyebrow off the
// top — the whole page doesn't fit a card and isn't meant to.
const WAVES = 150;
const CLEARANCE = 190;

await page.addStyleTag({
  content: `
    /* Astro scopes the page's own rules with a data attribute, which outranks
       anything injected here — so every override has to be !important. */
    #signup, #form-note, .cta-buttons, .archive-link, .privacy-link,
    .event-link, .tagline, .coverage h2 {
      display: none !important;
    }
    main {
      width: min(46rem, 100% - 6rem) !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      min-height: ${HEIGHT}px !important;
      /* Copy never sits on the waves — BRANDING.md §2. Clearance exceeds the
         wave height below so the rule holds with room to spare. */
      padding-block: 0 ${CLEARANCE}px !important;
    }
    .eyebrow {
      font-size: 1.25rem !important;
      letter-spacing: 0.22em !important;
    }
    h1 { margin-top: 1.25rem !important; }
    /* The logo and the coverage line together have to fit the clear zone
       above the waves, or flex centring pushes the eyebrow off the top edge.
       These two sizes are what make it fit — check the card after changing
       either, or after the coverage copy grows a line. */
    h1 img { width: 9rem !important; }
    .coverage {
      margin: 1.75rem auto 0 !important;
      max-width: 37rem !important;
    }
    .coverage p {
      font-size: 1.3rem !important;
      line-height: 1.55 !important;
    }
    .waves { height: ${WAVES}px !important; }
  `,
});
await page.screenshot({ path: OUT });
await browser.close();
server.close();

console.log('wrote', OUT, `${WIDTH}x${HEIGHT}`);
