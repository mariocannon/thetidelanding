"""Turn a photo into the round portrait the signature uses.

Reads `portrait-source.jpg` and writes `public/signature/portrait.png`: a square
PNG holding a circular crop of the photo inside a sea-coloured ring, with the
corners transparent.

The circle is baked into the file rather than done with `border-radius` because
Outlook on Windows ignores `border-radius` on an image and would show the photo
as a square with a stray ring around it. A pre-masked PNG looks the same
everywhere.

    python3 portrait.py                 # centre the crop a little above middle
    FOCUS=0.25 python3 portrait.py      # pull the crop up, for a high face
    SOURCE=me.png python3 portrait.py   # a different source file

FOCUS is where in the photo's height the crop is centred: 0 is the very top,
1 the very bottom, 0.5 dead centre. Faces usually sit above centre, so the
default is 0.42. Look at the PNG and nudge it if the crop clips a chin or
leaves too much headroom.
"""

import os
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
SOURCE = HERE / os.environ.get('SOURCE', 'portrait-source.jpg')
OUT = HERE.parent.parent / 'public' / 'signature' / 'portrait.png'

SIZE = 512          # the PNG's edge, in pixels; the signature shows it at 132
RING = 20           # ring thickness at that size
RING_COLOR = (69, 117, 140, 255)      # --sea
INNER_COLOR = (250, 245, 234, 255)    # --sand-light, the hairline inside the ring
INNER = 5
SS = 4              # supersample factor, so the circle's edge isn't stair-stepped

FOCUS = float(os.environ.get('FOCUS', '0.42'))


def square_crop(img: Image.Image, focus: float) -> Image.Image:
    """The largest centred square, slid up or down the photo by `focus`."""
    w, h = img.size
    edge = min(w, h)
    left = round((w - edge) / 2)
    top = round((h - edge) * min(max(focus, 0.0), 1.0))
    return img.crop((left, top, left + edge, top + edge))


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(
            f'no photo at {SOURCE.relative_to(HERE.parent.parent)} — drop yours in '
            'there (or point SOURCE at it) and run this again'
        )

    photo = square_crop(Image.open(SOURCE).convert('RGB'), FOCUS)
    photo = photo.resize((SIZE * SS, SIZE * SS), Image.LANCZOS)

    big = SIZE * SS
    canvas = Image.new('RGBA', (big, big), (0, 0, 0, 0))

    # Ring, then the sand hairline, then the photo, each a circle inside the last.
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((0, 0, big - 1, big - 1), fill=RING_COLOR)
    pad = (RING - INNER) * SS
    draw.ellipse((pad, pad, big - 1 - pad, big - 1 - pad), fill=INNER_COLOR)

    hole = Image.new('L', (big, big), 0)
    pad = RING * SS
    ImageDraw.Draw(hole).ellipse((pad, pad, big - 1 - pad, big - 1 - pad), fill=255)
    canvas.paste(photo, (0, 0), hole)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.resize((SIZE, SIZE), Image.LANCZOS).save(OUT, optimize=True)
    print('wrote', OUT, f'({SIZE}x{SIZE}, focus {FOCUS})')


if __name__ == '__main__':
    main()
