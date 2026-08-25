# Local Gardening Guide (PDF)

The monthly Local Gardening Guide: a multi-page PDF sent as a **Beehiiv
attachment**, not a page on the site. Nothing here gets linked from
`thetidelanding/public/` — it never ships anywhere except an email.

| File | What it is |
| --- | --- |
| `template.html` | The layout. Doesn't change month to month. |
| `content.json` | This issue's copy. Swap in a new file each month and re-render — the template stays fixed. |
| `render.mjs` | Playwright script: merges `content.json` into `template.html`, prints to PDF with `page.pdf()`. |
| `2026-09-gardening-guide.pdf` | This issue's output, `<issue.slug>-gardening-guide.pdf`. |

## Rebuild

```sh
node design/gardening-guide/render.mjs
```

Needs Playwright's Chromium (already a dev dependency of `thetidelanding` —
`npx playwright install chromium` if it isn't downloaded). No Python/Pillow
step this time: `page.pdf()` writes the file directly, there's no raster
downsample like the PNG banners need.

To build from a different data file (e.g. drafting next month's issue
without overwriting this one yet):

```sh
node design/gardening-guide/render.mjs path/to/2026-10-content.json
```

The output filename always comes from `issue.slug` inside whichever
`content.json` you point it at, so there's no separate "output name" flag to
keep in sync.

## Editing a month's content

Everything a month needs to change lives in `content.json`:

- `issue.number`, `issue.month`, `issue.label`, `issue.slug`, `issue.intro`
  — the cover. `slug` drives the output filename, keep it `YYYY-MM`.
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
- `produceSwaps.intro` — one paragraph above the listing box.
- `produceSwaps.listing` — see below, this is the one field group with a
  real content rule attached.

### The produce-swap listing: placeholder vs. real

`produceSwaps.listing.placeholder` is a boolean switch, not just a label:

- `true` (this issue's state) — `location`, `date`, `time` and `organiser`
  render wrapped in square brackets inside an italic, dashed-border box
  headed "Placeholder — confirm details" in Steel Blue. It reads as
  unfinished on the page on purpose. **Never turn this to `false` by filling
  in a guess** — if a real swap event isn't confirmed yet, ship the
  placeholder rather than invent a venue, date or organiser.
- `false` — the box goes to a plain solid border, drops the "Placeholder"
  tag, and stops bracketing the field values. This is the state for a month
  with a real, confirmed listing. `bring` never gets bracketed either way —
  it's boilerplate ("any home-grown produce…"), not a fact that needs
  confirming.

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

## Icons (2026-08 redesign)

Fourteen small line-icon `<symbol>`s, defined once near the top of
`<body>` in `template.html` and reused via `<use href="#icon-*">`
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
| `basket` | basket | (fixed) swap listing's Bring row |
| `person` | person silhouette | (fixed) swap listing's Organised-by row |

The last seven ("fixed" ones above) aren't content.json fields at all — the
section headers, the cover's feature row and the swap listing's field icons
are structural chrome hard-coded in `template.html`/`render.mjs`, the same
way the section order itself is fixed. Only `tips[].icon` and
`plantingCalendar.groups[].icon` are per-issue choices.

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

1. `node design/gardening-guide/render.mjs`
2. Rasterize each page to a PNG with a real PDF renderer and read those
   back. A `pdfjs-dist` + `@napi-rs/canvas` script is the quickest path if
   neither is installed yet, but note its canvas backend failed to draw the
   Baloo 2 headline glyphs in testing (rendered as empty tofu boxes) while
   every other font on the same pages was fine — that turned out to be a
   limitation in that specific renderer, not a defect in the PDF. Poppler's
   `pdftocairo -png` (bundled by the `pdf-poppler` npm package on Windows,
   or a system `poppler-utils` install elsewhere) rendered every page,
   including that headline, correctly. If a render looks broken in one
   viewer, cross-check with a second before treating it as a bug in the
   template.
3. Look specifically for: text clipped at a page's bottom margin (a card
   that should have moved to the next page but didn't), a section/frost-note
   spilling onto an unexpectedly sparse extra page (see the "Print layout
   and budgets" note on tight card spacing above), the placeholder swap
   listing reading as an actual listing rather than a visible placeholder,
   icons rendering as the intended shape rather than a missing/blank box,
   and the footer page count (`X / Y`) matching what `ls` or a PDF-page-count
   check reports.

## What's fixed vs. per-issue

Fixed in `template.html`, don't change per month: the three section order
(Gardening Tips → Planting Calendar → Community Produce Swaps), the
palette (`bizdata/docs/BRANDING.md` §1 tokens only — Foam/Sand/Paper
grounds, Deep Harbor primary text, Slate for ledes, Steel Blue for
eyebrows/section headers/accents, Sea Glass as a fill only), the logo and
its clear space, the page margins, the icon `<symbol>` library and which
icon each section header/swap-listing field/cover feature uses (see
"Icons (2026-08 redesign)" above).

Per-issue in `content.json`: every word of copy, the tip count, the
calendar group count and their tags, each tip/calendar group's optional
`icon`, and the swap listing's placeholder/real state. A future month's
numbering (`issue.number`/`issue.label`) is also just a `content.json`
edit — this issue set the convention (`Issue 1 · September 2026` on the
cover badge) but didn't get a sign-off on it from anyone who owns the
newsletter's issue-numbering scheme; flag it if that convention needs to
change before a second issue ships.
