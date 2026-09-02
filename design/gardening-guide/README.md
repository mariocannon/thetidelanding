# Local Gardening Guide

The monthly Local Gardening Guide: an A4 layout that ships **as a page on
the site** — `/gardening-guide` shows the newest month inline (one image a
section, so it reads on a phone), `/gardening-guide/<slug>` is each month's
permanent URL, and the A4 PDF is the download. The newsletter links the
`<slug>` page rather than attaching the file.

> Was "a Beehiiv attachment, never linked from the site" until 2026-09-02 —
> the operator reversed that. The layout, palette and fonts are unchanged;
> what's new is `publish.mjs` and the `thetidelanding` pages that read what
> it writes.

| File | What it is |
| --- | --- |
| `template.html` | The layout. Doesn't change month to month. |
| `content.json` | This issue's copy. Swap in a new file each month and re-render — the template stays fixed. |
| `merge.mjs` | Fills the tokens/markers in `template.html` from `content.json`. Shared by `render.mjs` and `publish.mjs` so the two can't drift. Pure string work — no I/O. |
| `render.mjs` | Playwright: merged HTML → A4 PDF via `page.pdf()`. |
| `publish.mjs` | Playwright: merged HTML → one PNG per section into `../../public/gardening-guide/<slug>/`, copies the PDF alongside, and updates `../../src/data/gardening-guides.generated.js` (the image manifest the pages read). |
| `2026-09-gardening-guide.pdf` | This issue's PDF, `<issue.slug>-gardening-guide.pdf`. |

## Rebuild

From `thetidelanding/`:

```sh
node design/gardening-guide/render.mjs     # → <issue.slug>-gardening-guide.pdf
node design/gardening-guide/publish.mjs    # → public/gardening-guide/<slug>/*.png + <slug>.pdf + manifest
```

Both need Playwright's Chromium (already a dev dependency of `thetidelanding`
— `npx playwright install chromium` if it isn't downloaded). No Python/Pillow
step: `page.pdf()` and `locator.screenshot()` write the files directly.

`publish.mjs` refuses to run if the PDF for that slug isn't there yet — run
`render.mjs` first. It does **not** touch `src/data/gardening-guides.js`
(the hand-kept slug/date/label/intro list) — add the new month's entry there
yourself, then `npm run build` and `npx playwright test gardening-guide`.

To build from a different data file (e.g. drafting next month without
overwriting this one):

```sh
node design/gardening-guide/render.mjs  path/to/2026-10-content.json
node design/gardening-guide/publish.mjs path/to/2026-10-content.json
```

Every path — the PDF name, the `public/gardening-guide/<slug>/` folder, the
manifest key — comes from `issue.slug` inside whichever `content.json` you
point them at, so there's no separate "output name" flag to keep in sync.

## The site images

`publish.mjs` screenshots `.cover` and the three `.section` blocks (`#tips`
/ `#calendar` / `#swaps`) at 760px CSS width, ×2 device scale, print media —
so each image is that whole section however long it runs, never a fixed crop
that could lose a card off the bottom. It injects a `.section { padding: …
}` gutter for the web images only (the cover keeps its full-bleed wash,
plants and waves). Output is `cover.png` / `tips.png` / `calendar.png` /
`swaps.png` in `public/gardening-guide/<slug>/`, plus `<slug>.pdf` one level
up, plus an entry in `gardening-guides.generated.js` holding each image's
pixel size (so the pages can reserve space and not shift on load) and alt
text. That generated file is machine-owned — regenerate it, don't hand-edit.

## Editing a month's content

Everything a month needs to change lives in `content.json`:

- `issue.month`, `issue.label`, `issue.slug`, `issue.intro`, `issue.kicker`
  — the cover. `slug` drives the output filename, keep it `YYYY-MM`. The
  cover badge shows `issue.label` alone ("September 2026") — there is no
  issue number (dropped in the 2026-09 polish; the operator's call was
  month/year only).
