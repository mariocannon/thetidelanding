# Banner artwork

Newsletter/web banners in the home page's branding: same palette, wave motif,
logo and type as `src/pages/index.astro`, laid out for a wide, short slot.

| File | Size | Source |
| --- | --- | --- |
| `thetide-coffee-catchup-1080x150.png` | 1080 × 150 | `coffee-catchup.html` |
| `thetide-facebook-1080x400.png` | 1080 × 400 | `facebook.html` |
| `thetide-gardening-guide-750x300.png` | 750 × 300 | `gardening-guide.html` |

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

Fonts come from `../billboard/` so there's one checked-in copy of each: Baloo 2
(headline), Archivo Black (URL tag) and Inter (everything else), all SIL Open
Font License. The render script passes `--allow-file-access-from-files` so
Chromium will load them across that directory boundary.
