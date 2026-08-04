# Newsletter banner — The Custom Decal Co

Sponsor strip for the newsletter: the white COASTIE wordmark on The Tide's
ink/sky palette, one line of copy and the advertiser's URL.

| File | Size | Notes |
| --- | --- | --- |
| `coastie-newsletter-banner-7200x200.png` | 7200 × 200 | as specified; 36:1, so the lockup sits centred with background either side |
| `coastie-newsletter-banner-1200x200.png` | 1200 × 200 | standard newsletter width — same art in the compact two-line layout |

Both come from `banner.html`; the render script passes the board width as
`?w=<px>` and the page switches to the compact layout at 2000px and under.

Rebuild after editing the page:

```sh
sh render.sh
```

The 1200 board is shot at 2x and downsampled; the 7200 board is shot at 1x
because 14400px exceeds Chromium's raster limit. Override the browser with
`CHROME=/path/to/chrome`.

`coastie-wordmark-white.png` is the supplied decal artwork (white on
transparent). Fonts are checked in alongside the page as in
`../billboard`: Baloo 2 (headline), Archivo Black (URL) and Inter
(eyebrow), all SIL Open Font License.
