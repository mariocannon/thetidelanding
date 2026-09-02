// Publish the monthly Local Gardening Guide to the site.
//
// The guide reads inline on thetide.co.nz/gardening-guide as one image per
// section, with the A4 PDF as a download. This script produces both from the
// same merged HTML render.mjs prints the PDF from:
//
//   thetidelanding/public/gardening-guide/<slug>/cover.png   (+ tips / calendar / swaps)
//   thetidelanding/public/gardening-guide/<slug>.pdf         (copied from this folder)
//   thetidelanding/src/data/gardening-guides.generated.js     (image manifest — sizes + alt)
//
// Run render.mjs first so the PDF is current, then this. The hand-kept list
// in src/data/gardening-guides.js (slug / label / date / intro) is the one
// thing this doesn't touch — add the new month's entry there yourself.
//
// Usage: node design/gardening-guide/publish.mjs [path/to/content.json]

import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, copyFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import { mergeHtml, sandboxChromium } from './merge.mjs';

// PNG width/height live in the IHDR chunk: 8-byte signature, 4-byte length,
// 4-byte "IHDR", then width and height as big-endian uint32. Cheaper than
// pulling in an image library just to read two numbers.
function pngSize(buffer) {
  return { w: buffer.readUInt32BE(16), h: buffer.readUInt32BE(20) };
}

const DIR = dirname(fileURLToPath(import.meta.url));
const contentPath = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(DIR, 'content.json');

const content = JSON.parse(await readFile(contentPath, 'utf8'));
const template = await readFile(join(DIR, 'template.html'), 'utf8');
const { slug, label } = content.issue;

const PDF_SRC = join(DIR, `${slug}-gardening-guide.pdf`);
if (!existsSync(PDF_SRC)) {
  console.error(`No ${slug}-gardening-guide.pdf — run "node design/gardening-guide/render.mjs" first.`);
  process.exit(1);
}

const PUBLIC_DIR = join(DIR, '..', '..', 'public', 'gardening-guide');
const OUT_DIR = join(PUBLIC_DIR, slug);
const GENERATED = join(DIR, '..', '..', 'src', 'data', 'gardening-guides.generated.js');

// One screenshot per section, in reading order. The selectors are the
// section wrappers in template.html; each captures that whole section
// (all of its cards), page breaks or not — so a longer month just makes a
// taller image, it never loses content off the bottom the way a fixed
// crop would.
const SECTIONS = [
  { name: 'cover', selector: '.cover', alt: `${label} — Local Gardening Guide cover` },
  { name: 'tips', selector: '#tips', alt: `${label} — gardening tips for the month` },
  { name: 'calendar', selector: '#calendar', alt: `${label} — what to plant this month` },
  { name: 'swaps', selector: '#swaps', alt: `${label} — community produce swaps` },
];

// 760px reads like a document rather than stretching the tip/calendar copy
// to banner line-lengths; ×2 for a crisp image that also downsamples well.
const WIDTH = 760;
const SCALE = 2;

const BUILD_HTML = join(DIR, '_publish_build.html');
await writeFile(BUILD_HTML, mergeHtml(content, template), 'utf8');

const browser = await chromium.launch({ executablePath: sandboxChromium() });
const page = await browser.newPage({
  viewport: { width: WIDTH, height: 1200 },
  deviceScaleFactor: SCALE,
});
await page.emulateMedia({ media: 'print' });
await page.goto(`file://${BUILD_HTML.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// The PDF gets its side margins from @page; a bare element screenshot
// doesn't, so the tip/calendar/swap sections would sit flush to the image
// edge. Give the three `.section` blocks a gutter for the web images only
// (the cover keeps its full-bleed wash, plants and waves — different
// selector, untouched).
await page.addStyleTag({ content: '.section { padding: 10px 40px 18px; }' });

await mkdir(OUT_DIR, { recursive: true });

const pages = [];
for (const section of SECTIONS) {
  const file = `${section.name}.png`;
  const buffer = await page.locator(section.selector).screenshot();
  await writeFile(join(OUT_DIR, file), buffer);
  const { w, h } = pngSize(buffer);
  pages.push({ src: file, w, h, alt: section.alt });
  console.log(`  ${slug}/${file}  ${w}×${h}`);
}

await browser.close();
await unlink(BUILD_HTML);

// Copy the PDF next to the images so /gardening-guide/<slug>.pdf resolves.
await copyFile(PDF_SRC, join(PUBLIC_DIR, `${slug}.pdf`));
console.log(`  ${slug}.pdf`);

// Merge this month's image manifest into the generated module, leaving
// other months untouched. This file is machine-owned — the .astro pages
// read image sizes from it so they can reserve space and not shift on load.
let manifest = {};
if (existsSync(GENERATED)) {
  try {
    const mod = await import(`${GENERATED.replace(/\\/g, '/')}?t=${Date.now()}`);
    manifest = mod.pages ?? {};
  } catch {
    /* first run, or the file was hand-broken — rebuild it from scratch */
  }
}
manifest[slug] = pages;

const body = Object.keys(manifest)
  .sort()
  .reduce((acc, key) => ({ ...acc, [key]: manifest[key] }), {});

await writeFile(
  GENERATED,
  `// AUTO-GENERATED by design/gardening-guide/publish.mjs — do not edit by hand.\n` +
    `// One entry per guide slug: the section images in reading order, with the\n` +
    `// pixel size each was rendered at and its alt text.\n` +
    `export const pages = ${JSON.stringify(body, null, 2)};\n`,
  'utf8',
);
console.log(`  src/data/gardening-guides.generated.js  (${Object.keys(body).length} guide${Object.keys(body).length === 1 ? '' : 's'})`);

console.log(
  `\nDone. If "${slug}" is new, add it to src/data/gardening-guides.js ` +
    `(slug / label / date / intro), then rebuild the site.`,
);
