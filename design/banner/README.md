# Banner artwork

Newsletter/web banners in the home page's branding: same palette, wave motif,
logo and type as `src/pages/index.astro`, laid out for a wide, short slot.

| File | Size | Source |
| --- | --- | --- |
| `thetide-coffee-catchup-450x160.png` | 450 × 160 | `coffee-catchup.html` |

Rebuild after editing a page:

```sh
sh render.sh
```

The script drives headless Chromium at 2x and downsamples to the exact pixel
size. Override the browser with `CHROME=/path/to/chrome`. It needs Pillow
(`pip install pillow`) for the downsample, same as the billboard script.

## Editing the copy

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
