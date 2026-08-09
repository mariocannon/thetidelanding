// Render design/social/posts.html to ten 1080×1080 social PNGs.
//
// Each post is a `.board` element in that page, so this shoots them
// element-by-element rather than page-by-page: edit or reorder the boards
// there and re-run this to get a matching set.
//
// Usage: node design/social/render-posts.mjs
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
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
const PAGE = join(ROOT, 'design/social/posts.html');
const OUT_DIR = join(ROOT, 'public/social/posts');
const SIZE = 1080;
const SCALE = 2; // supersample, then downsample for clean type and edges

// Slug per board, in page order — the file names readers of the folder see.
const NAMES = [
  'your-week-on-the-coast',
  'hundreds-of-coasties',
  'whats-in-it',
  'from-waiwera-to-gulf-harbour',
  'list-your-event',
  'place-a-classified',
  'coastie-decal-giveaway',
  'what-would-you-like-to-see',
  'one-email-a-week',
  'dont-miss-the-tide',
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: sandboxChromium() });
const page = await browser.newPage({
  viewport: { width: SIZE + 80, height: SIZE + 80 },
  deviceScaleFactor: SCALE,
});
await page.goto(`file://${PAGE}`);
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);

const boards = await page.locator('.board').all();
if (boards.length !== NAMES.length) {
  throw new Error(`posts.html has ${boards.length} boards, expected ${NAMES.length}`);
}

for (const [index, board] of boards.entries()) {
  const name = `${String(index + 1).padStart(2, '0')}-${NAMES[index]}`;
  const raw = join(OUT_DIR, `${name}-raw.png`);
  const out = join(OUT_DIR, `${name}.png`);

  await board.screenshot({ path: raw });
  execFileSync('python3', ['-c', `
from PIL import Image
raw = Image.open(${JSON.stringify(raw)}).convert('RGB')
assert raw.size == (${SIZE * SCALE}, ${SIZE * SCALE}), raw.size
raw.resize((${SIZE}, ${SIZE}), Image.LANCZOS).save(${JSON.stringify(out)}, optimize=True)
`]);
  await unlink(raw);
  console.log('wrote', out, `${SIZE}x${SIZE}`);
}

await browser.close();
