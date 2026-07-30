# Billboard artwork

Two billboard/digital-panel adaptations of the home page: same brand marks,
palette and copy as `src/pages/index.astro`, re-laid out for reading at a
distance (short headline, one call to action).

| File | Size | Source | Layout |
| --- | --- | --- | --- |
| `thetide-billboard-1480x640.png` | 1480 × 640 | `billboard.html` | landscape, logo beside the copy |
| `thetide-billboard-1080x1920.png` | 1080 × 1920 | `billboard-portrait.html` | portrait, centred stack like the site |

Rebuild both after editing either page:

```sh
sh render.sh
```

The script drives headless Chromium at 2x and downsamples to the exact pixel
size. Override the browser with `CHROME=/path/to/chrome`.

Fonts are checked in alongside the pages so the render is reproducible
offline: Baloo 2 (headline), Archivo Black (URL and FREE tags) and Inter
(everything else), all SIL Open Font License.
