'use strict';
// ---- the puppet kit: figures made like jewels -------------------------------------------------------------------------
// Art direction: shadow-theatre figures (profile heads, frontal chests, jointed limbs) made not of flat paint but of
// PLIQUE-A-JOUR: cells of translucent coloured enamel held in raised gold wire, set with cabochon stones and pearls. The
// sun stands behind them and shines THROUGH the enamel; a soft key from the lens side rakes the relief, so gold glints
// and highlights travel as the camera moves. Nothing is flat: every sheet carries a second, hidden drawing of its relief.
//   Pup.part(w, h, px, py, ppm, draw, U, o) -> Mesh    a w x h metre sheet; local origin = the pivot (px, py from its
//                                                      bottom-left). draw(c) paints in METRES, y UP, origin at the pivot.
//   The context `c` given to draw() is a DUAL context: every path goes to the colour canvas and to a data canvas
//   (R = height, G = gold, B = stone). Styles are translated: Pup.INK strokes become raised gold wire, gold fills become
//   gold plate, every other fill is enamel. c.$c / c.$d are the two real contexts for special cases.
//   Pup.sp / fs / line / disc / punch / row / limb / band / lotus   drawing helpers      Pup.gem(c, x, y, r, col)  a stone
//   Pup.jewel(tex, dat, U)  the material.  U: { uLit (light through the enamel), uKG (turned to light), uWave }
//   Pup.light                shared uniforms { uKey (world direction TO the key light), uKeyCol } written by the cast
const Pup = (() => {
  const INK = '#140b07', KOHL = '#1b0f0b', GOLD = '#ffc93a', RED = '#e0182d', GREEN = '#10a860', BLUE = '#1c5fe0', PEARL = '#fff6e6', CREAM = '#f7ecd2';
  const GOLDS = new Set([GOLD, '#ffd75a', '#ffe27a', '#e9b520', '#e2a021', '#ffcf40', '#f5c542']), STONES = new Set([RED, GREEN, BLUE, PEARL, '#1cc6d6', '#d33a3a', '#ff7a1a', '#c2187a']);
  const light = { uKey: { value: new THREE.Vector3(-0.42, 0.5, 0.75).normalize() }, uKeyCol: { value: new THREE.Vector3(1.3, 1.05, 0.8) } };
  // ---- the dual context ----
  const dFill = s => typeof s === 'string' && GOLDS.has(s) ? 'rgb(168,255,0)' : 'rgb(104,0,0)';
  const dStroke = s => s === INK ? 'rgb(255,255,0)' : typeof s === 'string' && GOLDS.has(s) ? 'rgb(205,255,0)' : 'rgb(128,0,0)';
  const SKIP = new Set(['createRadialGradient', 'createLinearGradient', 'createPattern', 'getImageData', 'measureText']);
  function dual(cc, dc) {
    return new Proxy(cc, {
      get(t, k) { if (k === '$c') return cc; if (k === '$d') return dc; const v = t[k]; if (typeof v !== 'function') return v; return (...a) => { if (!SKIP.has(k)) dc[k](...a); return v.apply(t, a); }; },
      set(t, k, v) { t[k] = v; if (k === 'fillStyle') dc.fillStyle = dFill(v); else if (k === 'strokeStyle') dc.strokeStyle = dStroke(v); else if (k !== 'filter' && k !== 'shadowBlur' && k !== 'shadowColor' && k !== 'globalAlpha') dc[k] = v; return true; } });
  }
  // ---- drawing helpers ----
  function sp(c, pts, closed = true) {
    const n = pts.length, P = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)]; c.beginPath(); c.moveTo(P(0)[0], P(0)[1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k1 = p1[2] ? 0 : 1 / 6, k2 = p2[2] ? 0 : 1 / 6;
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1, p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2, p2[0], p2[1]); }
    if (closed) c.closePath();
  }
  const fs = (c, fill, lw = 0.009, ink = INK) => { if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.lineWidth = lw; c.strokeStyle = ink; c.stroke(); } };
  const line = (c, pts, lw = 0.007, col = INK) => { sp(c, pts, false); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); };
  // a stone in a bezel: a domed cabochon, lit from within
  function gem(c, x, y, r, col = RED, bezel = true) {
    const cc = c.$c, dc = c.$d, g = cc.createRadialGradient(x - r * 0.3, y + r * 0.35, r * 0.05, x, y, r); g.addColorStop(0, col === PEARL ? '#ffffff' : '#ffffff'); g.addColorStop(col === PEARL ? 0.5 : 0.22, col); g.addColorStop(1, col === PEARL ? '#cdbfa6' : col);
    const h = dc.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, 'rgb(255,0,255)'); h.addColorStop(0.7, 'rgb(215,0,255)'); h.addColorStop(1, 'rgb(140,0,255)');
    cc.beginPath(); cc.arc(x, y, r, 0, TAU); cc.fillStyle = g; cc.fill(); dc.beginPath(); dc.arc(x, y, r, 0, TAU); dc.fillStyle = h; dc.fill();
    if (bezel) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = Math.max(r * 0.3, 0.0028); c.strokeStyle = INK; c.stroke(); }
  }
  const disc = (c, x, y, r, fill, lw = 0.007) => { if (STONES.has(fill) && r <= 0.04) return gem(c, x, y, r, fill, lw > 0); c.beginPath(); c.arc(x, y, r, 0, TAU); fs(c, fill, lw); };
  const punch = (c, x, y, r) => { c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#000'; c.fill(); c.restore(); };
  const row = (c, x0, y0, x1, y1, n, r) => { for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0.5; punch(c, lerp(x0, x1, u), lerp(y0, y1, u), r); } };
  // a string of pearls / stones along a polyline
  const beads = (c, pts, n, r, col = PEARL) => { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    for (let k = 0; k < n; k++) { let d = (k + 0.5) / n * L, i = 0; while (i < seg.length - 1 && d > seg[i]) d -= seg[i++]; const u = d / (seg[i] || 1); gem(c, lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u), r, typeof col === 'function' ? col(k) : col, false); } };
  const limb = (c, len, r0, r1, x1 = 0) => { c.beginPath(); c.arc(0, 0, r0, 0, Math.PI, false); c.lineTo(x1 - r1, -len); c.arc(x1, -len, r1, Math.PI, TAU, false); c.closePath(); };
  const band = (c, y, hw, h = 0.03, col = GOLD, n = 3) => { c.beginPath(); c.rect(-hw, y - h / 2, hw * 2, h); fs(c, col, 0.006); for (let i = 0; i < n; i++) gem(c, n > 1 ? lerp(-hw * 0.62, hw * 0.62, i / (n - 1)) : 0, y, h * 0.27, i % 2 ? GREEN : RED, false); };
  const lotus = (c, x, y, r, a = GOLD, b = RED) => { for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; c.beginPath(); c.ellipse(x + Math.cos(an) * r * 0.6, y + Math.sin(an) * r * 0.6, r * 0.42, r * 0.2, an, 0, TAU); fs(c, a, 0.004); } gem(c, x, y, r * 0.3, STONES.has(b) ? b : RED); };
  // a field of small woven motifs, clipped to the current path: brocade
  const brocade = (c, x0, y0, x1, y1, step, fn) => { c.save(); c.clip(); let j = 0; for (let y = y0; y <= y1; y += step * 0.86, j++) for (let x = x0 + (j % 2) * step / 2; x <= x1; x += step) fn(x, y, j); c.restore(); };
  // a gradient fill in the colour canvas (enamel pools darker at its edges): grad(c, x, y, r, inner, outer)
  const grad = (c, x, y, r, a, b, x2 = x, y2 = y) => { const g = c.$c.createRadialGradient(x2, y2, r * 0.05, x, y, r); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const lgrad = (c, x0, y0, x1, y1, stops) => { const g = c.$c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s)); return g; };
  // ---- the material ----
  const VS = /* glsl */`varying vec2 vUv; varying vec3 vWp, vVp, vT, vB, vN; uniform float uWave, uW; void main(){ vUv = uv; vec3 p = position; float u = uv.x;
    p.y += (sin(u * 7. - uW * 5.5) * .5 + sin(u * 13. - uW * 8.3 + 1.) * .2) * uWave * u; p.z += cos(u * 6. - uW * 5.) * uWave * u * .6;
    vec4 w = modelMatrix * vec4(p, 1.); vWp = w.xyz; vec4 v = viewMatrix * w; vVp = v.xyz; mat3 mv = mat3(modelViewMatrix); vT = normalize(mv * vec3(1., 0., 0.)); vB = normalize(mv * vec3(0., 1., 0.)); vN = normalize(normalMatrix * vec3(0., 0., 1.)); gl_Position = projectionMatrix * v; }`;
  const FS = /* glsl */`uniform sampler2D map, dat; uniform vec3 uLit, uKey, uKeyCol; uniform vec2 uTx, uSz; uniform float uKG; varying vec2 vUv; varying vec3 vWp, vVp, vT, vB, vN;
    ${GL.NOISE}${GL.AIR}
    float hF(vec2 uv){ vec4 d = texture2D(dat, uv); vec4 d2 = texture2D(dat, uv, 2.2); return d.r * d.a * .62 + d2.r * d2.a * .5; }            // wire, bezel, stone: the crisp relief
    float hC(vec2 uv){ return texture2D(map, uv, 4.6).a + texture2D(map, uv, 3.2).a * .5; }                                                       // the pillow of each piece: limbs read as round
    void main(){ vec4 c = texture2D(map, vUv); float a = clamp((c.a - .5) / max(fwidth(c.a), 1e-4) + .5, 0., 1.); if (a < .02) discard;
      vec4 d = texture2D(dat, vUv); float metal = smoothstep(.35, .75, d.g * d.a), stone = smoothstep(.35, .75, d.b * d.a);
      vec2 e = uTx * 1.3, E = uTx * 11.;
      vec2 gf = vec2(hF(vUv + vec2(e.x, 0.)) - hF(vUv - vec2(e.x, 0.)), hF(vUv + vec2(0., e.y)) - hF(vUv - vec2(0., e.y)));
      vec2 gc = vec2(hC(vUv + vec2(E.x, 0.)) - hC(vUv - vec2(E.x, 0.)), hC(vUv + vec2(0., E.y)) - hC(vUv - vec2(0., E.y)));
      vec2 m = vUv * uSz;                                                                    // metres on the sheet: procedural grain lives here
      float ham = vnoise(m * 900.) - .5, ham2 = vnoise(m * 2300. + 7.) - .5;                 // hammered gold; fades with distance through mip-like footprint below
      float foot = clamp(1. - length(fwidth(m)) * 500., 0., 1.);
      vec3 nl = normalize(vec3(-gf * 2.6 - gc * 1.15 + vec2(ham, ham2) * .22 * metal * foot, 1.));
      vec3 n = normalize(vT * nl.x + vB * nl.y + vN * nl.z * (gl_FrontFacing ? 1. : -1.));
      vec3 V = normalize(-vVp), L = normalize((viewMatrix * vec4(uKey, 0.)).xyz), Hh = normalize(L + V);
      float ndl = max(dot(n, L), 0.), nh = max(dot(n, Hh), 0.), ndv = max(dot(n, V), 0.), fres = pow(1. - ndv, 3.);
      vec3 fd = normalize(vWp - cameraPosition), Rw = reflect(fd, normalize((vec4(n, 0.) * viewMatrix).xyz)); vec3 env = skyBase(normalize(vec3(Rw.x, abs(Rw.y) + .04, Rw.z))) + vec3(1., .78, .46) * uGlow * .5;
      float sg = pow(max(dot(fd, uSun), 0.), 10.) * (1. - uNight);
      // enamel: light through coloured glass. It pools: deeper and more saturate in the middle of a cell, with seeds and currents in it.
      float seed = fbm(m * 55.) , cur = vnoise(m * 14. + 3.);
      vec3 glass = pow(c.rgb, vec3(1.28 + (seed - .5) * .28)) * (.90 + .20 * cur);
      vec3 trans = glass * uLit * (.44 + 1.9 * sg) * mix(.74, 1., smoothstep(.3, 3., vWp.y));
      float rim = smoothstep(.28, .75, length(gc)) * (sg * .55 + uGlow * .28);                   // the sun (or the form) catching every edge from behind
      vec3 enamel = trans + c.rgb * uKeyCol * ndl * .22 + (pow(nh, 110.) * 1.5 + fres * .16) * (uKeyCol * .8 + env * .5);
      // gold: it mirrors the sky and takes the key as a hard glint
      vec3 gA = vec3(1., .56, .13); vec3 gold = gA * (env * .72 + uKeyCol * (ndl * .40 + pow(nh, 36.) * 2.8 + pow(nh, 240.) * 10.)) + gA * uLit * .13 * (1. + sg * 1.5);
      // stones: a deep inner fire and a pinpoint star
      vec3 gemc = c.rgb * uLit * (1.1 + 1.6 * sg) + c.rgb * uKeyCol * ndl * .7 + (pow(nh, 180.) * 10. + fres * .5) * uKeyCol;
      vec3 col = mix(mix(enamel, gold, metal), gemc, stone) + vec3(1., .72, .38) * rim * (.3 + .7 * metal);
      col = mix(col, (c.rgb * .4 + .6) * vec3(1., .74, .34) * 2.6, uKG);                     // turned to light
      col = mix(col, fogCol(cameraPosition, fd), fogAmt(cameraPosition, vWp));
      gl_FragColor = vec4(col, a); }`;
  const jewel = (tex, dat, U) => { const img = tex.image, m = new THREE.ShaderMaterial({ uniforms: Object.assign({ map: { value: tex }, dat: { value: dat }, uTx: { value: new THREE.Vector2(1 / img.width, 1 / img.height) }, uSz: { value: new THREE.Vector2(tex.userData.w, tex.userData.h) }, uWave: { value: 0 }, uKG: { value: 0 } }, GL.U, light, U), vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide }); m.alphaToCoverage = true; return m; };
  let nPx = 0;
  function sheet(w, h, px, py, ppm, draw) {
    const cv = document.createElement('canvas'), dv = document.createElement('canvas'); cv.width = dv.width = Math.ceil(w * ppm); cv.height = dv.height = Math.ceil(h * ppm); const cc = cv.getContext('2d'), dc = dv.getContext('2d');
    dc.fillStyle = '#000'; dc.fillRect(0, 0, dv.width, dv.height);
    for (const x of [cc, dc]) { x.translate(px * ppm, cv.height - py * ppm); x.scale(ppm, -ppm); x.lineJoin = x.lineCap = 'round'; }
    draw(dual(cc, dc)); nPx += cv.width * cv.height * 2;
    try { const t = document.createElement('canvas'); t.width = dv.width; t.height = dv.height; const tx = t.getContext('2d'); tx.filter = 'blur(1.1px)'; tx.drawImage(dv, 0, 0); dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'copy'; dc.drawImage(t, 0, 0); } catch (e) { }     // round the wires a little
    const mk = (cvs, srgb) => { const t = new THREE.CanvasTexture(cvs); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
    const tex = mk(cv, true); tex.userData = { w, h, dat: mk(dv, false) }; return tex;
  }
  function part(w, h, px, py, ppm, draw, U, o = {}) {
    const tex = o.tex || sheet(w, h, px, py, ppm, draw), g = o.geo || new THREE.PlaneGeometry(w, h, o.segX || 1, o.segY || 1).translate(w / 2 - px, h / 2 - py, 0);
    const m = new THREE.Mesh(g, o.mat || jewel(tex, tex.userData.dat, U)); m.frustumCulled = false; m.userData.tex = tex; return m;
  }
  const leather = (tex, U) => jewel(tex, tex.userData.dat, U);
  return { INK, KOHL, GOLD, RED, GREEN, BLUE, PEARL, CREAM, sp, fs, line, disc, gem, beads, punch, row, limb, band, lotus, brocade, grad, lgrad, jewel, leather, sheet, part, light, get px() { return nPx; } };
})();