- `tipsIntro` — one optional sentence rendered under the Gardening Tips
  wave-rule, before the first card (added 2026-09). Omit it and the section
  just starts at the first card.
- `tips[]` — each `{ lead, body, icon }` becomes one tip card in Gardening
  Tips. Add or remove entries freely; cards use `break-inside: avoid` so one
  never splits across a page boundary, and the section just flows onto a
  second page if there are enough of them. `icon` is optional — see "Icons
  (2026-08 redesign)" below.
- `plantingCalendar.groups[]` — each `{ tag, body, icon }` becomes one
  tagged block (the checked-in example uses "Under cover" / "Direct sow" /
  "Flowers & colour"; the tag is free text, not a fixed enum). Keep a tag to
  roughly two words — it's set in Archivo Black, a single heavy weight, so
  it's sized for a short label, not a phrase. `icon` is optional — see
  "Icons (2026-08 redesign)" below.
- `plantingCalendar.frostNote` — one paragraph, rendered in the tinted
  callout under the calendar.
- `produceSwaps.intro` — one paragraph above the "how it works" strip.
- `produceSwaps.how[]` — optional array of `{ icon, lead, body }` (added
  2026-09), rendered as a three-item strip explaining a swap in the
  abstract (bring / take / meet). Evergreen boilerplate about the idea, safe
  on a placeholder issue. Omit the field and the strip doesn't render.
- `produceSwaps.listing` — see below, the one field group with a real
  content rule attached.

### The produce-swap listing: coming-soon vs. real

`produceSwaps.listing.placeholder` is a boolean switch, not just a label:

- `true` (this issue's state) — renders a reader-facing **"Coming soon"**
  card from `listing.comingSoon.{heading, body}`: a Baloo 2 heading and one
  paragraph telling readers the swap is being set up, inside a dashed-border
  box headed "Coming soon" in Steel Blue. It reads as a promise, not as a
  broken page. The five detail fields (`location`/`date`/`time`/`bring`/
  `organiser`) are ignored in this state — leave them blank. **Never turn
  this to `false` by filling in a guess** — if a real swap isn't confirmed,
  the coming-soon card is what ships.
  (Before the 2026-09 polish this state instead showed the five fields with
  `[confirm venue]`-style bracket tokens — an editor-facing "not filled in"
  cue. That was replaced with the reader-facing card on the operator's
  instruction: ship something that tells readers "we're working on it".)
- `false` — renders the `location` / `date` / `time` / `bring` /
  `organiser` table in a plain solid-border box, no tag. This is the state
  for a month with a real, confirmed swap: fill the five fields and flip the
  flag. `bring` is boilerplate ("any home-grown produce…") and carries over
  either way.

## Print layout and budgets

A4, `@page { margin: 22mm 20mm 26mm }` in `template.html`, and
`render.mjs` passes the same numbers to `page.pdf()`'s `margin` option (the
explicit option is what actually governs the render; the `@page` rule is
kept in sync so the template still looks right if anyone opens
`template.html` directly and prints it from a browser).

Unlike the banner/billboard PNGs, this isn't a fixed pixel box — the guide
is built to **flow**: the cover is always its own page
(`break-after: page`), and each of the three sections starts on a fresh
page (`break-before: page`) but is otherwise free to run onto a second page
if a month's copy runs long. `tip-card`, `calendar-group`, `frost-note` and
`swap-listing` all carry `break-inside: avoid`, so a card only ever moves
to the next page whole — it doesn't split mid-paragraph. There's no hard
character budget to count against the way the nowrap banners have one;
look at the rendered PDF after a content change instead, the way the
workflow below describes.

Body copy is capped conversationally, not by a fixed line-length rule —
`template.html`'s content column is the full A4 text measure (about 17cm
after margins), which comfortably holds Inter body text at 12.5pt without
needing an inner max-width. Tip and calendar bodies in this issue run
2–4 sentences; much longer than that and a card starts to dominate its
page — trim rather than let one entry crowd the others.

