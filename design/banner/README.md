# Banner artwork

Newsletter/web banners in the home page's branding: same palette, wave motif,
logo and type as `src/pages/index.astro`, laid out for a wide, short slot.

| File | Size | Source |
| --- | --- | --- |
| `thetide-coffee-catchup-1080x150.png` | 1080 × 150 | `coffee-catchup.html` |
| `thetide-facebook-1080x400.png` | 1080 × 400 | `facebook.html` |
| `thetide-gardening-guide-750x300.png` | 750 × 300 | `gardening-guide.html` |
| `thetide-gardening-club-1080x400.png` | 1080 × 400 | `gardening-club.html` |
| `thetide-group-inbox-1640x856.png` | 1640 × 856 | `group-inbox.html` |
| `thetide-group-follow-1640x856.png` | 1640 × 856 | `group-follow.html` |
| `thetide-group-proof-1640x856.png` | 1640 × 856 | `group-proof.html` |

`thetide-gardening-club-1080x400.png` is also copied to
`public/social/` so it can be served from the site (embedded on a page, or
reused as an `og:image` source) without anything reaching into `design/`.
Re-copy it after re-rendering — `render.sh` only writes into this folder.

Rebuild after editing a page:

```sh
sh render.sh
```

The script drives headless Chromium at 2x and downsamples to the exact pixel
size. Override the browser with `CHROME=/path/to/chrome`. It needs Pillow
(`pip install pillow`) for the downsample, same as the billboard script.

## Editing the copy

### `coffee-catchup.html`, the event strip

The three lines marked `EDIT ME` in `coffee-catchup.html` are the whole ad:
eyebrow, headline and details. The details line reads "Dates to be confirmed";
swap in the real date, time and place once they're set.

The headline and details line are set at a fixed size with `white-space:
nowrap`, so longer copy runs into the CTA rather than wrapping or shrinking.
The copy takes the width the cup, CTA and logo leave it, about 415px, which
at the details line's 17px is roughly 48 characters. A full date-time-place
line fits comfortably. Re-render and look at the PNG after any copy change.

At 7:1 the layout is a single row (cup, copy, CTA, logo) rather than the stack
the taller billboards use: the copy grows to fill, which pushes the CTA across
to the logo instead of leaving the right half of the strip empty.

The banner is 150px tall and the logo is portrait, so the logo's width isn't a
free choice. Much above 88px and it stops fitting between the paddings.

### `facebook.html`, the Facebook page prompt

The block marked `EDIT ME` is the whole ad: eyebrow, headline, the line under
it, and the dark button. The button reads "Click here to follow us" rather than
naming an address, so **the image has to be hyperlinked to the Facebook page
wherever it's placed**. On its own it gives a reader nowhere to go.

Same nowrap rule as the strip: the headline breaks where the `<br>` is and
nothing wraps on its own, so keep each line about its current width or it runs
into the right-hand column. Two headline lines is the limit; a third doesn't
fit under the 400px height.

The "f" tile is the one thing on the banner not in the site palette. It's
Facebook's blue (`#1877f2`) with the standard glyph, which is what makes the
banner readable as "Facebook" from a scroll. The rest (sand, sea, waves, the
logo) is the home page's branding unchanged.

At 400px there's room to stack the tile and the logo in a right-hand column,
which the 150px strip doesn't have. The logo is portrait, so that stack is
sized off its rendered height: tile plus gap plus logo has to stay inside the
304px of content box, or the logo's bottom is cropped by the banner edge.

### `gardening-guide.html`, the gardening guide promo

