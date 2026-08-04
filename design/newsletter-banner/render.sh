#!/bin/sh
# Render the newsletter banner to PNGs at their exact pixel sizes.
#
# Same approach as design/billboard/render.sh: shoot at 2x device scale into an
# oversized window, crop to the board's box and downsample for clean edges.
# The 7200px board is shot at 1x — 14400px exceeds Chromium's raster limit.
set -e

DIR=$(cd "$(dirname "$0")" && pwd)
CHROME=${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}
TMP=$(mktemp -d)

render() { # <width> <height> <scale>
  w=$1
  h=$2
  s=$3
  raw="$TMP/banner-$w.png"

  "$CHROME" \
    --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --allow-file-access-from-files \
    --force-device-scale-factor=$s \
    --window-size=$((w + 40)),$((h + 180)) \
    --screenshot="$raw" \
    "file://$DIR/banner.html?w=$w" 2>/dev/null

  RAW="$raw" OUT="$DIR/coastie-newsletter-banner-${w}x${h}.png" W=$w H=$h S=$s python3 - <<'PY'
import os
from PIL import Image

w, h, s = int(os.environ['W']), int(os.environ['H']), int(os.environ['S'])
raw = Image.open(os.environ['RAW']).convert('RGB')
assert raw.size >= (w * s, h * s), f'render too small: {raw.size}'
board = raw.crop((0, 0, w * s, h * s))
if s != 1:
    board = board.resize((w, h), Image.LANCZOS)
board.save(os.environ['OUT'], optimize=True)
print('wrote', os.environ['OUT'], board.size)
PY
}

render 7200 200 1
render 1200 200 2
