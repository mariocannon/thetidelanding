#!/bin/sh
# Build the signature: the round photo, the name as artwork, the flat card, and
# the pasteable HTML.
#
#   sh render.sh
#
# Everything it writes lands in public/signature/, so the site deploys it and
# the pasteable signature's images have somewhere to load from:
#
#   portrait.png    the photo, cropped round with its ring baked in
#   name.png        the name set in Baloo 2, trimmed to the ink
#   logo.png        public/logo.webp as a PNG, which Outlook can decode
#   signature.png   the whole card, 1040x400, for anywhere that takes an image
#
# ...plus signature-email.html here, which is the thing you paste into Gmail.
#
# The card is shot the same way as design/banner/render.sh: 2x device scale into
# an oversized window (headless reserves some viewport height, which would
# otherwise clip the card), then cropped to the card's box. It's kept at 2x
# rather than downsampled to 520x200, because it's placed at half its pixel size
# and has to stay sharp on a retina screen.
set -e

DIR=$(cd "$(dirname "$0")" && pwd)
PUBLIC="$DIR/../../public"
CHROME=${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

W=520
H=200

# 1. The photo has to become the round PNG the card loads before the card renders.
python3 "$DIR/portrait.py"

# 2. Outlook on Windows won't decode WebP, so the pasteable signature needs the
#    logo as a PNG. One source of truth: it's converted from public/logo.webp.
PUBLIC="$PUBLIC" python3 - <<'PYLOGO'
import os
from pathlib import Path

from PIL import Image

public = Path(os.environ['PUBLIC'])
out = public / 'signature' / 'logo.png'
logo = Image.open(public / 'logo.webp').convert('RGBA')
logo.thumbnail((240, 240), Image.LANCZOS)
logo.save(out, optimize=True)
print('wrote', out, logo.size)
PYLOGO

# 3. The name on its own, on a transparent ground, for the pasteable signature:
#    Baloo 2 is a web font and no mail client will download one, so the name has
#    to travel as artwork. The text is read out of signature.html so there is
#    still only one place to edit it.
SIG="$DIR/signature.html" OUT="$TMP/name.html" python3 - <<'PYNAMEPAGE'
import os
import re
from pathlib import Path

source = Path(os.environ['SIG'])
found = re.search(r'<p class="name">(.*?)</p>', source.read_text(), re.S)
if not found:
    raise SystemExit('no <p class="name"> in signature.html')
name = re.sub(r'\s+', ' ', found.group(1)).strip()

# The font is loaded by absolute path: this page is written to a temp directory,
# so signature.html's own '../billboard/' would point nowhere.
fonts = source.parent.parent / 'billboard'

page = """<!doctype html>
<html><head><meta charset="UTF-8" /><style>
@font-face {
  font-family: 'Baloo 2';
  font-weight: 800;
  src: url('file://__FONTS__/baloo2-800.woff2') format('woff2');
}
html, body { margin: 0; background: transparent; }
p {
  display: inline-block;
  margin: 0;
  padding: 6px 8px;
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: 31px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: #23313c;
}
</style></head><body><p>__NAME__</p></body></html>
"""
page = page.replace('__FONTS__', str(fonts)).replace('__NAME__', name)
Path(os.environ['OUT']).write_text(page)
PYNAMEPAGE

"$CHROME" \
  --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --allow-file-access-from-files \
  --default-background-color=00000000 \
  --force-device-scale-factor=2 \
  --window-size=1200,300 \
  --screenshot="$TMP/name-raw.png" \
  "file://$TMP/name.html" 2>/dev/null

RAW="$TMP/name-raw.png" OUT="$PUBLIC/signature/name.png" python3 - <<'PYNAMETRIM'
import os

from PIL import Image

# The shot is a transparent 2400x600 sheet with the name in one corner. The
# signature needs it packed to the ink, so trim to the non-transparent box.
raw = Image.open(os.environ['RAW']).convert('RGBA')
box = raw.getchannel('A').getbbox()
if box is None:
    raise SystemExit('the name rendered as nothing — did the font fail to load?')
name = raw.crop(box)
name.save(os.environ['OUT'], optimize=True)
print('wrote', os.environ['OUT'], name.size)
PYNAMETRIM

# 4. The card.
"$CHROME" \
  --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --allow-file-access-from-files \
  --force-device-scale-factor=2 \
  --window-size=$((W + 40)),$((H + 180)) \
  --screenshot="$TMP/card-raw.png" \
  "file://$DIR/signature.html" 2>/dev/null

RAW="$TMP/card-raw.png" OUT="$PUBLIC/signature/signature.png" W=$W H=$H python3 - <<'PYCARD'
import os

from PIL import Image

w, h = int(os.environ['W']), int(os.environ['H'])
raw = Image.open(os.environ['RAW']).convert('RGB')
assert raw.size >= (w * 2, h * 2), f'render too small: {raw.size}'
card = raw.crop((0, 0, w * 2, h * 2))
card.save(os.environ['OUT'], optimize=True)
print('wrote', os.environ['OUT'], card.size)
PYCARD

# 5. The pasteable signature, built from signature.html's copy and the PNGs above.
python3 "$DIR/build-email.py"
