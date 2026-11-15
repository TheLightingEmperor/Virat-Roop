#!/bin/sh
# Render the film to an MP4, offline and deterministically.
#
#   tools/record.sh [fps=30] [out=film.mp4] [audio.wav]
#
# 1. builds index.html                      2. starts tools/serve.js on a free-ish port
# 3. opens index.html?record=FPS&noraf=1 in HEADLESS Chrome, which draws every frame and POSTs it to _shots/
# 4. waits for _shots/done.txt (or error.txt)   5. joins the frames (and the WAV, if given) with ffmpeg
#
# Why headless Chrome and not the preview pane: a page in a hidden or background pane is throttled to a crawl
# (about 0.2 frames a second in our measurements); a headless browser with throttling switched off is not.
# Why frame stepping and not screen capture: every frame is a pure function of film time, so each one can take as long
# as it likes and the result is still exactly FPS frames a second, with no dropped or doubled frames.
#
# Environment: CHROME (path to a Chrome/Chromium binary), PORT (default 4477), W/H (default 1920x1080), CRF (default 16)
set -eu
cd "$(dirname "$0")/.."
FPS=${1:-30}; OUT=${2:-film.mp4}; WAV=${3:-}
PORT=${PORT:-4477}; W=${W:-1920}; H=${H:-1080}; CRF=${CRF:-16}

if [ -z "${CHROME:-}" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome 2>/dev/null || true)" "$(command -v chromium 2>/dev/null || true)" "$(command -v chromium-browser 2>/dev/null || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then CHROME=$c; break; fi
  done
fi
[ -n "${CHROME:-}" ] || { echo "no Chrome found: set CHROME=/path/to/chrome"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found"; exit 1; }

python3 tools/build.py
rm -rf _shots; mkdir -p _shots
PROF=$(mktemp -d)
PORT=$PORT node tools/serve.js & SRV=$!
cleanup() { kill "$SRV" 2>/dev/null || true; if [ -n "${CHR:-}" ]; then kill "$CHR" 2>/dev/null || true; wait "$CHR" 2>/dev/null || true; fi; rm -rf "$PROF" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
sleep 1

ANGLE=""; [ "$(uname)" = "Darwin" ] && ANGLE="--use-angle=metal"      # the real GPU; on Linux leave ANGLE to pick (or --use-angle=vulkan)
"$CHROME" --headless=new $ANGLE --enable-gpu --ignore-gpu-blocklist --window-size="$W,$H" --hide-scrollbars --mute-audio \
  --no-first-run --no-default-browser-check --disable-background-timer-throttling --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows --user-data-dir="$PROF" \
  "http://127.0.0.1:$PORT/index.html?record=$FPS&noraf=1&w=$W&h=$H" >/dev/null 2>&1 & CHR=$!

echo "recording at $FPS fps, ${W}x$H ..."
N=0
while [ ! -f _shots/done.txt ] && [ ! -f _shots/error.txt ]; do
  kill -0 "$CHR" 2>/dev/null || { echo "the browser exited before the recording finished"; exit 1; }
  sleep 5; M=$(ls _shots | grep -c '^f_' || true)
  [ "$M" != "$N" ] && { N=$M; printf '\r  %s frames' "$N"; }
done
echo
[ -f _shots/error.txt ] && { echo "the page reported:"; cat _shots/error.txt; exit 1; }
cat _shots/done.txt; echo
kill "$CHR" 2>/dev/null || true

# JPEG frames are full-range BT.601; the film is tagged and converted to limited-range BT.709, which is what players expect.
VF="scale=in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p"
if [ -n "$WAV" ]; then
  ffmpeg -y -loglevel error -framerate "$FPS" -i _shots/f_%05d.jpg -i "$WAV" -vf "$VF" -c:v libx264 -preset slow -crf "$CRF" \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
else
  ffmpeg -y -loglevel error -framerate "$FPS" -i _shots/f_%05d.jpg -vf "$VF" -c:v libx264 -preset slow -crf "$CRF" \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart "$OUT"
fi
echo "wrote $OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of default=nw=1 "$OUT" || true
echo "frames are still in _shots/ (delete them when you have checked the film)"
