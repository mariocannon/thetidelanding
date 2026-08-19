# Email signature

A personal email signature in the home page's branding: same palette, wave
motif, logo and Baloo 2 headline type as `src/pages/index.astro`, laid out
around a round photo.

Two things come out of it, from one source of copy:

| File | What it's for |
| --- | --- |
| `signature-email.html` | **The signature.** Paste it into Gmail, Outlook or Apple Mail. Real `mailto:` and site links. |
| `public/signature/signature.png` | The same card as one flat 1040×400 image, for anywhere that only takes a picture. |

Plus the pieces the pasteable version loads: `portrait.png`, `name.png` and
`logo.png`, all under `public/signature/`.

Rebuild everything after any edit:

```sh
sh render.sh
```

The script needs Pillow (`pip install pillow`) and drives headless Chromium,
same as the billboard and banner scripts. Override the browser with
`CHROME=/path/to/chrome`.

## Putting your photo in

Save your photo over `portrait-source.jpg` and re-run `render.sh`. Anything
Pillow opens works — JPEG, PNG, HEIC-exported, phone-sized, portrait or
landscape.

`portrait.py` takes the largest square it can and masks it to a circle with the
ring baked in. The square is centred slightly above the middle of the photo,
because that's where faces usually sit. If the crop clips a chin or leaves too
much sky above your head, slide it:

```sh
FOCUS=0.25 sh render.sh   # crop higher up the photo
FOCUS=0.60 sh render.sh   # crop lower down
```

`FOCUS` is a position in the photo's height: `0` the very top, `1` the very
bottom, `0.42` the default. Look at `public/signature/signature.png` after each
try.

The photo checked in now is a placeholder — a blue silhouette on sand — so the
build runs before a real one is dropped in. If the signature still shows that
silhouette, `portrait-source.jpg` hasn't been replaced.

## Editing the copy

The four lines in `signature.html` marked `EDIT ME` are the whole signature:
name, role, publication, email and site. Nothing else needs touching —
`build-email.py` reads them back out of that page and rebuilds
`signature-email.html`, so there's one place to change a job title.

**Don't hand-edit `signature-email.html`.** It's generated, and the next
`render.sh` overwrites it.

Like the banners, the lines are set at a fixed size with `white-space: nowrap`,
so a name much longer than the current one runs into the logo rather than
wrapping or shrinking. The copy takes the width the photo and logo leave it,
about 300px, which at the name's 31px is roughly 15 characters. Re-render and
look at the PNG after any copy change.

## Installing it

The signature loads its images from `https://thetide.co.nz/signature/…`, so
**the site has to be deployed with the new `public/signature/` files before the
signature will look right in anyone's inbox.** Push first, then install.

Then, in any client:

1. Open `signature-email.html` in a browser.
2. Select the whole card — click just above its top-left corner and drag past
   the bottom-right — and copy.
3. Paste into the signature box: Gmail → Settings → General → Signature;
   Outlook → Settings → Mail → Compose and reply; Apple Mail → Settings →
   Signatures.

Paste as rich text. If a client offers "paste and match style" it will strip
the layout — use a plain paste.

### Why the markup looks like that

`signature-email.html` is tables and inline styles, which is not how the rest of
this repo is written. Mail clients are not browsers:

- **Tables, not flexbox or grid.** Outlook on Windows renders through Word,
  which has no flex layout at all.
- **Inline styles only.** Gmail strips `<style>` blocks out of a pasted
  signature.
- **The photo is a round PNG, not a square one with `border-radius`.** Outlook
  ignores `border-radius` on an image and would show the photo square with a
  stray ring around it.
- **The name is an image.** Baloo 2 is a web font and no mail client will
  download one, so the name travels as artwork or it isn't in Baloo 2 at all.
- **The logo is a PNG, not `logo.webp`.** Outlook can't decode WebP.

Images can be blocked by the reader's client. When they are, the signature falls
back to the alt text — the name, then the role and links, which are real text —
so it still reads.