**Card/heading spacing is tuned tight on purpose, not arbitrarily small.**
The 2026-08 redesign (icons, the wave-rule divider, larger radii/shadows —
see "Icons" below) added real height to every card and section header. The
first pass of that redesign pushed the September 2026 issue's Planting
Calendar page over a page boundary — three calendar groups plus the frost
callout no longer fit together, so the callout alone spilled onto a mostly
empty fourth page. Rather than re-splitting it across pages, the fix was
tightening `.tip-card`/`.calendar-group`/`.frost-note`/`.swap-listing`
padding and margins, `.wave-rule`'s margins, and — the actual biggest single
win — giving `h1, h2, h3` and `.eyebrow` their own `line-height` instead of
inheriting the body's `1.6` (sized for paragraphs, not a one-line heading;
that alone was worth ~15px per heading). Checked against a real measurement,
not eyeballing: with this issue's copy, Section 02 (header + 3 calendar
groups + frost note) needs ~903px against a 941px content box at print
scale — about a 4% margin, intentionally not razor-thin. If a future
month's calendar copy runs longer than this issue's, re-run the same
check before assuming it'll fit:

```sh
# from design/gardening-guide/, with a build HTML already written
# (temporarily skip the `unlink(BUILD_HTML)` line in render.mjs, or copy
# its merge logic into a scratch script) — then measure against the print
# content box (249mm tall at 96dpi ≈ 941px) with Playwright:
#   const r = document.getElementById('calendar').getBoundingClientRect()
```

If a month doesn't fit, letting the frost note (or an overflowing tip/swap
card) fall to its own next page is correct behaviour, not a bug — just
confirm with a raster (see "Verifying a render" below) whether that reads
as an acceptably short trailing page or as awkwardly sparse, and trim copy
rather than CSS if it's the latter.

## Cover layout (2026-09 polish)

Operator feedback: the cover (and the Tips / Swaps pages) "looked too plain
and sparse — fuller and more designed." The structure and palette didn't
change; three devices were added, all §1 tokens only, no new fonts:

- **`.cover-inner` keyline.** The masthead (logo → kicker → H1 → sprig
  divider → intro → badge → "what's inside" row → colophon) now sits inside
  a rounded Steel-Blue keyline (`2px` / `rgba(69,117,140,0.28)` / `20px`
  radius) — the same containing shape as `design/banner/gardening-club.html`,
  so the club banner and the guide cover read as a set. It's a **real
  container**, not an absolutely-positioned overlay: it always hugs the
  content, so changing the intro length or the copy never leaves the
  keyline cutting through something. The `.wash`, `.garden-band` and
  `.waves` stay as their own absolute layers behind and below it. Every
  internal margin in `.cover-inner` and its children is deliberately tight
  so the box clears the shoreline planting on an A4 page — check that gap
  first if you touch cover spacing (see "Verifying a render").
- **`.garden-band` shoreline planting.** A two-layer row of Sea Glass
  seedlings, leafy sprigs and grass tufts rising from behind the front
  wave, filling what was a dead strip of flat wash between the masthead and
  the shoreline. Back layer = many small evenly-spaced sprouts at `0.45`
  opacity; front layer = taller, spaced, varied — the same "one shape
  twice" depth trick as the two waves. **The paths are generated, not
  hand-placed** — the generator (a short deterministic script; a copy lived
  in the scratchpad for the 2026-09 work) emits the `<g>` pair; regenerate
  and re-paste rather than nudging individual nodes. `preserveAspectRatio`
  is left at the default so the strokes never distort; height follows page
  width off the tall viewBox.
- **`.sprig-rule` sprig dividers.** A short leafy vine, centred, closing
  the Tips and Swaps sections (bookending the `.wave-rule` that opens each
  section since 2026-08) and, smaller (`.sm`), once on the cover under the
  H1.

Also in this pass: the cover badge dropped the issue number (now
`issue.label` alone), the cover H1 went 40pt → 34pt so it sits inside the
keyline's padding on one line, `tipsIntro` and `produceSwaps.how[]` were
added as optional content fields, and the swap listing's placeholder state
became the reader-facing "Coming soon" card (see "The produce-swap listing"
above).

