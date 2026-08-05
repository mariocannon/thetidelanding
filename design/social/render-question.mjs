// Render the current /questions page as a square social image.
//
// The question text lives in src/pages/questions.astro, so the shot is taken
// against the built page rather than a copy: edit the question there and
// re-run this to get a matching image. The answer form, comment box and note
// are hidden — the post is the question, people answer on the site.
//
// Usage: npm run build && node design/social/render-question.mjs
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
const OUT = join(ROOT, 'public/social/northern-expressway-toll-question.png');
const RAW = join(ROOT, 'dist/question-social-raw.png');
const SIZE = 1080;
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
  viewport: { width: SIZE, height: SIZE },
  deviceScaleFactor: SCALE,
});
await page.goto(`http://127.0.0.1:${port}/questions/`, { waitUntil: 'networkidle' });

// Strip the interactive parts and let the question fill the space it frees up.
await page.addStyleTag({
  content: `
    /* Astro scopes the page's own rules with a data attribute, which outranks
       anything injected here — so every override has to be !important. */
    #answer-form, #form-note, #subscribe { display: none !important; }
    main {
      width: min(54rem, 100% - 6rem) !important;
      padding-block: 0 8rem !important;
    }
    .home img { width: 14rem !important; }
    .eyebrow {
      margin-top: 3rem !important;
      font-size: 1.4rem !important;
      letter-spacing: 0.22em !important;
    }
    h1 {
      margin-top: 2rem !important;
      font-size: 4.4rem !important;
      line-height: 1.15 !important;
      min-height: 0 !important;
    }
  `,
});
await page.screenshot({ path: RAW });
await browser.close();
server.close();

execFileSync('python3', ['-c', `
from PIL import Image
raw = Image.open("${RAW}").convert('RGB')
assert raw.size == (${SIZE * SCALE}, ${SIZE * SCALE}), raw.size
raw.resize((${SIZE}, ${SIZE}), Image.LANCZOS).save("${OUT}", optimize=True)
`]);
await unlink(RAW);
console.log('wrote', OUT, `${SIZE}x${SIZE}`);
