# Command sheet: capture, record, mux, check

All commands run from the project root. Nothing here needs a visible window. `tools/record.sh` and
`tools/sheet.sh` wrap the common cases; the pieces are listed so they can be run by hand.

## Build and preview

```sh
python3 tools/build.py                 # -> index.html (syntax-checks every module and the joined script)
node tools/serve.js                    # -> http://127.0.0.1:4400  (PORT=5000 node tools/serve.js)
```

Useful URLs: `?t=12&pause=1` hold a frame, `?q=1` full quality, `?cam=ex,ey,ez,tx,ty,tz,fov` free camera,
`?noraf=1` when the page is not visible.

## Contact sheet without a window

```sh
sh tools/sheet.sh walk "10,10.25,10.5,10.75,11,11.25,11.5,11.75" 4 960
#   -> _shots/walk.jpg  (4 columns, 960 px cells)  and  _shots/walk.txt (load timings, draw calls)
sh tools/sheet.sh face "21,23,25,27" 2 1280 "cam=3,1.2,4,0,1,0,20"       # extra query string as the 5th argument
```

## Record the film

```sh
sh tools/record.sh 30 film.mp4                      # picture only
sh tools/record.sh 30 film.mp4 _out/score.wav       # with the offline-rendered score
W=3840 H=2160 CRF=14 sh tools/record.sh 30 film_4k.mp4 _out/score.wav
```

By hand, the same thing:

```sh
PORT=4477 node tools/serve.js &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=metal --enable-gpu \
  --ignore-gpu-blocklist --window-size=1920,1080 --hide-scrollbars --mute-audio --no-first-run \
  --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows \
  --user-data-dir="$(mktemp -d)" "http://127.0.0.1:4477/index.html?record=30&noraf=1" &
# wait until _shots/done.txt exists (or _shots/error.txt: read it), then stop Chrome and the server
```

- `--use-angle=metal` is for macOS; on Linux drop it (or use `--use-angle=vulkan`); on a machine without a GPU,
  `--use-angle=swiftshader` works but is slow.
- `&from=1234` on the URL resumes an interrupted recording at that frame.
- The temporary `--user-data-dir` keeps the run away from the user's own browser profile.

## Join frames (and sound) into an MP4

```sh
VF="scale=in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p"

# with sound
ffmpeg -y -framerate 30 -i _shots/f_%05d.jpg -i _out/score.wav -vf "$VF" \
  -c:v libx264 -preset slow -crf 16 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -shortest -movflags +faststart film.mp4

# picture only
ffmpeg -y -framerate 30 -i _shots/f_%05d.jpg -vf "$VF" \
  -c:v libx264 -preset slow -crf 16 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -movflags +faststart film.mp4
```

Why these flags: JPEG frames are full-range BT.601, players expect limited-range BT.709 (the filter converts, the
tags say so); `yuv420p` plays everywhere; `-crf 16` is visually lossless here (18-20 for smaller files);
`+faststart` lets the file start playing before it has fully downloaded; `-shortest` trims a fraction of a frame of
mismatch (check both durations first: a real mismatch is a bug).

## Check the result

```sh
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of default=nw=1 film.mp4
# expect: duration = film length; nb_frames = length x fps; an aac stream if sound was given

ffmpeg -y -loglevel error -ss 2 -i film.mp4 -frames:v 1 _shots/check_title.jpg        # pull a frame and LOOK at it
ffmpeg -y -loglevel error -i film.mp4 -vf "fps=1/6,scale=480:-1,tile=4x3" -frames:v 1 _shots/storyboard.jpg   # a still every 6 s, tiled

ffmpeg -hide_banner -i film.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12       # loudness: aim near -16..-14 LUFS, true peak under -1 dBTP
ffmpeg -hide_banner -i film.mp4 -vf blackdetect=d=0.2:pix_th=0.02 -an -f null - 2>&1 | grep blackdetect   # unexpected black stretches
ffmpeg -hide_banner -i film.mp4 -vf mpdecimate -loglevel debug -an -f null - 2>&1 | grep -c "drop pts"    # duplicated frames (should be near 0 for a moving film)
```

## Derivatives

```sh
# a short preview for a chat or a pull request (720p, 10 s from 0:20)
ffmpeg -y -ss 20 -t 10 -i film.mp4 -vf scale=1280:-2 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart preview.mp4

# a GIF of 4 seconds (palette for clean colours)
ffmpeg -y -ss 30 -t 4 -i film.mp4 -vf "fps=15,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" clip.gif

# side by side: before and after, or render and reference
ffmpeg -y -i before.jpg -i after.jpg -filter_complex "[0]scale=-1:720[a];[1]scale=-1:720[b];[a][b]hstack" compare.jpg

# normalise the score to a streaming-friendly level, if it was not mastered in code
ffmpeg -y -i score.wav -af loudnorm=I=-15:TP=-1.5:LRA=11 -ar 44100 score_norm.wav
```

## Clean up

```sh
rm -rf _shots      # frames and sheets are scratch; the MP4 and the source are the deliverables
```