## Icons (2026-08 redesign)

Fifteen small line-icon `<symbol>`s (fourteen from this redesign plus
`sprig`, added for the 2026-09 `.sprig-rule` divider), defined once near the
top of `<body>` in `template.html` and reused via `<use href="#icon-*">`
everywhere a page needs an accent — the section-header tiles, tip-card and
calendar-group badges, the frost callout, the swap listing's five fields,
and the cover's "what's inside" row. Every shape resolves its colour from
`currentColor`, so the same markup works on a Steel Blue tile (Foam icon),
a Sea Glass circle (Steel Blue icon), or plain inline (Steel Blue) — see
the `.tile-icon` / `.tip-icon` / `.cal-icon` / `.dl-icon` rules in
`template.html` for which is which. This is the same visual language as
the sprout tile in `design/banner/gardening-guide.html`, so the email
banner and the PDF read as one product.

**Content-driven icons** — `tips[].icon` and `plantingCalendar.groups[].icon`
are optional per-issue fields (added this redesign; older `content.json`
files without them still render — `render.mjs` falls back to `"leaf"` for
tips and `"seed"` for calendar groups, and `console.warn`s if a value is
supplied but not recognised, so a typo doesn't silently render the wrong
icon). Allowed keys:

| Key | Looks like | Typical use |
|---|---|---|
| `leaf` | single outlined leaf | general/soil/feeding tips (default fallback for tips) |
| `droplet` | teardrop | watering, mulch, moisture |
| `bug` | small insect | pests |
| `frost` | 3-line snowflake/asterisk | cold, frost protection |
| `tray` | seed tray with a sprout | "under cover" sowing |
| `seed` | seeds + a dibber stroke | direct sowing (default fallback for calendar groups) |
| `flower` | 5-circle flower | flowers/colour |
| `trowel` | garden trowel | (fixed) Gardening Tips section header + cover feature |
| `calendar` | calendar grid | (fixed) Planting Calendar section header + cover feature + swap listing's Date row |
| `swap` | two opposing arrows | (fixed) Produce Swaps section header + cover feature |
| `pin` | map pin | (fixed) swap listing's Location row |
| `clock` | clock face | (fixed) swap listing's Time row |
| `basket` | basket | (fixed) swap listing's Bring row + "Bring a bag" in `produceSwaps.how` |
| `person` | person silhouette | (fixed) swap listing's Organised-by row |
| `sprig` | stem with three leaves | (fixed) not a content key — reserved for the `.sprig-rule` divider |

The "fixed" ones above aren't content.json fields — the section headers, the
cover's feature row, the swap listing's field icons and the sprig divider
are structural chrome hard-coded in `template.html`/`render.mjs`, the same
way the section order itself is fixed. Only `tips[].icon`,
`plantingCalendar.groups[].icon` and `produceSwaps.how[].icon` are per-issue
choices (the last falls back to `swap`).

**A future month only needs to add `icon` to new tips/calendar groups it
introduces** — copying an existing entry's shape and swapping the key is
enough; nothing else in the schema changed. If a month's tips or calendar
groups don't obviously map onto one of the seven content-driven keys above,
picking the closest one (or leaving `icon` off entirely, which falls back
cleanly) is fine — these are decorative accents, not a taxonomy that needs
to be exhaustive.

## Fonts

Not duplicated — referenced from `../billboard/` by relative path, same
approach `design/banner/facebook.html` already uses, so there's one
checked-in copy of each SIL-OFL file: `baloo2-800.woff2` (headlines —
`h1`/`h2`, display only), `archivoblack.woff2` (the short calendar tags
only), `inter-600.woff2` (everything else, including all body copy).

