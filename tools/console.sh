#!/bin/sh
# print the page's console (errors, shader logs) from a headless run:  tools/console.sh [query] [seconds]
cd "$(dirname "$0")/.."; PORT=4479; PROF=$(mktemp -d)
PORT=$PORT node tools/serve.js >/dev/null & SRV=$!
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=metal --enable-gpu --ignore-gpu-blocklist --window-size=1280,720 --mute-audio --no-first-run \
  --enable-logging=stderr --v=0 --user-data-dir="$PROF" "http://127.0.0.1:$PORT/index.html?noraf=1&pause=1&${1:-t=2}" 2>&1 | grep -a -v "useProgram\|CVDisplay" | grep -a -E "CONSOLE|ERROR|WARN|> *[0-9]+:" | cut -c1-600 | head -${3:-40} & 
sleep ${2:-9}; pkill -f "user-data-dir=$PROF" ; kill $SRV 2>/dev/null; rm -rf "$PROF"
