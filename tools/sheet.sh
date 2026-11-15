#!/bin/sh
# A contact sheet of film frames with no window at all (headless Chrome), for review when no browser pane can be used.
#
#   tools/sheet.sh NAME "t0,t1,t2,..." [cols=4] [cell=960] [extra query, e.g. "cam=3,1,4,0,1,0,30"]
#
# Writes _shots/NAME.jpg (open it and look at it) and _shots/NAME.txt (size, load timings, draw calls; or the error).
# Builds first. Environment: CHROME, PORT (default 4478), W/H of the browser window (default 1920x1080).
set -eu
cd "$(dirname "$0")/.."
NAME=${1:?name}; TIMES=${2:?times}; COLS=${3:-4}; CELL=${4:-960}; EXTRA=${5:-}
PORT=${PORT:-4478}; W=${W:-1920}; H=${H:-1080}
if [ -z "${CHROME:-}" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome 2>/dev/null || true)" "$(command -v chromium 2>/dev/null || true)" "$(command -v chromium-browser 2>/dev/null || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then CHROME=$c; break; fi
  done
fi
[ -n "${CHROME:-}" ] || { echo "no Chrome found: set CHROME=/path/to/chrome"; exit 1; }
python3 tools/build.py
mkdir -p _shots; rm -f "_shots/$NAME.jpg" "_shots/$NAME.txt"
PROF=$(mktemp -d)
PORT=$PORT node tools/serve.js >/dev/null & SRV=$!
cleanup() { kill "$SRV" 2>/dev/null || true; if [ -n "${CHR:-}" ]; then kill "$CHR" 2>/dev/null || true; wait "$CHR" 2>/dev/null || true; fi; rm -rf "$PROF" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
sleep 1
ANGLE=""; [ "$(uname)" = "Darwin" ] && ANGLE="--use-angle=metal"
"$CHROME" --headless=new $ANGLE --enable-gpu --ignore-gpu-blocklist --window-size="$W,$H" --hide-scrollbars --mute-audio \
  --no-first-run --no-default-browser-check --disable-background-timer-throttling --disable-renderer-backgrounding \
  --user-data-dir="$PROF" "http://127.0.0.1:$PORT/index.html?noraf=1&pause=1&sheet=$NAME&times=$TIMES&cols=$COLS&cell=$CELL${EXTRA:+&$EXTRA}" >/dev/null 2>&1 & CHR=$!
i=0
while [ ! -f "_shots/$NAME.txt" ]; do
  kill -0 "$CHR" 2>/dev/null || { echo "the browser exited early"; exit 1; }
  i=$((i + 1)); [ "$i" -gt 240 ] && { echo "timed out after 120 s (does the page boot? open it and read window.__ERR)"; exit 1; }
  sleep 0.5
done
cat "_shots/$NAME.txt"; echo
