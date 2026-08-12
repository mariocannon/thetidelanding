# Banner artwork

Newsletter/web banners in the home page's branding: same palette, wave motif,
logo and type as `src/pages/index.astro`, laid out for a wide, short slot.

| File | Size | Source |
| --- | --- | --- |
| `thetide-coffee-catchup-450x160.png` | 450 × 160 | `coffee-catchup.html` |
| `thetide-facebook-1080x400.png` | 1080 × 400 | `facebook.html` |

Rebuild after editing a page:

```sh
sh render.sh
```

The script drives headless Chromium at 2x and downsamples to the exact pixel
size. Override the browser with `CHROME=/path/to/chrome`. It needs Pillow
(`pip install pillow`) for the downsample, same as the billboard script.

## Editing the copy

### `facebook.html` — "Have you checked out our Facebook page?"

The block marked `EDIT ME` is the whole ad: eyebrow, headline, the line under
it, and the dark button. The button reads "Click here to follow us" rather than
naming an address, so **the image has to be hyperlinked to the Facebook page
wherever it's placed** — on its own it gives a reader nowhere to go.

Same nowrap rule as below: the headline breaks where the `<br>` is and nothing
wraps on its own, so keep each line about its current width or it runs into the
right-hand column. The headline is two lines by design — a third doesn't fit
under the 400px height.

The "f" tile is the one thing on the banner not in the site palette. It's
Facebook's blue (`#1877f2`) with the standard glyph, which is what makes the
banner readable as "Facebook" from a scroll; the rest — sand, sea, waves, the
logo — is the home page's branding unchanged.

### `coffee-catchup.html` — event strip

The three lines marked `EDIT ME` in `coffee-catchup.html` — eyebrow, headline
and details — are the whole ad. **The date, time and place currently in there
are placeholders**; replace them before the banner goes out.

Keep all three about their current length. The strip is only 160px tall, so
the headline and details line are set at a fixed size with `white-space:
nowrap` — longer copy runs into the logo rather than wrapping or shrinking.
Re-render and look at the PNG after any copy change.

The cup and the logo flank the copy instead of stacking beside it, which is
what the taller billboard layouts do — at this height there's no room for a
second element in a column.

Fonts come from `../billboard/` so there's one checked-in copy of each — Baloo
2 (headline), Archivo Black (URL tag) and Inter (everything else), all SIL Open
Font License. The render script passes `--allow-file-access-from-files` so
Chromium will load them across that directory boundary.
