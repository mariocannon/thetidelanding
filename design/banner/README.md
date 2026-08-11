# Banner artwork

Newsletter/web banners in the home page's branding: same palette, wave motif,
logo and type as `src/pages/index.astro`, laid out for a wide, short slot.

| File | Size | Source |
| --- | --- | --- |
| `thetide-coffee-catchup-1080x150.png` | 1080 × 150 | `coffee-catchup.html` |

Rebuild after editing a page:

```sh
sh render.sh
```

The script drives headless Chromium at 2x and downsamples to the exact pixel
size. Override the browser with `CHROME=/path/to/chrome`. It needs Pillow
(`pip install pillow`) for the downsample, same as the billboard script.

## Editing the copy

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

Fonts come from `../billboard/` so there's one checked-in copy of each: Baloo 2
(headline), Archivo Black (URL tag) and Inter (everything else), all SIL Open
Font License. The render script passes `--allow-file-access-from-files` so
Chromium will load them across that directory boundary.
