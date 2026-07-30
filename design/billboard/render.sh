#!/bin/sh
# Render the billboard pages to PNGs at their exact pixel sizes.
#
# Each board is shot at 2x device scale into an oversized window (headless
# reserves some viewport height, which would otherwise clip the board), then
# cropped to the board's box and downsampled for clean edges.
set -e

DIR=$(cd "$(dirname "$0")" && pwd)
CHROME=${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}
TMP=$(mktemp -d)

render() { # <page> <width> <height>
  page=$1
  w=$2
  h=$3
  raw="$TMP/$page.png"

  "$CHROME" \
    --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --allow-file-access-from-files \
    --force-device-scale-factor=2 \
    --window-size=$((w + 40)),$((h + 180)) \
    --screenshot="$raw" \
    "file://$DIR/$page.html" 2>/dev/null

  RAW="$raw" OUT="$DIR/thetide-billboard-${w}x${h}.png" W=$w H=$h python3 - <<'PY'
import os
from PIL import Image

w, h = int(os.environ['W']), int(os.environ['H'])
raw = Image.open(os.environ['RAW']).convert('RGB')
assert raw.size >= (w * 2, h * 2), f'render too small: {raw.size}'
board = raw.crop((0, 0, w * 2, h * 2)).resize((w, h), Image.LANCZOS)
board.save(os.environ['OUT'], optimize=True)
print('wrote', os.environ['OUT'], board.size)
PY
}

render billboard 1480 640
render billboard-portrait 1080 1920
