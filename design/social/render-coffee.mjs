// Render the /orewa-best-coffee page as its own og:image / Twitter card.
//
// Same idea as render-question.mjs: shoot the built page rather than keep a
// separate copy of the headline, so the social card can't drift from what the
// page actually says. Edit the copy in src/pages/orewa-best-coffee.astro or
// the list in src/data/coffee.js, then re-run this.
//
// Usage: npm run build && node design/social/render-coffee.mjs
import { createServer } from 'node:http';
import { existsSync, readdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
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
const OUT = join(ROOT, 'public/social/orewa-best-coffee-social.png');
const RAW = join(ROOT, 'dist/coffee-social-raw.png');
// 1200x630 is the standard og:image / Twitter summary_large_image size — see
// the meta tags in src/pages/orewa-best-coffee.astro.
const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2; // supersample, then downsample for clean type and edges

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
  deviceScaleFactor: SCALE,
});
await page.goto(`http://127.0.0.1:${port}/orewa-best-coffee/`, { waitUntil: 'networkidle' });

// Strip everything but the page's identity — logo, eyebrow, headline, lede —
// so the card reads at thumbnail size in a feed. The list itself, the
// subscribe form and the footer links don't fit a 630px-tall crop anyway.
await page.addStyleTag({
  content: `
    /* Astro scopes the page's own rules with a data attribute, which outranks
       anything injected here — so every override has to be !important. */
    .breadcrumb, .updated, .spots, .feedback-note, #subscribe, .privacy-link, .waves {
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
    .home img { width: 14rem !important; }
    .eyebrow {
      margin-top: 2rem !important;
      font-size: 1.3rem !important;
      letter-spacing: 0.22em !important;
    }
    h1 {
      margin-top: 1.5rem !important;
      font-size: 4rem !important;
      line-height: 1.1 !important;
    }
    .lede {
      margin-top: 1.5rem !important;
      font-size: 1.5rem !important;
      max-width: 40rem !important;
    }
  `,
});
await page.screenshot({ path: RAW });
await browser.close();
server.close();

execFileSync('python3', ['-c', `
from PIL import Image
raw = Image.open("${RAW}").convert('RGB')
assert raw.size == (${WIDTH * SCALE}, ${HEIGHT * SCALE}), raw.size
raw.resize((${WIDTH}, ${HEIGHT}), Image.LANCZOS).save("${OUT}", optimize=True)
`]);
await unlink(RAW);
console.log('wrote', OUT, `${WIDTH}x${HEIGHT}`);
