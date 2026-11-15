'use strict';
// ---- boot behind the loader, frame(t), the clock, pacing. Last-but-one module; 95_capture.js builds on window.__dbg. ----
//   URL   ?t=12        start at film time 12          ?pause     hold that frame (also fixes the resolution scale)
//         ?q=0.7       fixed resolution scale         ?cam=...   free camera (88_film.js)
//         ?noraf=1     timer-driven frames, for a hidden pane or headless run (00_util.js)
//         ?record=30   write the film out frame by frame (95_capture.js)
//   Console  __dbg.frame(t) draws any film time;  __dbg.seek(t);  __dbg.info;  window.__ERR holds a boot error
(async () => {
  const $ = id => document.getElementById(id), canvas = $('c'), st = $('st'), ld = $('ld'), ti = $('ti'), vs = $('vs'), bar = $('bar').firstElementChild;
  const cannot = msg => { st.textContent = msg; $('bar').style.visibility = 'hidden'; window.__READY = true; };      // never a blank page
  let R;
  try { R = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: false }); }   // MSAA and depth live in Post's target
  catch (e) { cannot('this film needs WebGL 2'); return; }
  R.outputColorSpace = THREE.LinearSRGBColorSpace; R.toneMapping = THREE.NoToneMapping;      // Post's last pass owns tone map and gamma
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  const gl = R.getContext(); gl.getExtension('EXT_color_buffer_float'); gl.getExtension('EXT_color_buffer_half_float');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.5, 9000);
  G.scene = scene; G.camera = camera; G.R = R; Post.init(R);

  // ---- size: device pixels, capped to a pixel budget, times the shot's resolution scale ----
  const REC = Q.has('record'), FIXED = REC || Q.has('q') || Q.has('pause'), REC_W = +Q.get('w') || 1920, REC_H = +Q.get('h') || 1080, MAX_PIXELS = 2.1e6;
  let quality = REC ? 1 : Q.has('q') ? clamp(+Q.get('q') || 1, 0.3, 1) : Film.scale[0];
  const buf = new THREE.Vector2(); let sizeDirty = false, sizeAt = 0;
  function resize() {
    sizeDirty = false; const w = REC ? REC_W : innerWidth, h = REC ? REC_H : innerHeight; if (w < 2 || h < 2) return;      // a collapsed window keeps the last good size
    const dpr = REC ? 1 : devicePixelRatio || 1, cap = Math.sqrt(MAX_PIXELS / (w * h));
    camera.aspect = w / h; R.setPixelRatio(REC ? 1 : Math.min(dpr, cap) * quality); R.setSize(w, h, false);      // a recording is exactly w x h
    R.getDrawingBufferSize(buf); Post.size(buf.x, buf.y); G.info.w = buf.x; G.info.h = buf.y;
  }
  addEventListener('resize', () => { sizeDirty = true; }); resize();                         // rebuilt at most every 100 ms, in the loop

  // ---- one frame of the film at time t. EVERYTHING on screen is a function of this t. ----
  function frame(t, dt = 1 / 60) {
    G.t = t;
    Film.apply(t, camera); if (camera.aspect < 16 / 9) camera.fov = 2 * Math.atan(Math.tan(camera.fov * DEG / 2) * (16 / 9) / camera.aspect) / DEG; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    for (const f of G.tick) f(t, dt);
    R.info.reset(); Post.render(scene, camera, Film.post, typeof Air !== 'undefined' ? Air.fx : null);
    const k = Film.title(t); if (Math.abs(k - (frame.k || 0)) > 0.003 || k === 0) { frame.k = k; ti.style.opacity = k.toFixed(3); }
    const w = Film.words(t), wa = w ? w.a : 0; if (w && frame.w !== w.sa) { frame.w = w.sa; $('vsa').textContent = w.sa; $('ven').textContent = w.en; }
    if (Math.abs(wa - (frame.wa || 0)) > 0.003 || wa === 0) { frame.wa = wa; vs.style.opacity = wa.toFixed(3); }
  }

  // ---- staged build: weighted steps, each one yields so the bar moves and the tab never looks hung ----
  const tick = () => new Promise(r => requestAnimationFrame(() => r())), steps = [], add = (label, w, fn) => steps.push({ label, w, fn });
  const MODS = [['raising the sky', 4, typeof Sky !== 'undefined' && Sky], ['the plain of Kurukshetra', 3, typeof Land !== 'undefined' && Land], ['mustering the hosts', 10, typeof Army !== 'undefined' && Army],
    ['cutting the puppets', 10, typeof Cast !== 'undefined' && Cast], ['the form', 8, typeof Virat !== 'undefined' && Virat], ['dust and light', 4, typeof Air !== 'undefined' && Air]];
  for (const [label, w, M] of MODS) if (M && !Q.has('no' + label.split(' ').pop())) add(label, w, async p => { await M.build(scene, p, tick); });
  if (typeof Score !== 'undefined') add('tuning', 6, async () => { Score.prepare().catch(e => console.warn('score', e)); });   // kicked off, not awaited: sound must never hold the picture
  add('first light', 4, async () => { for (const t of [0, ...Object.values(Film.CUT)]) { frame(t); await tick(); } });         // draw one frame of every shot now: shaders compile behind the loader, not on a cut
  const tw = steps.reduce((a, s) => a + s.w, 0); let done = 0; const t0 = performance.now();
  for (const s of steps) {
    st.textContent = s.label; await tick(); const ts = performance.now();
    await s.fn(p => { bar.style.width = ((done + s.w * p) / tw * 100).toFixed(1) + '%'; });
    done += s.w; bar.style.width = (done / tw * 100).toFixed(1) + '%'; G.info[s.label] = Math.round(performance.now() - ts);
  }
  G.info.loadMs = Math.round(performance.now() - t0);
  window.__dbg = { G, scene, camera, R, Post, frame, get info() { return Object.assign({}, G.info, { calls: R.info.render.calls, tris: R.info.render.triangles }); } };

  // ---- the clock ----
  const DUR = Film.DUR, mod = t => ((t % DUR) + DUR) % DUR, secs = () => performance.now() / 1000, HAS = typeof Score !== 'undefined';
  let tBase = secs() - (+(Q.get('t') || 0)), paused = Q.has('pause') || REC, tHold = mod(+(Q.get('t') || 0)), last = 0;
  function clock(p) {
    let t = mod(p - tBase);
    // The picture keeps its OWN even clock and is only steered toward the sound's. An audio clock advances in small uneven
    // jumps; following it frame by frame puts that unevenness into every camera move. Snap only when far out.
    if (HAS && Score.playing) { let e = Score.time() - t; if (e > DUR / 2) e -= DUR; else if (e < -DUR / 2) e += DUR; tBase -= Math.abs(e) > 0.25 ? e : e * 0.02; t = mod(p - tBase); }
    return t;
  }
  function setPaused(on) {
    if (on === paused) return; paused = on;
    if (on) { tHold = G.t; if (HAS && Score.playing) Score.pause(); } else { tBase = secs() - tHold; last = 0; if (HAS && Score.ready && wantSound) Score.resume(tHold); }
  }
  let wantSound = false, starting = false;
  async function sound() {                                               // browsers only start audio inside a user gesture
    if (!HAS || starting || paused) return;
    if (!Score.playing) { starting = true; wantSound = true; try { await Score.play(() => mod(secs() - tBase)); } catch (e) { console.warn('sound did not start', e); } starting = false; return; }
    Score.toggle();
  }

  // ---- pacing: an even beat matters more than sharpness ----
  // (1) On a display faster than 60 Hz draw every 2nd or 3rd refresh: an even 60 beats an uneven 80.
  // (2) Each shot has its own resolution scale. It is changed ONLY ON A CUT, where no eye can see it: a governor that resizes
  //     in the middle of a shot shows as a jolt. A shot that missed its beat too often starts lower the next time round.
  const qS = Film.scale.slice(), stat = { n: 0, slow: 0, skip: 0 };
  let lastRaf = 0, per = 16.7, perMin = 1e9, perN = 0, rafN = 0, curShot = -1;
  function endShot() { if (curShot < 0 || stat.n < 90 || FIXED) return; if (stat.slow / stat.n > 0.04) qS[curShot] = Math.max(0.45, qS[curShot] * 0.9); }
  function loop(ts) {
    requestAnimationFrame(loop);
    if (sizeDirty && ts - sizeAt > 100) { sizeAt = ts; resize(); loop.drawn = -1; }
    if (paused) { if (loop.drawn !== tHold) { loop.drawn = tHold; frame(tHold); } last = 0; lastRaf = 0; return; }
    loop.drawn = -1;
    if (lastRaf) { const g = ts - lastRaf; if (g > 3 && g < perMin) perMin = g; if (++perN >= 90) { per = clamp(perMin, 4, 34); perMin = 1e9; perN = 0; } }   // the display's own period: the shortest gap seen lately
    lastRaf = ts;
    const stride = Math.max(1, Math.round(16.2 / per)); if (stride > 1 && (rafN++ % stride)) return;
    const t = clock(ts / 1000), shot = Film.shotOf(t);
    if (shot !== curShot) { endShot(); curShot = shot; stat.n = stat.slow = 0; stat.skip = 24; if (!FIXED && Math.abs(qS[shot] - quality) > 0.004) { quality = qS[shot]; resize(); } }
    frame(t, last ? Math.min(0.1, (ts - last) / 1000) : 1 / 60);
    // measured from real frame intervals: gl.finish() does not wait for the GPU in Chrome, so timing a draw call measures nothing
    if (last) { const g = ts - last; if (g < 250) { if (stat.skip > 0) stat.skip--; else { stat.n++; if (g > per * stride * 1.45) stat.slow++; G.info.ms = +g.toFixed(1); G.info.quality = +quality.toFixed(2); } } }
    last = ts;
  }
  ld.style.opacity = 0; setTimeout(() => ld.remove(), 1300);
  addEventListener('click', () => { if (paused) setPaused(false); else sound(); });
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;          // the browser's and the system's shortcuts are not ours
    if (e.code === 'Space') { e.preventDefault(); setPaused(!paused); } else if (e.key === 'm' || e.key === 'M') sound();
  });
  window.__dbg.setPaused = setPaused; window.__dbg.seek = t => { tHold = mod(t); tBase = secs() - tHold; loop.drawn = -1; };
  window.__dbg.pace = { qS, stat };
  requestAnimationFrame(loop); window.__READY = true;
})().catch(e => { console.error('BOOT', e && e.stack || e); const s = document.getElementById('st'); if (s) s.textContent = 'error: ' + (e && e.message || e); window.__ERR = String(e && e.stack || e); });
