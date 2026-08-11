# Banner artwork

Newsletter/web banners in the home page's branding: same palette, wave motif,
logo and type as `src/pages/index.astro`, laid out for a wide, short slot.

| File | Size | Source |
| --- | --- | --- |
| `thetide-coffee-catchup-600x300.png` | 600 × 300 | `coffee-catchup.html` |

600px is the standard newsletter content width, so the banner drops into a
Beehiiv post at 1:1 without scaling.

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

Keep the headline to two words per line so it stays at 54px: it's set in
Baloo 2 at a fixed size rather than fitted, so a third word will overflow the
copy column rather than shrink.

Fonts come from `../billboard/` so there's one checked-in copy of each — Baloo
2 (headline), Archivo Black (URL tag) and Inter (everything else), all SIL Open
Font License. The render script passes `--allow-file-access-from-files` so
Chromium will load them across that directory boundary.
