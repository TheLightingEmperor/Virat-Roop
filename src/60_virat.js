'use strict';
// ---- the Virat Roop: the universal form, drawn in light across the night ----------------------------------------------
// A frontal icon the height of the sky (Film.FORM, Film.FORM_H): a body whose inside is the night itself (stars, a galaxy
// turning at the heart), edged and ornamented in gold line; behind it a wheel of arms that opens like a peacock's train,
// a fan of faces looking to every side, and a halo "as if a thousand suns rose at once".
//   Virat.build(scene, prog, tick)
//   Virat.MOUTH (Vector3, world)      where the rivers of light run to in the Kala shots
// Everything is drawn once on canvases in "figure metres" (a 2.3 m icon) and scaled by K. Reads Film.state(t): vir (the
// form condensing out of the light), unfurl (arms and faces opening), fire / mouth (Time, the devourer), flash.
const Virat = (() => {
  const { sp, punch } = Pup, D = DEG, AU = '#ffcf6a', HOT = '#fff1c2', RUBY = '#ff5a3c', SKY = '#6fd6ff';
  let K = 200; const MOUTH = new THREE.Vector3(), root = new THREE.Group();
  const U = { uVir: { value: 0 }, uFireK: { value: 0 }, uFlash: { value: 0 }, uHeart: { value: new THREE.Vector2(0, 1.36) } };
  const stroke = (c, pts, lw = 0.006, col = AU, closed = false) => { sp(c, pts, closed); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); };
  const ring = (c, x, y, r, lw = 0.005, col = AU) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); };
  const dot = (c, x, y, r, col = HOT) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); };
  const mirror = (c, fn) => { fn(c, 1); c.save(); c.scale(-1, 1); fn(c, -1); c.restore(); };
  const shape = (c, pts, lw = 0.008) => { sp(c, pts); c.fillStyle = '#000'; c.fill(); c.lineWidth = lw; c.strokeStyle = AU; c.stroke(); };   // a piece of the night, edged in gold
  // ---------- the body ----------
  const HALF = [[0.0, 0.86, 1], [0.03, 0.6], [0.04, 0.3], [0.048, 0.1], [0.03, 0.04], [0.03, 0.0, 1], [0.2, 0.0, 1], [0.205, 0.035], [0.12, 0.075], [0.11, 0.12], [0.135, 0.32], [0.145, 0.52], [0.175, 0.74], [0.172, 0.93], [0.125, 1.06], [0.14, 1.22], [0.185, 1.39],
    [0.24, 1.5], [0.215, 1.545], [0.1, 1.565], [0.052, 1.59], [0.05, 1.63], [0.082, 1.67], [0.103, 1.76], [0.1, 1.86], [0.07, 1.92], [0.0, 1.94]];
  const CROWN = [[0.112, 1.872, 1], [0.128, 1.9], [0.106, 1.958, 1], [0.112, 1.975, 1], [0.086, 2.038, 1], [0.092, 2.055, 1], [0.063, 2.113, 1], [0.068, 2.13, 1], [0.037, 2.19, 1], [0.03, 2.235], [0.016, 2.262], [0.022, 2.285], [0, 2.335, 1]];
  const full = h => h.concat(h.slice(1, -1).reverse().map(p => [-p[0], p[1], p[2]]));
  function drawBody(c) {
    mirror(c, c => { shape(c, [[0.165, 1.0, 1], [0.27, 0.86], [0.3, 0.62], [0.27, 0.4], [0.37, 0.2, 1], [0.3, 0.33], [0.24, 0.5], [0.225, 0.7], [0.16, 0.9, 1]], 0.006); for (let i = 0; i < 4; i++) dot(c, 0.262 + Math.sin(i) * 0.012, 0.8 - i * 0.12, 0.006, AU); });   // sashes
    mirror(c, c => shape(c, [[0.108, 1.875, 1], [0.15, 1.92], [0.2, 2.02, 1], [0.15, 1.985], [0.11, 1.95, 1]], 0.006));                                    // the crown's wings
    shape(c, full(HALF), 0.009); shape(c, full(CROWN), 0.008);
    mirror(c, c => { shape(c, [[0.1, 1.8], [0.118, 1.79], [0.122, 1.74], [0.112, 1.715], [0.1, 1.74]], 0.005); ring(c, 0.121, 1.685, 0.03, 0.007); ring(c, 0.121, 1.685, 0.014, 0.004, RUBY); for (let i = 0; i < 8; i++) dot(c, 0.121 + Math.cos(i * TAU / 8) * 0.022, 1.685 + Math.sin(i * TAU / 8) * 0.022, 0.0028); });
    // crown: tiers, gems
    [[1.9, 0.122], [1.966, 0.108], [2.046, 0.088], [2.122, 0.064], [2.19, 0.036]].forEach(([y, w], i) => { stroke(c, [[-w, y], [w, y]], 0.006); stroke(c, [[-w * 0.96, y - 0.012], [w * 0.96, y - 0.012]], 0.003); const n = 7 - i; for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * w * 1.7 / n; ring(c, x, y + 0.03, 0.011 - i * 0.001, 0.004, k % 2 ? RUBY : SKY); dot(c, x, y + 0.03, 0.004); } });
    stroke(c, [[-0.112, 1.875], [0.112, 1.875]], 0.008); ring(c, 0, 2.262, 0.014, 0.004); for (let i = -3; i <= 3; i++) stroke(c, [[i * 0.03, 1.878], [i * 0.035, 1.9]], 0.003);
    // the face
    mirror(c, c => { stroke(c, [[0.012, 1.822], [0.046, 1.84], [0.09, 1.818]], 0.006); c.beginPath(); c.moveTo(0.018, 1.79); c.quadraticCurveTo(0.047, 1.812, 0.084, 1.796); c.quadraticCurveTo(0.048, 1.776, 0.018, 1.79); c.lineWidth = 0.005; c.strokeStyle = AU; c.stroke();
      stroke(c, [[0.084, 1.796], [0.098, 1.802]], 0.004); stroke(c, [[0.012, 1.822], [0.008, 1.77], [0.019, 1.736], [0.0, 1.724]], 0.005); stroke(c, [[0, 1.699], [0.016, 1.704], [0.036, 1.694]], 0.005); stroke(c, [[0, 1.679], [0.02, 1.681], [0.036, 1.694]], 0.005);
      stroke(c, [[0, 1.652], [0.022, 1.657]], 0.003); stroke(c, [[0.008, 1.84], [0.008, 1.868]], 0.004, HOT); stroke(c, [[0.05, 1.615], [0.02, 1.605], [0, 1.603]], 0.003); stroke(c, [[0.05, 1.6], [0.02, 1.588], [0, 1.586]], 0.003); });
    dot(c, 0, 1.848, 0.006, RUBY); stroke(c, [[0, 1.691], [0.03, 1.693]], 0.002, HOT); stroke(c, [[0, 1.691], [-0.03, 1.693]], 0.002, HOT);
    // necklaces, the long garland, the jewel, the thread
    for (const [r, n] of [[0.085, 9], [0.122, 13], [0.165, 17]]) { c.beginPath(); c.ellipse(0, 1.585, r, r * 1.08, 0, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 0.006; c.strokeStyle = AU; c.stroke(); for (let i = 0; i < n; i++) { const a = Math.PI * (1.13 + i * 0.74 / (n - 1)); dot(c, Math.cos(a) * r, 1.585 + Math.sin(a) * r * 1.08 - 0.008, 0.005, i % 2 ? RUBY : HOT); } }
    for (const k of [1, 0.955]) { c.beginPath(); c.ellipse(0, 1.5, 0.19 * k, 0.56 * k, 0, Math.PI * 1.06, Math.PI * 1.94); c.lineWidth = 0.004; c.strokeStyle = AU; c.stroke(); } for (let i = 0; i < 40; i++) { const a = Math.PI * (1.05 + i * 0.9 / 39); dot(c, Math.cos(a) * 0.186, 1.5 + Math.sin(a) * 0.548, 0.0045, i % 3 ? HOT : RUBY); }
    ring(c, 0, 1.405, 0.024, 0.006, RUBY); dot(c, 0, 1.405, 0.009); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; stroke(c, [[Math.cos(a) * 0.03, 1.405 + Math.sin(a) * 0.03], [Math.cos(a) * 0.044, 1.405 + Math.sin(a) * 0.044]], 0.003); }
    mirror(c, c => { stroke(c, [[0.14, 1.4], [0.075, 1.368], [0.016, 1.39]], 0.004); stroke(c, [[0.06, 1.25], [0.03, 1.24], [0.006, 1.25]], 0.003); stroke(c, [[0.07, 1.17], [0.035, 1.16], [0.006, 1.17]], 0.003); }); ring(c, 0, 1.125, 0.008, 0.004);
    stroke(c, [[-0.17, 1.52], [-0.02, 1.3], [0.11, 1.07]], 0.004, HOT);
    // girdle, the pleats of the cloth, anklets
    stroke(c, [[-0.127, 1.06], [0.127, 1.06]], 0.006); stroke(c, [[-0.15, 1.015], [0.15, 1.015]], 0.006); for (let i = -4; i <= 4; i++) { ring(c, i * 0.03, 1.038, 0.009, 0.003, i % 2 ? RUBY : SKY); c.beginPath(); c.arc(i * 0.034, 1.012, 0.017, Math.PI, TAU); c.lineWidth = 0.003; c.strokeStyle = AU; c.stroke(); }
    ring(c, 0, 1.038, 0.03, 0.006); dot(c, 0, 1.038, 0.012, RUBY);
    for (let i = -3; i <= 3; i++) stroke(c, [[i * 0.008, 1.0], [i * 0.024, 0.16]], 0.003); stroke(c, [[-0.075, 0.15, 1], [-0.05, 0.19, 1], [-0.025, 0.15, 1], [0, 0.19, 1], [0.025, 0.15, 1], [0.05, 0.19, 1], [0.075, 0.15, 1]], 0.004);
    mirror(c, c => { for (let i = 0; i < 7; i++) { const y = 0.92 - i * 0.105, xo = lerp(0.172, 0.13, i / 6); stroke(c, [[0.035, y - 0.01], [(0.035 + xo) / 2, y - 0.035], [xo, y + 0.02]], 0.003); }
      stroke(c, [[0.05, 0.21], [0.13, 0.215]], 0.006); stroke(c, [[0.05, 0.185], [0.128, 0.19]], 0.003); stroke(c, [[0.05, 0.11], [0.112, 0.115]], 0.007); for (let i = 0; i < 4; i++) dot(c, 0.06 + i * 0.016, 0.092, 0.004); for (let i = 0; i < 5; i++) stroke(c, [[0.1 + i * 0.022, 0.006], [0.105 + i * 0.022, 0.03]], 0.003); });
  }
  // ---------- a side face, in profile (facing +X): the same cut as the puppets' heads, in line of light ----------
  const PROF = [[0.05, -0.12, 1], [0.052, 0.052], [0.07, 0.064], [0.102, 0.076], [0.105, 0.097], [0.117, 0.107], [0.105, 0.117, 1], [0.119, 0.128], [0.112, 0.142, 1], [0.153, 0.152], [0.129, 0.19], [0.116, 0.222], [0.113, 0.262], [0.094, 0.302], [0.02, 0.336], [-0.07, 0.31], [-0.112, 0.24], [-0.108, 0.16], [-0.07, 0.09], [-0.05, 0.04], [-0.05, -0.12, 1]];
  function drawFace(c) {
    shape(c, [[-0.06, 0.3], [-0.13, 0.26], [-0.14, 0.12], [-0.15, -0.04], [-0.1, -0.1], [-0.05, -0.02]], 0.004); shape(c, PROF, 0.007);
    shape(c, [[-0.1, 0.30, 1], [0.108, 0.285, 1], [0.118, 0.33], [0.085, 0.385, 1], [0.09, 0.4, 1], [0.062, 0.455, 1], [0.066, 0.47, 1], [0.035, 0.525, 1], [0.012, 0.6, 1], [-0.012, 0.53, 1], [-0.04, 0.475, 1], [-0.036, 0.46, 1], [-0.068, 0.405, 1], [-0.064, 0.39, 1], [-0.105, 0.34]], 0.006);
    for (const [y, w] of [[0.33, 0.1], [0.395, 0.074], [0.465, 0.05]]) { stroke(c, [[-w, y], [w + 0.01, y - 0.004]], 0.004); for (let i = -1; i <= 1; i++) ring(c, i * w * 0.55, y + 0.028, 0.008, 0.003, i ? SKY : RUBY); }
    c.beginPath(); c.moveTo(0.110, 0.204); c.quadraticCurveTo(0.082, 0.232, 0.036, 0.211); c.quadraticCurveTo(0.078, 0.186, 0.110, 0.204); c.lineWidth = 0.005; c.strokeStyle = AU; c.stroke(); dot(c, 0.087, 0.207, 0.008);
    stroke(c, [[0.114, 0.236], [0.08, 0.256], [0.026, 0.24]], 0.005); stroke(c, [[0.105, 0.117], [0.09, 0.113], [0.082, 0.117]], 0.004); stroke(c, [[0.04, 0.212], [0.016, 0.224]], 0.004);
    c.beginPath(); c.ellipse(-0.004, 0.188, 0.017, 0.03, 0.15, 0, TAU); c.lineWidth = 0.004; c.strokeStyle = AU; c.stroke(); ring(c, -0.008, 0.118, 0.03, 0.006); ring(c, -0.008, 0.118, 0.014, 0.004, RUBY);
    for (let i = 0; i < 3; i++) stroke(c, [[-0.07 - i * 0.02, 0.26 - i * 0.03], [-0.105 - i * 0.008, 0.12 - i * 0.02], [-0.12 - i * 0.004, -0.03]], 0.003);
  }
  // ---------- an arm (pivot: the shoulder; it reaches along +X, the forearm bent up), holding one of the attributes ----------
  function drawArm(c, kind, bend) {
    const a = bend * D, E = [0.31, 0], W = [E[0] + 0.27 * Math.cos(a), 0.27 * Math.sin(a)];
    const seg = (p, q, w) => { c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.lineWidth = w + 0.016; c.strokeStyle = AU; c.stroke(); };
    const fill = (p, q, w) => { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.lineWidth = w; c.strokeStyle = '#000'; c.stroke(); };
    seg([0, 0], E, 0.074); seg(E, W, 0.058); fill([0, 0], E, 0.074); fill(E, W, 0.058);
    for (const x of [0.11, 0.135]) stroke(c, [[x, -0.042], [x, 0.042]], 0.007); stroke(c, [[0.1225, 0.04, 1], [0.1225, 0.07, 1]], 0.011); dot(c, 0.1225, 0, 0.009, RUBY);
    c.save(); c.translate(W[0], W[1]); c.rotate(a);
    for (const x of [-0.07, -0.05, -0.03]) stroke(c, [[x, -0.031], [x, 0.031]], 0.005);
    c.translate(0.045, 0);
    if (kind >= 8) {                                                          // the open hand: do not fear
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0.02, -0.03 + i * 0.02); c.lineTo(0.02 + [0.07, 0.085, 0.08, 0.062][i], -0.036 + i * 0.024); c.lineWidth = 0.031; c.strokeStyle = AU; c.stroke(); c.lineWidth = 0.017; c.strokeStyle = '#000'; c.stroke(); }
      c.beginPath(); c.moveTo(-0.01, 0.035); c.lineTo(0.035, 0.085); c.lineWidth = 0.032; c.strokeStyle = AU; c.stroke(); c.lineWidth = 0.018; c.strokeStyle = '#000'; c.stroke();
      c.beginPath(); c.arc(0, 0, 0.052, 0, TAU); c.fillStyle = '#000'; c.fill(); c.lineWidth = 0.007; c.strokeStyle = AU; c.stroke(); ring(c, 0, 0, 0.022, 0.004, HOT); for (let i = 0; i < 8; i++) stroke(c, [[0, 0], [Math.cos(i * TAU / 8) * 0.022, Math.sin(i * TAU / 8) * 0.022]], 0.002, HOT);
    } else {
      c.beginPath(); c.arc(0, 0, 0.034, 0, TAU); c.fillStyle = '#000'; c.fill(); c.lineWidth = 0.007; c.strokeStyle = AU; c.stroke(); for (let i = -1; i <= 1; i++) stroke(c, [[-0.02, i * 0.014], [0.02, i * 0.014]], 0.003);
      if (kind === 0) { c.translate(0.02, 0.13); ring(c, 0, 0, 0.085, 0.012, HOT); ring(c, 0, 0, 0.05, 0.004); for (let i = 0; i < 8; i++) stroke(c, [[0, 0], [Math.cos(i * TAU / 8) * 0.08, Math.sin(i * TAU / 8) * 0.08]], 0.004); for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; stroke(c, [[Math.cos(an - 0.1) * 0.09, Math.sin(an - 0.1) * 0.09, 1], [Math.cos(an + 0.12) * 0.125, Math.sin(an + 0.12) * 0.125, 1], [Math.cos(an + 0.16) * 0.09, Math.sin(an + 0.16) * 0.09, 1]], 0.005, RUBY); } dot(c, 0, 0, 0.012); }
      else if (kind === 1) { c.translate(0.0, 0.03); shape(c, [[0, 0.0, 1], [0.06, 0.06], [0.07, 0.15], [0.02, 0.22], [-0.03, 0.26, 1], [-0.045, 0.18], [-0.06, 0.1], [-0.04, 0.03]], 0.006); for (let i = 0; i < 4; i++) stroke(c, [[-0.045 + i * 0.006, 0.07 + i * 0.045], [0.0, 0.05 + i * 0.045], [0.055 - i * 0.012, 0.085 + i * 0.04]], 0.003); }
      else if (kind === 2) { stroke(c, [[0, -0.06], [0, 0.26]], 0.014); c.beginPath(); c.ellipse(0, 0.31, 0.058, 0.075, 0, 0, TAU); c.fillStyle = '#000'; c.fill(); c.lineWidth = 0.007; c.strokeStyle = AU; c.stroke(); for (let i = -1; i <= 1; i++) stroke(c, [[i * 0.03, 0.25], [i * 0.036, 0.31], [i * 0.03, 0.37]], 0.003); dot(c, 0, 0.395, 0.012); }
      else if (kind === 3) { stroke(c, [[0, -0.02], [0.01, 0.1]], 0.006); for (let i = -2; i <= 2; i++) { c.save(); c.translate(0.01, 0.1); c.rotate(-i * 0.42); shape(c, [[0, 0, 1], [0.03, 0.06], [0, 0.14, 1], [-0.03, 0.06]], 0.004); c.restore(); } dot(c, 0.01, 0.12, 0.01, RUBY); }
      else if (kind === 4) { shape(c, [[-0.02, 0.05, 1], [-0.026, 0.3], [0, 0.42, 1], [0.026, 0.3], [0.02, 0.05, 1]], 0.005); stroke(c, [[0, 0.06], [0, 0.38]], 0.002, HOT); stroke(c, [[-0.055, 0.045], [0.055, 0.045]], 0.012); stroke(c, [[0, -0.07], [0, 0.04]], 0.012); }
      else if (kind === 5) { stroke(c, [[0, -0.1], [0, 0.3]], 0.011); stroke(c, [[-0.07, 0.4], [-0.065, 0.31], [0, 0.28], [0.065, 0.31], [0.07, 0.4]], 0.01); stroke(c, [[0, 0.28], [0, 0.44]], 0.011); dot(c, 0, 0.28, 0.012, RUBY); }
      else if (kind === 6) { stroke(c, [[0.04, -0.2], [-0.07, -0.1], [-0.095, 0.03], [-0.07, 0.16], [0.04, 0.26]], 0.012); stroke(c, [[0.04, -0.2], [0.04, 0.26]], 0.003, HOT); }
      else { for (const [dx, h, w] of [[0, 0.3, 0.06], [-0.045, 0.2, 0.04], [0.045, 0.22, 0.04]]) stroke(c, [[dx - w, 0.05, 1], [dx - w * 0.5, 0.05 + h * 0.5], [dx + w * 0.2, 0.05 + h, 1], [dx + w * 0.6, 0.05 + h * 0.45], [dx + w, 0.05, 1]], 0.006, dx ? RUBY : HOT); }
    }
    c.restore();
  }
  // ---------- the material: night inside, gold on it ----------
  const VS = /* glsl */`varying vec2 vUv; varying vec3 vWp; varying vec2 vF; uniform vec4 uXf;       // uXf: this sheet's offset (xy), z rotation and scale inside the icon, so the night is continuous across pieces
    void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vWp = w.xyz; float cs = cos(uXf.z), sn = sin(uXf.z); vec2 p = position.xy * uXf.w; vF = uXf.xy + vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs); gl_Position = projectionMatrix * viewMatrix * w; }`;
  const FS = /* glsl */`uniform sampler2D map; uniform float uVir, uFireK, uFlash, uOp, uSide, uNeb; uniform vec2 uHeart; varying vec2 vUv; varying vec3 vWp; varying vec2 vF;
    ${GL.NOISE}${GL.AIR}
    float stars(vec2 p, float thr){ vec2 i = floor(p), f = fract(p) - .5; float h = hash1(i); vec2 o = (vec2(hash1(i + 7.3), hash1(i + 3.1)) - .5) * .7; float tw = .6 + .4 * sin(uT * (1. + h * 4.) + h * 60.); return smoothstep(thr, 1., h) * smoothstep(.18, .0, length(f - o)) * tw; }
    void main(){
      vec4 m = texture2D(map, vUv); if (m.a < .004) discard;
      vec2 f = vec2(vF.x * uSide, vF.y), h = f - uHeart; float r = length(h);
      // the form condenses outward from the heart, its edge ragged with light
      float n = fbm(f * 5. + uT * .05), edge = uVir * 2.9 - .25 - r - n * .35, vis = smoothstep(0., .12, edge), rim = smoothstep(.22, .0, abs(edge - .1)) * step(.001, uVir) * (1. - smoothstep(.85, 1., uVir));
      vis *= uOp * smoothstep(-.03, .2, f.y);                                               // the feet stand in the dust of the horizon
      if (vis < .003) discard;
      // the inside of the body: the night. Parallax makes it deep.
      vec2 par = (cameraPosition.xy - vec2(0., 300.)) * .0004; vec2 q = f + par;
      float neb = fbm(q * 2.6 + vec2(uT * .012, 0.)), neb2 = fbm(q * 5.2 - vec2(0., uT * .02) + 9.);
      vec3 body = vec3(.004, .007, .030) + (vec3(.10, .05, .30) * pow(neb, 2.4) * 1.3 + vec3(.02, .16, .34) * pow(neb2, 3.) * 1.5 + vec3(.55, .22, .10) * pow(neb * neb2, 3.) * 4.) * uNeb;
      body += (stars(q * 70., .86) * vec3(.9, .95, 1.3) * 2.2 + stars(q * 150. + 3., .82) * vec3(1.2, 1., .8) * 1.1 + stars(q * 30. + 7., .95) * vec3(1.3, 1.1, .9) * 6.);
      // a galaxy turning at the heart; worlds in their courses round it
      float th = atan(h.y, h.x), gal = exp(-r * 14.) * 1.5 + pow(max(sin(2. * th - 9. * log(r + .03) + uT * .35), 0.), 3.) * exp(-r * 6.5) * 1.3;
      body += vec3(1., .78, .46) * gal * uNeb;
      // the cloth of gold on the limbs, sapphire in the breast: the colours of the gentle form, kept in the vast one
      float mainB = step(.9, uNeb); body += mainB * (vec3(.62, .30, .03) * smoothstep(1.05, .96, f.y) * smoothstep(.08, .5, f.y) * (.25 + .5 * neb) + vec3(.03, .16, .50) * smoothstep(1.02, 1.2, f.y) * smoothstep(1.62, 1.4, f.y) * (.3 + .5 * neb2));
      for (int i = 0; i < 5; i++){ float fi = float(i), a = uT * (.5 - fi * .07) + fi * 1.9, rr = .07 + fi * .035; vec2 pp = h - vec2(cos(a) * rr, sin(a) * rr * .45); float d = length(pp);
        body += mix(vec3(.4, .7, 1.2), vec3(1.3, .6, .3), fract(fi * .37)) * smoothstep(.011 + fi * .0015, .004, d) * 3.; body += vec3(.5, .5, .7) * smoothstep(.0025, .0, abs(length(h * vec2(1., 2.2)) - rr)) * .25; }
      // Time, the devourer: the body burns upward from within
      body = mix(body, body * vec3(1.6, .45, .2) + vec3(.5, .09, .01) * (fbm(q * 7. - vec2(0., uT * .7)) * 1.4) * smoothstep(1.9, .3, abs(f.y - 1.7)), uFireK * .8);
      float lum = max(m.r, max(m.g, m.b)), shim = .78 + .22 * sin(f.y * 34. - uT * 1.6 + f.x * 9.);
      vec3 gold = m.rgb * (2.7 + uFlash * 5.) * shim; gold = mix(gold, gold.rrr * vec3(1.25, .42, .12), uFireK * .55);
      vec3 col = mix(body, gold, smoothstep(.04, .5, lum)) + vec3(1., .85, .55) * rim * 6.;
      float al = m.a * .97;
      vec3 fd = normalize(vWp - cameraPosition); float fa = fogAmt(cameraPosition, vWp) * .55; col = mix(col, fogCol(cameraPosition, fd), fa);
      gl_FragColor = vec4(col * al * vis, al * vis); }`;
  const mats = [];
  function sheet(w, h, px, py, ppm, draw, order) {
    const tex = Pup.sheet(w, h, px, py, ppm, draw), u = Object.assign({ map: { value: tex }, uXf: { value: new THREE.Vector4(0, 0, 0, 1) }, uOp: { value: 1 }, uSide: { value: 1 }, uNeb: { value: 1 } }, GL.U, U);
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(w / 2 - px, h / 2 - py, 0), mat); mesh.frustumCulled = false; mesh.renderOrder = order; mats.push(mat); return mesh;
  }
  const clone = (src, order) => { const mat = src.material.clone(); mat.uniforms.map = src.material.uniforms.map; for (const k in GL.U) mat.uniforms[k] = GL.U[k]; for (const k in U) mat.uniforms[k] = U[k]; const m = new THREE.Mesh(src.geometry, mat); m.frustumCulled = false; m.renderOrder = order; return m; };
  // ---------- the halo ----------
  const HALO_FS = /* glsl */`uniform float uVir, uFireK, uFlash, uOpen; varying vec2 vUv; varying vec3 vWp;
    ${GL.NOISE}${GL.AIR}
    vec3 pal(float t){ return .5 + .5 * cos(6.2831853 * (t + vec3(0., .33, .67))); }
    void main(){ vec2 p = vUv * 2. - 1.; float r = length(p), th = atan(p.y, p.x); if (r > 1.) discard;
      float open = uOpen, gate = smoothstep(open * 1.25, open * 1.25 - .25, r);
      vec3 gold = mix(vec3(1., .72, .32), vec3(1., .30, .08), uFireK * .8), hot = mix(vec3(1., .93, .78), vec3(1., .6, .3), uFireK * .6);
      float core = exp(-r * r * 26.) * 1.2 + exp(-r * 5.5) * .26;
      float rays = (pow(abs(sin(th * 18. + uT * .05)), 14.) * exp(-r * 3.2) * 1.1 + pow(abs(sin(th * 7. - uT * .03 + 1.)), 6.) * exp(-r * 2.2) * .45) * smoothstep(.10, .34, r);
      float rings = (smoothstep(.006, .0, abs(r - .30)) + smoothstep(.004, .0, abs(r - .325)) * .6 + smoothstep(.006, .0, abs(r - .52)) * .8 + smoothstep(.003, .0, abs(r - .545)) * .5 + smoothstep(.005, .0, abs(r - .80)) * .6) * (.8 + .2 * sin(th * 60. + uT));
      float fl = .33 + .045 * (.5 + .5 * sin(th * 30. + uT * .6)) + .018 * sin(th * 71. - uT * 1.3), flame = smoothstep(fl + .03, fl - .01, r) * smoothstep(.30, .325, r) * .55;           // tongues of fire round the inner ring
      float fl2 = .55 + .06 * pow(.5 + .5 * sin(th * 22. - uT * .4), 2.), flame2 = smoothstep(fl2 + .04, fl2 - .01, r) * smoothstep(.52, .55, r) * .3;
      // a thousand suns, rising together
      float suns = 0.; for (int k = 0; k < 3; k++){ float fk = float(k), rr = .66 + fk * .11, nn = 28. + fk * 14., a = th / 6.2831853 * nn + uT * (.012 - fk * .008) * nn, id = floor(a), fa = fract(a) - .5;
        vec2 d = vec2(fa * 6.2831853 / nn * rr, r - rr - (hash1(vec2(id, fk)) - .5) * .05); float sz = .006 + hash1(vec2(id, fk + 5.)) * .009; suns += (smoothstep(sz, sz * .35, length(d)) * 5. + exp(-length(d) * 55.) * .6) * (.6 + .4 * sin(uT * (1. + hash1(vec2(id, 9.)) * 2.) + id)); }
      // colour: the rays alternate saffron and rose, the second fire is violet, and a ring of lotus petals closes the wheel
      vec3 rayc = mix(gold, vec3(1., .30, .42), .5 + .5 * sin(th * 9. + 1.)), fl2c = mix(vec3(.85, .30, 1.), vec3(.30, .65, 1.), .5 + .5 * sin(th * 11.));
      float pa = th / 6.2831853 * 28. + .5, pf = abs(fract(pa) - .5) * 2., pr = .86 + .10 * (1. - pf * pf), petal = smoothstep(pr + .006, pr - .006, r) * smoothstep(.84, .86, r), pedge = smoothstep(.012, .0, abs(r - pr)) + smoothstep(.02, .0, pf) * step(.86, r) * step(r, pr);
      vec3 petc = mix(vec3(1., .32, .55), vec3(1., .62, .12), step(.5, fract(floor(pa) * .5))) ;
      vec3 irid = pal(r * 1.6 - uT * .03 + th * .08) * exp(-r * 1.6) * .17 * smoothstep(.3, .6, r);
      vec3 sunc = mix(hot, pal(floor(th / 6.2831853 * 40.) * .137), .35);
      vec3 col = hot * core + rayc * rays + gold * flame + fl2c * flame2 * 1.6 + hot * rings * 1.6 + sunc * suns * gate + (petc * petal * .15 + mix(hot, petc, .5) * pedge * .7) * gate + irid * (1. - uFireK * .7);
      col *= gate * (1. - smoothstep(.975, 1., r)) * uVir * (1. + uFlash * 2.);
      col = mix(col, col * .6, fogAmt(cameraPosition, vWp) * .7);
      gl_FragColor = vec4(col, 0.); }`;
  // small lights: the eyes (sun and moon), the mouth of Time
  const GLOW_FS = /* glsl */`uniform vec3 uCol; uniform float uAmt, uT, uFlame; varying vec2 vUv;
    ${GL.NOISE}
    void main(){ vec2 p = vUv * 2. - 1.; float r = length(p); float g = exp(-r * r * 9.) * 1.6 + exp(-r * 3.) * .25; if (uFlame > .5) { float n = fbm(vec2(p.x * 3., p.y * 2. - uT * 1.8)); g = smoothstep(1., .0, r + (n - .5) * .9 + max(-p.y, 0.) * .4) * (1.2 + n * 2.5); }
      gl_FragColor = vec4(uCol * g * uAmt * (1. - smoothstep(.8, 1., r)), 0.); }`;
  const SV = 'varying vec2 vUv; varying vec3 vWp; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vWp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  const addMat = (fs, u) => new THREE.ShaderMaterial({ uniforms: Object.assign(u, GL.U, U), vertexShader: SV, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide });
  let body, halo, arms = [], faces = [], eyes = [], mouth, haloU;
  async function build(scene, prog, tick) {
    K = Film.FORM_H / 2.15; root.position.copy(Film.FORM); root.position.y = -14; root.scale.setScalar(K); scene.add(root);
    MOUTH.set(0, Film.fy(1.689), Film.FORM.z + 4);
    haloU = { uOpen: { value: 0 } }; halo = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0).translate(0, 1.62, 0), addMat(HALO_FS, haloU)); halo.position.z = -0.12; halo.renderOrder = -6; halo.frustumCulled = false; root.add(halo);
    body = sheet(1.1, 2.5, 0.55, 0.06, 1500, drawBody, -3); root.add(body);
    prog(0.4); await tick();
    // the wheel of arms: 9 a side, in two ranks, each with its sign
    const kinds = [0, 2, 1, 4, 3, 5, 7, 6, 0], src = []; for (let k = 0; k < 8; k++) src.push(sheet(1.05, 0.9, 0.1, 0.3, 900, c => drawArm(c, k, 38), -5));
    const palmUp = sheet(1.05, 0.9, 0.1, 0.3, 900, c => drawArm(c, 8, 96), -2), palmDn = sheet(1.05, 0.9, 0.1, 0.3, 900, c => drawArm(c, 8, 14), -2);
    for (const s of [1, -1]) for (let i = 0; i < 9; i++) { const kd = s > 0 ? kinds[i] : kinds[8 - i], m = clone(src[kd % 8], -5 + i * 0.01), g = new THREE.Group(); g.add(m); g.position.set(s * 0.19, 1.47, -0.03 - i * 0.004); g.scale.x = s; root.add(g);
      m.material.uniforms.uNeb.value = 0.3; arms.push({ g, m, s, i, a: -56 + i * 17.5, len: 1.5 + (i % 2) * 0.36 }); }
    for (const [m, s, a] of [[palmUp, 1, -52], [palmDn, -1, -64]]) { const g = new THREE.Group(); g.add(m); g.position.set(s * 0.2, 1.47, 0.02); g.scale.x = s; root.add(g); arms.push({ g, m, s, i: -1, a, len: 1.0 }); }
    prog(0.7); await tick();
    // the fan of faces: four a side, looking outward, and three more rising behind the crown
    const f0 = sheet(0.5, 0.95, 0.22, 0.22, 1000, drawFace, -4);
    for (const s of [1, -1]) for (let i = 1; i <= 4; i++) { const m = clone(f0, -4 - i * 0.01), g = new THREE.Group(); g.add(m); g.scale.x = s; root.add(g); faces.push({ g, m, s, i, x: 0.085 + 0.098 * i, y: 1.585 - 0.012 * i * i, rot: -(5 + 7.5 * i), sc: 1 - 0.07 * i }); }
    for (const [s, x, y, rot, sc] of [[1, 0.1, 2.02, 16, 0.6], [-1, 0.1, 2.02, 16, 0.6], [1, 0.0, 2.2, 0, 0.0]]) if (sc) { const m = clone(f0, -4.5), g = new THREE.Group(); g.add(m); g.scale.x = s; root.add(g); faces.push({ g, m, s, i: 5, x, y, rot, sc }); }
    // eyes: the sun in one, the moon in the other; and the mouth
    for (const [x, col] of [[0.05, [1.0, 0.78, 0.4]], [-0.05, [0.75, 0.85, 1.1]]]) { const u = { uCol: { value: new THREE.Vector3(...col) }, uAmt: { value: 0 }, uFlame: { value: 0 } }, e = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11), addMat(GLOW_FS, u)); e.position.set(x, 1.793, 0.01); e.renderOrder = -1; root.add(e); eyes.push(u); }
    const mu = { uCol: { value: new THREE.Vector3(1.0, 0.42, 0.10) }, uAmt: { value: 0 }, uFlame: { value: 1 } }; mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), addMat(GLOW_FS, mu)); mouth.position.set(0, 1.67, 0.012); mouth.renderOrder = -1; mouth.userData.u = mu; root.add(mouth);
    G.tick.push(update); update(0); prog(1);
  }
  const back = x => { const u = clamp(x); const s = 1.4; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };      // ease out, a little past, and settle
  function update(t) {
    const S = Film.state(t), un = S.unfurl; root.visible = S.vir > 0.001; if (!root.visible) return;
    U.uVir.value = S.vir; U.uFireK.value = S.fire; U.uFlash.value = S.flash; haloU.uOpen.value = sstep(0.1, 1, S.vir) * 0.55 + un * 0.45;
    const breath = Math.sin(t * 0.7) * 0.6;
    for (const a of arms) { const m = a.m.material.uniforms, g = a.g;
      if (a.i < 0) { const k = sstep(0.25, 0.8, S.vir); a.ang = lerp(-84, a.a, back(k)) + breath * 0.5; g.scale.set(a.s, 1, 1); m.uOp.value = k; }
      else { const k = clamp(un * 1.75 - a.i * 0.085), e = back(k), ang = lerp(-86, a.a, e) + Math.sin(t * 0.5 + a.i * 0.8) * 1.6 + breath; a.ang = ang; const L = lerp(0.7, a.len, sstep(0, 1, k)); g.scale.set(a.s * L, lerp(0.7, 1.1, sstep(0, 1, k)), 1); m.uOp.value = sstep(0.0, 0.25, k); }
      g.rotation.z = a.s * a.ang * D; m.uSide.value = a.s; m.uXf.value.set(Math.abs(g.position.x), g.position.y, a.ang * D, Math.abs(g.scale.y)); }
    for (const f of faces) { const k = clamp(un * 1.9 - f.i * 0.13 - 0.05), e = back(k), g = f.g; g.position.set(f.s * lerp(0.0, f.x, e), lerp(1.6, f.y, e), -0.012 - f.i * 0.003); g.rotation.z = f.s * lerp(0, f.rot, e) * D; g.scale.set(f.s * f.sc, f.sc, 1);
      const m = f.m.material.uniforms; m.uOp.value = sstep(0.02, 0.3, k); m.uSide.value = f.s; m.uXf.value.set(Math.abs(g.position.x), g.position.y, f.rot * D * e, f.sc); }
    const eo = sstep(0.55, 0.95, S.vir); eyes[0].uAmt.value = eo * (1.8 + S.fire * 0.8 + Math.sin(t * 2.3) * 0.2); eyes[1].uAmt.value = eo * (1.7 + S.fire * 0.8 + Math.sin(t * 1.9 + 1) * 0.2); if (S.fire > 0.01) eyes[1].uCol.value.set(lerp(0.75, 1.0, S.fire), lerp(0.85, 0.5, S.fire), lerp(1.1, 0.2, S.fire));
    const mu = mouth.userData.u; mu.uAmt.value = S.mouth * 1.5; mouth.scale.setScalar(0.3 + S.mouth * 0.42); mouth.visible = S.mouth > 0.001;
  }
  return { build, MOUTH, root };
})();
