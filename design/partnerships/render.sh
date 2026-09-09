#!/bin/sh
# Render the partnership invite cards to PNGs at their exact pixel sizes.
#
# Unlike design/banner/render.sh and design/billboard/render.sh, this one shoots
# straight at 1x rather than 2x-then-downsample: it has no Pillow dependency.
# The cards are flat colour, big type and an inline-SVG wave — they hold up at
# 1x, the same call render-coffee.mjs makes in design/social/. If these ever
# need to match the banners' supersampled crispness, copy that script's
# 2x + Pillow crop instead.
set -e

DIR=$(cd "$(dirname "$0")" && pwd)
CHROME=${CHROME:-/usr/bin/chromium}

render() { # <page> <width> <height>
  page=$1
  w=$2
  h=$3

  "$CHROME" \
    --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --allow-file-access-from-files \
    --force-device-scale-factor=1 \
    --window-size="$w","$h" \
    --screenshot="$DIR/thetide-${page}-${w}x${h}.png" \
    "file://$DIR/$page.html" 2>/dev/null

  echo "wrote $DIR/thetide-${page}-${w}x${h}.png ${w}x${h}"
}

# 1080x1080 — square feed posts (Facebook / Instagram), posted on their own.
render partner-invite 1080 1080
render partners-wanted 1080 1080
render partners-wanted-modern 1080 1080

# 1200x630 — link-preview card, email header, LinkedIn link image.
render partner-invite-wide 1200 630
