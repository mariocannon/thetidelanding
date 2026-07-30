#!/bin/sh
# Render billboard.html to a 1480×640 PNG.
#
# Shoots at 2× device scale into an oversized window (headless reserves some
# viewport height, which would otherwise clip the board), then crops the
# board's 1480×640 box and downsamples for clean edges.
set -e

DIR=$(cd "$(dirname "$0")" && pwd)
CHROME=${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}
RAW=$(mktemp -d)/raw.png

"$CHROME" \
  --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --allow-file-access-from-files \
  --force-device-scale-factor=2 \
  --window-size=1520,820 \
  --screenshot="$RAW" \
  "file://$DIR/billboard.html" 2>/dev/null

RAW="$RAW" OUT="$DIR/thetide-billboard-1480x640.png" python3 - <<'PY'
import os
from PIL import Image

raw = Image.open(os.environ['RAW']).convert('RGB')
assert raw.size[0] >= 2960 and raw.size[1] >= 1280, f'render too small: {raw.size}'
board = raw.crop((0, 0, 2960, 1280)).resize((1480, 640), Image.LANCZOS)
board.save(os.environ['OUT'], optimize=True)
print('wrote', os.environ['OUT'], board.size)
PY
