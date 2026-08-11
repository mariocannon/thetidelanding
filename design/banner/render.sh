#!/bin/sh
# Render the banner pages to PNGs at their exact pixel sizes.
#
# Same approach as design/billboard/render.sh: each banner is shot at 2x device
# scale into an oversized window (headless reserves some viewport height, which
# would otherwise clip the banner), then cropped to the banner's box and
# downsampled for clean type and edges.
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

  RAW="$raw" OUT="$DIR/thetide-${page}-${w}x${h}.png" W=$w H=$h python3 - <<'PY'
import os
from PIL import Image

w, h = int(os.environ['W']), int(os.environ['H'])
raw = Image.open(os.environ['RAW']).convert('RGB')
assert raw.size >= (w * 2, h * 2), f'render too small: {raw.size}'
banner = raw.crop((0, 0, w * 2, h * 2)).resize((w, h), Image.LANCZOS)
banner.save(os.environ['OUT'], optimize=True)
print('wrote', os.environ['OUT'], banner.size)
PY
}

render coffee-catchup 600 300
