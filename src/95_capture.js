'use strict';
// ---- review and delivery, built on window.__dbg.frame(t). Needs tools/serve.js (its POST /__shot endpoint). -----------
//
// CONTACT SHEET (the review tool):  in the page's console, or through any tool that can evaluate JS in the page:
//     await __dbg.shot('walk', [10, 10.25, 10.5, 10.75], null, 4, 960)
//   draws those film times side by side at full resolution and writes _shots/walk.jpg. Then open the JPG and LOOK at it.
//   camFn (optional) (t, i) => [ex, ey, ez, tx, ty, tz, fov] gives each cell its own camera: a turntable, or a camera
//   matched to a reference photograph.     __dbg.sheet(...) / __dbg.unsheet() show the same thing on screen instead.
//
// NUMERIC CHECK:  await __dbg.probe('feet', t => [x, y, z], 10, 20, 60)  samples a pure function of time at 60 steps a
//   second and writes _shots/feet.json with its largest frame-to-frame jump and where it happens. Jitter is a number.
//
// HEADLESS SHEET:  tools/sheet.sh NAME "10,10.25,10.5" [cols] [cell] [extra query]  does the same with no window at all
//   (index.html?noraf=1&sheet=NAME&times=...). Use it when no browser pane is available or the pane is hidden.
//
// RECORD:  open  index.html?record=30&noraf=1  (tools/record.sh does it in headless Chrome). Every frame is drawn at
//   1920x1080 (?w= ?h=), overlays are painted in by Film.overlay, and the JPEGs go to _shots/f_00000.jpg ...
//   When it ends, _shots/done.txt appears; if it fails, _shots/error.txt holds the reason. ?from=N resumes at frame N.
(async () => {
  while (!window.__READY) await new Promise(r => setTimeout(r, 50));
  const D = window.__dbg; if (!D) return;
  const canvas = D.R.domElement, post = async (name, body) => { for (let k = 0; ; k++) { try { const r = await fetch('/__shot?name=' + name, { method: 'POST', body }); if (r.ok || k >= 4) return r; } catch (e) { if (k >= 4) throw e; } await new Promise(r => setTimeout(r, 300 * (k + 1))); } };   // a dropped local request must not cost a whole recording
  const blobOf = (cv, q) => new Promise(r => cv.toBlob(r, 'image/jpeg', q));
  D.shot = async (name, times, camFn, cols = 1, cellW = 1280) => {
    const cellH = Math.round(cellW * canvas.height / canvas.width), rows = Math.ceil(times.length / cols), cv = document.createElement('canvas'), g = cv.getContext('2d');
    cv.width = cellW * cols; cv.height = cellH * rows;
    times.forEach((t, i) => { window.__cam = camFn ? camFn(t, i) : null; D.frame(t);            // drawImage in the same task as the draw: the WebGL buffer is still there
      const x = (i % cols) * cellW, y = Math.floor(i / cols) * cellH; g.drawImage(canvas, x, y, cellW, cellH);
      g.font = '20px sans-serif'; g.fillStyle = '#000'; g.fillText(t.toFixed(2), x + 9, y + 27); g.fillStyle = '#ffd200'; g.fillText(t.toFixed(2), x + 8, y + 26); });
    window.__cam = null; const res = await post(name + '.jpg', await blobOf(cv, 0.92)); return res.ok ? name + ' ' + cv.width + 'x' + cv.height : 'failed ' + res.status;
  };
  D.sheet = (times, camFn, cols = 4) => {
    let cv = document.getElementById('sheet'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'sheet'; cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99;background:#000'; document.body.appendChild(cv); }
    const W = 1920, H = 1080, g = cv.getContext('2d'), rows = Math.ceil(times.length / cols), cw = W / cols, ch = H / rows; cv.width = W; cv.height = H;
    times.forEach((t, i) => { window.__cam = camFn ? camFn(t, i) : null; D.frame(t); g.drawImage(canvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); g.fillStyle = '#ffd200'; g.font = '22px sans-serif'; g.fillText(t.toFixed(2), (i % cols) * cw + 8, Math.floor(i / cols) * ch + 26); });
    window.__cam = null; return times.length;
  };
  D.unsheet = () => { const cv = document.getElementById('sheet'); if (cv) cv.remove(); };
  // fn(t) -> array of numbers (a position, an angle ...). Reports the largest step between consecutive samples per component.
  D.probe = async (name, fn, t0, t1, hz = 60) => {
    const n = Math.round((t1 - t0) * hz), rows = []; let prev = null, worst = null;
    for (let i = 0; i <= n; i++) { const t = t0 + i / hz, v = Array.from(fn(t)); rows.push([+t.toFixed(4), ...v.map(x => +x.toFixed(5))]);
      if (v.some(x => !Number.isFinite(x))) { worst = { t, nan: true }; break; }
      if (prev) v.forEach((x, c) => { const d = Math.abs(x - prev[c]); if (!worst || d > worst.jump) worst = { t: +t.toFixed(4), component: c, jump: +d.toFixed(5), perSecond: +(d * hz).toFixed(3) }; });
      prev = v; }
    await post(name + '.json', JSON.stringify({ name, t0, t1, hz, worst, rows })); return worst;
  };

  // headless contact sheet: index.html?noraf=1&sheet=NAME&times=1,2,3[&cols=4][&cell=960]  ->  _shots/NAME.jpg, then _shots/NAME.txt
  if (Q.has('sheet')) { const name = Q.get('sheet').replace(/[^\w-]/g, '') || 'sheet', times = (Q.get('times') || '0').split(',').map(Number);
    try { const r = await D.shot(name, times, null, +Q.get('cols') || Math.min(4, times.length), +Q.get('cell') || 960); await post(name + '.txt', r + ' ' + JSON.stringify(D.info)); }
    catch (e) { await post(name + '.txt', 'error ' + String(e && e.stack || e)); }
    return; }
  if (!Q.has('record')) return;
  try {
    const FPS = +Q.get('record') || 30, N = Math.round(Film.DUR * FPS), from = +Q.get('from') || 0, W = canvas.width, H = canvas.height;
    const c2 = document.createElement('canvas'), x = c2.getContext('2d'); c2.width = W; c2.height = H;
    if (document.fonts && document.fonts.ready) await document.fonts.ready;            // an embedded title face must be decoded before the first frame is painted
    for (let i = from; i < N; i++) {
      const t = i / FPS; D.frame(t, 1 / FPS); x.drawImage(canvas, 0, 0, W, H);
      if (Film.overlay) Film.overlay(x, t, W, H);
      const rs = await post('f_' + String(i).padStart(5, '0') + '.jpg', await blobOf(c2, 0.95)); if (!rs.ok) throw new Error('frame ' + i + ': ' + rs.status);
    }
    await post('done.txt', 'frames ' + N + ' fps ' + FPS + ' size ' + W + 'x' + H); document.title = 'recorded';
  } catch (e) { post('error.txt', String(e && e.stack || e)); }
})();
