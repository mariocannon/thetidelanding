// Render the monthly Local Gardening Guide PDF.
//
// Reads content.json (the per-issue data — swap in a new file for a future
// month and re-run, template.html doesn't change), fills the tokens and
// block markers in template.html via merge.mjs, writes the merged HTML to a
// temporary file next to the template (so its relative font/logo paths
// still resolve), then prints it to a multi-page PDF with Playwright's
// page.pdf() — the file readers download and print from the site's
// /gardening-guide page. `publish.mjs` turns the same merged HTML into the
// inline page images and copies this PDF into thetidelanding/public/.
//
// Usage: node design/gardening-guide/render.mjs [path/to/content.json]
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import { mergeHtml, sandboxChromium } from './merge.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const contentPath = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(DIR, 'content.json');

const content = JSON.parse(await readFile(contentPath, 'utf8'));
const template = await readFile(join(DIR, 'template.html'), 'utf8');

const OUT = join(DIR, `${content.issue.slug}-gardening-guide.pdf`);
const BUILD_HTML = join(DIR, '_build.html');

const html = mergeHtml(content, template);
await writeFile(BUILD_HTML, html, 'utf8');

const browser = await chromium.launch({ executablePath: sandboxChromium() });
const page = await browser.newPage();
await page.goto(`file://${BUILD_HTML.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  margin: { top: '22mm', bottom: '26mm', left: '20mm', right: '20mm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="width:100%; margin:0 20mm; font-family:Arial,sans-serif; font-size:8px; color:#8a8272; display:flex; justify-content:space-between;">
      <span>The Tide — Local Gardening Guide · ${content.issue.label}</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `,
});

await browser.close();
await unlink(BUILD_HTML);

console.log('wrote', OUT);