Promotes `design/gardening-guide/`'s monthly PDF inside the newsletter itself.
The eyebrow, the headline (deliberately the same text and `em` treatment as
the PDF cover's own `<h1>`, so the two read as one product) and the CTA pill
are the whole ad — same "these lines are it" rule as the other two pages.

**This banner has nowhere to link to.** The gardening guide is a Beehiiv
email attachment only, by design — there's no landing page or URL for it.
Unlike `facebook.html`, where the button's wording *requires* a hyperlink,
this CTA ("Grab our gardening guide here") is written to work unlinked: place
it next to the actual PDF attachment in the email rather than wiring it to a
URL. If a future use needs it clickable (e.g. linking out to an archive page
that doesn't exist yet), that's a decision for whoever places it, not
something to invent here.

Same nowrap rule as the other two: the headline and the CTA pill are sized
for their current copy and don't wrap. The copy column is about 560px at its
750px width (750 minus padding, the gap and the 100px flank column), which
comfortably fits the current headline and CTA at their set sizes — recheck by
re-rendering if either line gets much longer.

The right-hand tile is a small sprout icon in Steel Blue and Sand Light/Sea
Glass — no off-palette colour needed here, unlike Facebook's blue, since Sea
Glass and Steel Blue are both already brand fills. It stacks above the logo
the same way the Facebook tile does, sized off the logo's rendered height so
neither is cropped by the banner edge.

### `gardening-club.html`, The Tide Gardening Club

The club's own banner, at 1080 × 400 — the same size as `facebook.html`, since
a title plus three featured items needs the height the 150px strip and the
750 × 300 promo don't have.

Deliberately built as a set with `design/gardening-guide/`: the Foam-to-Sand
cover wash, the Baloo 2 headline with its last word in Steel Blue as an `<em>`,
the sprout tile from `gardening-guide.html` unchanged, and — the main tie — the
three featured items use the guide's own "what's inside" device, a Steel Blue
rounded-square tile with a Foam line-icon and an uppercase Steel Blue label. The
three icons (swap arrows, calendar, map pin) are lifted verbatim from
`gardening-guide/template.html`'s symbol library, so a reader who has the PDF
recognises them.

Palette tokens here are named after `bizdata/docs/BRANDING.md` §1 (`--foam`,
`--sand`, `--harbor`, `--slate`, `--steel`, `--seaglass`) rather than the
`--sand`/`--sea`/`--ink` shorthand the three older pages use, matching the guide
template. No off-palette exception is needed and no hex appears outside `:root`
— the wave and tile fills are set from CSS classes rather than `fill="..."`
attributes.

Copy: the eyebrow, the title, the line under it and the three feature labels are
the whole banner, same "these lines are it" rule as the other pages. The title
and sub are `white-space: nowrap` at a fixed size; the copy column is about
828px (1080 minus padding, the gap and the 100px flank), and the title currently
runs to roughly 490px of it, so there is room but not unlimited room. The three
feature labels break only where their `<br>` is and their columns are sized to
their own content (`repeat(3, auto)`), which lands the band at about the
headline's width — a much longer label pushes that band out to the right and
eventually into the flank's clear space. Re-render and look at the PNG after any
copy change.

**This banner has no CTA and nowhere to link to**, on purpose. It announces the
club and names what it is; it does not add a second call to action to whatever
it is placed beside (BRANDING §7, "one clear action"). If a use needs a button,
that's a decision for whoever places it, along with a destination that exists.

Vertical budget: `main`'s `padding-bottom` reserves the full 104px wave height
plus clearance, so nothing lands on the waves (BRANDING §2). That leaves 240px
of content box, which is also what sizes the flank stack — tile (92) + gap (16)
+ the logo's rendered height has to stay inside it or the logo is cropped by the
banner edge. The logo's 92px width also keeps it above BRANDING §4's 4rem
minimum.

### `group-inbox.html`, `group-follow.html`, `group-proof.html` — Facebook group covers

Three variants of the same ad, sized 1640 × 856 (Facebook's group cover size),
for pinning to a Facebook **group** to push members to the newsletter signup
page. They're the mirror image of `facebook.html`: that one sends readers *to*
the Facebook page, these send group members *to* `thetide.co.nz`.

A group cover image **can't be hyperlinked**, so unlike `facebook.html`'s "click
here to follow us" each of these names the address in the pill (`thetide.co.nz`).
The signup page is the site home page — there's no separate `/signup` route.

| File | Angle |
| --- | --- |
| `group-inbox.html` | Plain and direct — "Get The Tide in your inbox", the reasons in the sub |
| `group-follow.html` | Voice-led — "You follow the group. Now get the newsletter.", the editor's "assume the shared experience" opener |
| `group-proof.html` | Social proof — "Worth waiting for" (the home page's own title line) over three stat chips: how many readers, when it lands, what it costs |

These are the **dark** treatment, and the one set on the site that is: a
full-bleed Harbor field, Foam type, a single Sea Glass accent word in the
headline, so they read as their own thing next to the light `facebook.html` and
stand out in a feed of white cards. The logo art is Sea Glass on transparent, so
it sits straight on Harbor with no reversed asset.

No framed border and no Foam-to-Sand wash — the depth is two low-contrast Sea
Glass blooms (one top-right, a fainter one behind the logo) over a single tonal
`tideline` curve, a step up in the Harbor with a thin Sea Glass crest, in place
of the two-path shoreline the other banners use. The eyebrow is a hairline pill,
the CTA a flat Foam button with a trailing arrow. Palette is BRANDING §1 tokens
only; the rgba tints are all Sea Glass or Foam at reduced alpha, no new hex.

Same nowrap rule as the other pages: the headline is fixed-size and breaks only
at its `<br>`, so keep each line about its current width or it runs into the
flank column. `group-inbox` runs the biggest headline (108px, two short lines),
`group-follow` the smallest (80px, two long lines). Copy sits well inside the
paddings on purpose — Facebook crops the sides and bottom of a group cover on
mobile, so the headline, sub and button stay within the centre; the logo is
decorative and can take the crop.

To serve one from the site (embed, or an `og:image` source) copy it into
`public/social/` after rendering, the same as `thetide-gardening-club`.

### Fonts

Fonts come from `../billboard/` so there's one checked-in copy of each: Baloo 2
(headline), Archivo Black (URL tag) and Inter (everything else), all SIL Open
Font License. The render script passes `--allow-file-access-from-files` so
Chromium will load them across that directory boundary.
