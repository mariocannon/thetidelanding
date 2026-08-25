// Render the business directory hub as its own og:image / Twitter card.
//
// Copied from render-coffee.mjs and shoots the same way: the built page, not a
// separate copy of the headline, so the card can't say something the page
// doesn't. Edit the copy in src/pages/hibiscus-coast-business-directory/
// index.astro — or add a category in src/data/directory/ — then re-run this.
//
// Every category page points its og:image here too. One card for the whole
// section is the right trade: a per-category card would mean regenerating five
// PNGs every time a listing lands, and a link preview for /…/plumbers reads
// perfectly well off the directory's own identity.
//
// Usage: npm run build && node design/social/render-directory.mjs
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
const OUT = join(ROOT, 'public/social/directory-social.png');
// 1200x630 is the standard og:image / Twitter summary_large_image size — see
// the meta tags in src/layouts/Directory.astro.
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
await page.goto(`http://127.0.0.1:${port}/hibiscus-coast-business-directory/`, {
  waitUntil: 'networkidle',
});

// Keep the coverage line — it names the towns, and a card for a local
// directory has to say *which* locality to somebody who has never heard of us.
// Everything below it is a grid that can't survive a 630px-tall crop.
await page.addStyleTag({
  content: `
    /* Astro scopes the page's own rules with a data attribute, which outranks
       anything injected here — so every override has to be !important. */
    .breadcrumb, .updated, .categories, .planned, .footnote, #subscribe,
    .privacy-link, .waves {
      display: none !important;
    }
    main {
      width: min(54rem, 100% - 6rem) !important;
      padding-block: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      min-height: ${HEIGHT}px !important;
    }
    /* The coverage line wraps to two lines at this width, so the whole stack
       is sized to leave room for both. Grow any of these and it is the towns
       that fall off the bottom edge — look at the PNG after changing them. */
    .home img { width: 8.5rem !important; }
    .eyebrow {
      margin-top: 1.25rem !important;
      font-size: 1.05rem !important;
      letter-spacing: 0.22em !important;
    }
    h1 {
      margin-top: 0.9rem !important;
      font-size: 3.1rem !important;
      line-height: 1.1 !important;
    }
    .lede {
      margin-top: 1rem !important;
      font-size: 1.2rem !important;
      max-width: 38rem !important;
    }
    .coverage {
      margin-top: 1rem !important;
      font-size: 0.95rem !important;
      max-width: 38rem !important;
      color: #8a8272 !important;
    }
  `,
});
await page.screenshot({ path: OUT });
await browser.close();
server.close();

console.log('wrote', OUT, `${WIDTH}x${HEIGHT}`);