**Font-weight verification, worth recording because it contradicted the
filename.** `inter-600.woff2` is declared `font-weight: 100 900` in every
`@font-face` block that uses it (here and in `design/billboard/`), which
looks like a claim that any weight in that range is available. The file
isn't a fully-static single cut, but it also isn't a smooth variable font
across the whole declared range — rendering the same paragraph at CSS
weights 300–800 through this exact file produces three visually distinct
buckets (~300–400 render identically as a regular weight, ~500–600 render
identically as a semibold, ~700–800 render identically as a bold), i.e. the
file clamps to the nearest of a handful of real masters rather than
interpolating continuously, and the 100–900 range in the `@font-face` rule
is wider than what it can actually produce. The practical result for this
product: declaring `font-weight: 400` on this file **does** render a
genuinely lighter face than 600 — confirmed by rendering the same sentence
at both weights and reading the PNGs back, using this exact checked-in
file, not a system fallback (a no-`@font-face` control rendered a visibly
different, generic-sans shape, ruling out a system-installed Inter
confusing the test). Body copy in `template.html` is set at `font-weight:
400` on that basis. No new font file was added — the existing
`inter-600.woff2` covers it once you ask it for 400 rather than trust the
name.

## Verifying a render

`page.pdf()` fails silently the same way the nowrap PNG layouts do — an
overflowing card or a missing font falls back quietly rather than erroring.
This machine has no PDF viewer wired up for the `Read` tool, so checking a
render takes one extra step versus the PNG workflow:

1. `node design/gardening-guide/render.mjs` then
   `node design/gardening-guide/publish.mjs`
2. Read the section PNGs `publish.mjs` just wrote to
   `public/gardening-guide/<slug>/` — those are exact element screenshots,
   no PDF renderer in the loop, so they're the fastest honest look at the
   layout (they just don't show the PDF's page breaks or footer). For the
   PDF itself, rasterize each page and read those back: `pdf-to-img` (npm,
   pulls a prebuilt `@napi-rs/canvas`, no build tools) renders every page
   including the Baloo 2 headlines. A raw `pdfjs-dist` + `@napi-rs/canvas`
   script dropped those headlines to empty tofu boxes in testing while
   every other font rendered — a limitation of that renderer, not a defect
   in the PDF; Poppler's `pdftocairo -png` (the `pdf-poppler` npm package on
   Windows) also renders them correctly. If a render looks broken in one
   viewer, cross-check with a second before blaming the template.
3. Look specifically for: text clipped at a page's bottom margin (a card
   that should have moved to the next page but didn't), a section/frost-note
   spilling onto an unexpectedly sparse extra page (see the "Print layout
   and budgets" note on tight card spacing above), the coming-soon swap
   card reading as a live listing rather than a clearly-flagged "Coming
   soon" panel, the cover keyline (`.cover-inner`) sitting clear of the
   shoreline planting rather than cutting a line through it, icons rendering
   as the intended shape rather than a missing/blank box, and the footer
   page count (`X / Y`) matching what `ls` or a PDF-page-count check reports.

## What's fixed vs. per-issue

Fixed in `template.html`, don't change per month: the three section order
(Gardening Tips → Planting Calendar → Community Produce Swaps), the
palette (`bizdata/docs/BRANDING.md` §1 tokens only — Foam/Sand/Paper
grounds, Deep Harbor primary text, Slate for ledes, Steel Blue for
eyebrows/section headers/accents, Sea Glass as a fill only), the logo and
its clear space, the page margins, the cover keyline + shoreline planting
band + sprig dividers (2026-09 polish — see "Cover layout" below), the cover
colophon ("Every month at thetide.co.nz/gardening-guide"), the icon
`<symbol>` library and which icon each section header/swap-listing field/
cover feature uses (see "Icons (2026-08 redesign)" above).

Per-issue in `content.json`: every word of copy, the optional `tipsIntro`
and `produceSwaps.how[]`, the tip count, the calendar group count and their
tags, each tip/calendar group's optional `icon`, and the swap listing's
coming-soon/real state. The cover badge is `issue.label` alone
("September 2026") — the operator settled the numbering question in the
2026-09 polish as month/year only, no issue number.
