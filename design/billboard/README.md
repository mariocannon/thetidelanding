# Billboard artwork — 1480 × 640

`thetide-billboard-1480x640.png` is a billboard/digital-panel adaptation of the
home page: same brand marks and copy, re-laid out for reading at distance
(short headline, one call to action, high contrast).

Rebuild after editing `billboard.html`:

```sh
sh render.sh
```

The script drives headless Chromium at 2× and downsamples to exactly
1480 × 640. Override the browser with `CHROME=/path/to/chrome`.

Fonts are checked in alongside the page so the render is reproducible offline:
Baloo 2 (headline), Archivo Black (URL and FREE tags) and Inter (everything
else), all SIL Open Font License.
