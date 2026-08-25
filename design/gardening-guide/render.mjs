// Render the monthly Local Gardening Guide PDF.
//
// Reads content.json (the per-issue data — swap in a new file for a future
// month and re-run, template.html doesn't change), fills the tokens and
// block markers in template.html, writes the merged HTML to a temporary
// file next to the template (so its relative font/logo paths still
// resolve), then prints it to a multi-page PDF with Playwright's
// page.pdf() — a static file for a Beehiiv attachment, not a page the site
// serves.
//
// Usage: node design/gardening-guide/render.mjs [path/to/content.json]
import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

// Same sandbox-Chromium fallback as the other design/ render scripts: the
// pre-installed browser's revision won't always match the one this
// Playwright version wants.
function sandboxChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  return readdirSync(root)
    .filter((entry) => entry.startsWith('chromium-'))
    .map((entry) => `${root}/${entry}/chrome-linux/chrome`)
    .find(existsSync);
}

const DIR = dirname(fileURLToPath(import.meta.url));
const contentPath = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(DIR, 'content.json');

const content = JSON.parse(await readFile(contentPath, 'utf8'));
const template = await readFile(join(DIR, 'template.html'), 'utf8');

const OUT = join(DIR, `${content.issue.slug}-gardening-guide.pdf`);
const BUILD_HTML = join(DIR, '_build.html');

// Minimal escaping — this is our own copy, not third-party input, but it
// keeps a stray `&`/`<` in a future month's draft from breaking the markup
// instead of just looking wrong.
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

// The 14 icon keys defined once as <symbol>s in template.html (2026-08
// redesign — see the README's icon reference table for what each one looks
// like). `tips[].icon` and `plantingCalendar.groups[].icon` are optional
// per-issue fields that pick one of these; anything missing or misspelled
// falls back to a sane default rather than breaking the render, and a
// console.warn flags the typo so it doesn't ship unnoticed.
const ICON_IDS = new Set([
  'leaf', 'droplet', 'bug', 'frost', 'tray', 'seed', 'flower',
  'trowel', 'calendar', 'swap', 'pin', 'clock', 'basket', 'person',
]);

function resolveIcon(requested, fallback) {
  if (!requested) return fallback;
  if (ICON_IDS.has(requested)) return requested;
  console.warn(`gardening-guide: unknown icon "${requested}", falling back to "${fallback}"`);
  return fallback;
}

function iconSvg(id) {
  return `<svg class="icon" viewBox="0 0 24 24"><use href="#icon-${id}"></use></svg>`;
}

function tipsHtml(tips) {
  return tips
    .map((tip) => {
      const icon = resolveIcon(tip.icon, 'leaf');
      return `
      <div class="tip-card">
        <div class="tip-icon">${iconSvg(icon)}</div>
        <div class="tip-body">
          <p class="lead">${esc(tip.lead)}</p>
          <p>${esc(tip.body)}</p>
        </div>
      </div>`;
    })
    .join('');
}

function calendarHtml(groups) {
  return groups
    .map((group) => {
      const icon = resolveIcon(group.icon, 'seed');
      return `
      <div class="calendar-group">
        <div class="cal-head">
          <div class="cal-icon">${iconSvg(icon)}</div>
          <span class="tag">${esc(group.tag)}</span>
        </div>
        <p>${esc(group.body)}</p>
      </div>`;
    })
    .join('');
}

// A real listing (placeholder: false) renders plainly, no brackets or tag —
// that's the path a future month with a confirmed swap takes automatically.
// A placeholder listing (placeholder: true, the state of this first issue)
// stays visibly a placeholder: dashed border, an explicit "Placeholder" tag,
// and every unconfirmed field wrapped in brackets rather than presented as
// fact. Never invent a value here — an empty/missing field means the
// content.json for that month genuinely doesn't have one yet.
// Fixed per field, not content-driven — the dt labels themselves are fixed
// in this function, so the icon that goes with each one is too.
const dlIcon = (id) => `<svg class="icon dl-icon" viewBox="0 0 24 24"><use href="#icon-${id}"></use></svg>`;

function swapListingHtml(listing) {
  const isPlaceholder = listing.placeholder !== false;
  const wrap = (value) => (isPlaceholder ? `[${esc(value)}]` : esc(value));
  const rowClass = isPlaceholder ? 'is-placeholder' : 'is-real';

  return `
      <div class="swap-listing ${rowClass}">
        ${
          isPlaceholder
            ? '<p class="eyebrow placeholder-tag">Placeholder — confirm details</p>'
            : ''
        }
        <dl>
          <dt>${dlIcon('pin')}Location</dt><dd>${wrap(listing.location)}</dd>
          <dt>${dlIcon('calendar')}Date</dt><dd>${wrap(listing.date)}</dd>
          <dt>${dlIcon('clock')}Time</dt><dd>${wrap(listing.time)}</dd>
          <dt>${dlIcon('basket')}Bring</dt><dd>${esc(listing.bring)}</dd>
          <dt>${dlIcon('person')}Organised by</dt><dd>${wrap(listing.organiser)}</dd>
        </dl>
      </div>`;
}

let html = template
  .replaceAll('{{ISSUE_KICKER}}', esc(content.issue.kicker))
  .replaceAll('{{ISSUE_INTRO}}', esc(content.issue.intro))
  .replaceAll('{{ISSUE_LABEL}}', esc(content.issue.label))
  .replaceAll('{{ISSUE_NUMBER}}', esc(content.issue.number))
  .replaceAll('{{ISSUE_MONTH}}', esc(content.issue.month))
  .replaceAll('{{FROST_NOTE}}', esc(content.plantingCalendar.frostNote))
  .replaceAll('{{SWAP_INTRO}}', esc(content.produceSwaps.intro))
  .replace('<!--TIPS_ITEMS-->', tipsHtml(content.tips))
  .replace('<!--CALENDAR_GROUPS-->', calendarHtml(content.plantingCalendar.groups))
  .replace('<!--SWAP_LISTING-->', swapListingHtml(content.produceSwaps.listing));

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
