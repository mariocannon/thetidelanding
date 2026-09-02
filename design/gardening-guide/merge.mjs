// Merge content.json into template.html for the monthly Local Gardening
// Guide. Shared by:
//   render.mjs  — prints the merged HTML to the A4 PDF (the file readers
//                 download / print).
//   publish.mjs — screenshots each section of the same HTML to PNGs and
//                 copies the PDF into thetidelanding/public/, so the guide
//                 can be read inline on the site.
//
// Both must fill the tokens identically, so the fill lives here once.

import { existsSync, readdirSync } from 'node:fs';

// Same sandbox-Chromium fallback the other design/ render scripts use: a
// pre-installed browser's revision won't always match the one this
// Playwright version wants.
export function sandboxChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  return readdirSync(root)
    .filter((entry) => entry.startsWith('chromium-'))
    .map((entry) => `${root}/${entry}/chrome-linux/chrome`)
    .find(existsSync);
}

// Minimal escaping — this is our own copy, not third-party input, but it
// keeps a stray `&`/`<` in a future month's draft from breaking the markup
// instead of just looking wrong.
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

// The icon keys defined as <symbol>s in template.html (2026-08 redesign —
// see the README's icon reference table for what each one looks like).
// `tips[].icon`, `plantingCalendar.groups[].icon` and `produceSwaps.how[].icon`
// are optional per-issue fields that pick one of these; anything missing or
// misspelled falls back to a sane default rather than breaking the render,
// and a console.warn flags the typo so it doesn't ship unnoticed. `sprig` is
// defined too but is structural (the .sprig-rule divider), not a content key.
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

// Optional one-sentence standfirst under the Gardening Tips wave-rule
// (content.tipsIntro). Added 2026-09 as part of the "too sparse" fix — a
// month can omit it and the section just starts at the first card, so this
// returns an empty string rather than an empty <p> when there's nothing.
function standfirstHtml(text) {
  if (!text) return '';
  return `<p class="section-standfirst">${esc(text)}</p>`;
}

// Optional three-item "how a swap works" strip on the Produce Swaps page
// (content.produceSwaps.how — an array of { icon, lead, body }). Evergreen
// boilerplate about the idea of a swap, not this month's details, so it's
// safe on a placeholder issue. Omit the field and the strip doesn't render.
function swapHowHtml(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const cells = items
    .map((item) => {
      const icon = resolveIcon(item.icon, 'swap');
      return `
        <div class="how">
          <div class="tile-icon">${iconSvg(icon)}</div>
          <p class="how-lead">${esc(item.lead)}</p>
          <p>${esc(item.body)}</p>
        </div>`;
    })
    .join('');
  return `<div class="swap-how">${cells}</div>`;
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

// Two states, switched by listing.placeholder:
//
//  placeholder: false — a real, confirmed swap. Renders the Location / Date /
//    Time / Bring / Organised-by table plainly. This is the path a month
//    with a confirmed event takes automatically; fill the five fields and
//    flip the flag.
//
//  placeholder: true (the state of this first issue) — no confirmed swap yet.
//    Renders a reader-facing "Coming soon" card from
//    listing.comingSoon.{heading, body}: a short "we're setting this up"
//    message, NOT the internal [confirm venue] bracket form the earlier
//    version showed. It still carries the dashed border + a "Coming soon"
//    tag so it can't be mistaken for a live listing, but it reads as a
//    promise to a Coastie rather than as an unfinished page. Never invent a
//    date, venue or organiser here — if the swap isn't confirmed, this card
//    is what ships.
//
// Fixed per field, not content-driven — the dt labels themselves are fixed
// in this function, so the icon that goes with each one is too.
const dlIcon = (id) => `<svg class="icon dl-icon" viewBox="0 0 24 24"><use href="#icon-${id}"></use></svg>`;

function swapListingHtml(listing) {
  const isPlaceholder = listing.placeholder !== false;

  if (isPlaceholder) {
    const cs = listing.comingSoon || {};
    return `
      <div class="swap-listing is-placeholder">
        <p class="eyebrow placeholder-tag">Coming soon</p>
        <p class="cs-heading">${esc(cs.heading || '')}</p>
        <p class="cs-body">${esc(cs.body || '')}</p>
      </div>`;
  }

  return `
      <div class="swap-listing is-real">
        <dl>
          <dt>${dlIcon('pin')}Location</dt><dd>${esc(listing.location)}</dd>
          <dt>${dlIcon('calendar')}Date</dt><dd>${esc(listing.date)}</dd>
          <dt>${dlIcon('clock')}Time</dt><dd>${esc(listing.time)}</dd>
          <dt>${dlIcon('basket')}Bring</dt><dd>${esc(listing.bring)}</dd>
          <dt>${dlIcon('person')}Organised by</dt><dd>${esc(listing.organiser)}</dd>
        </dl>
      </div>`;
}

// Fill every token and block marker in template.html from a parsed
// content.json object. Pure string work — no file or browser I/O.
export function mergeHtml(content, template) {
  return template
    .replaceAll('{{ISSUE_KICKER}}', esc(content.issue.kicker))
    .replaceAll('{{ISSUE_INTRO}}', esc(content.issue.intro))
    .replaceAll('{{ISSUE_LABEL}}', esc(content.issue.label))
    .replaceAll('{{ISSUE_MONTH}}', esc(content.issue.month))
    .replaceAll('{{FROST_NOTE}}', esc(content.plantingCalendar.frostNote))
    .replaceAll('{{SWAP_INTRO}}', esc(content.produceSwaps.intro))
    .replace('<!--TIPS_INTRO-->', standfirstHtml(content.tipsIntro))
    .replace('<!--TIPS_ITEMS-->', tipsHtml(content.tips))
    .replace('<!--CALENDAR_GROUPS-->', calendarHtml(content.plantingCalendar.groups))
    .replace('<!--SWAP_HOW-->', swapHowHtml(content.produceSwaps.how))
    .replace('<!--SWAP_LISTING-->', swapListingHtml(content.produceSwaps.listing));
}
