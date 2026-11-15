'use strict';
// ---- the cast: Krishna, Arjuna, the chariot, four white horses. Jointed figures made like jewels (40_puppet.js) -------
//   Cast.build(scene, prog, tick)
//   Cast.FLOOR                 height of the chariot's floor            Cast.KX, Cast.AX   where the two men stand (x)
//   Cast.krishnaHeart(out)     world point the column of light stands on
// Convention: every figure is drawn FACING +X (profile head and limbs, frontal chest, as shadow puppets are cut); facing
// the other way is root.scale.x = -1, and a turn is the puppeteer's flip through the edge of the sheet.
// Joints are rotations about Z in degrees; limbs hang down -Y from their pivots, so +angle swings a limb toward the face.
// Motion is a pure function of film time: named poses blended by keyed weights (update, at the bottom).
// Drawing rules: Pup.INK lines are gold wire; KOHL is the painted dark of eyes and hair; small RED/GREEN/BLUE/PEARL discs
// are set stones; fills are enamel, graded so each cell pools darker at its rim.
// The flat first version of this cast is kept at wip/45_cast_v1_flat.js.
const Cast = (() => {
  const { INK, KOHL, GOLD, RED, GREEN, BLUE, PEARL, CREAM, sp, fs, line, disc, gem, beads, punch, row, limb, band, lotus, brocade, grad, lgrad } = Pup;
  const FLOOR = 1.02, PPM = 800, KX = 0.66, AX = -0.82, D = DEG, SC = 1.17, ALTA = '#d4203a', MAG = '#ff3f8e', TEAL = '#12b5b0', SAF = '#ff9a1f';
  const uM = { uLit: { value: new THREE.Vector3(1, 1, 1) } }, uK = { uLit: uM.uLit, uKG: { value: 0 } };
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const flower = (c, x, y, r, col, mid = '#ffd75a') => { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; ell(c, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.34, a); fs(c, col, 0.0022); } ell(c, x, y, r * 0.3, r * 0.3); fs(c, mid, 0); };
  const buti = (c, x, y, r, col = GOLD) => { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.785; ell(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.62, r * 0.36, a); fs(c, col, 0); } ell(c, x, y, r * 0.42, r * 0.42); fs(c, col, 0); };
  const tassel = (c, x, y, l, col = MAG) => { if (l <= 0) return; line(c, [[x, y], [x, y - l * 0.3]], 0.004, GOLD); gem(c, x, y - l * 0.36, l * 0.13, PEARL, false); sp(c, [[x - l * 0.12, y - l * 0.45, 1], [x - l * 0.2, y - l, 1], [x + l * 0.2, y - l, 1], [x + l * 0.12, y - l * 0.45, 1]]); fs(c, col, 0.003); for (let i = -1; i <= 1; i++) line(c, [[x + i * l * 0.07, y - l * 0.5], [x + i * l * 0.12, y - l * 0.97]], 0.002, GOLD); };

  // ---------- the human figure ----------
  function feather(c, x, y, ang, len) {
    c.save(); c.translate(x, y); c.rotate(ang); line(c, [[0, 0], [0.01, len * 0.5], [0, len]], 0.005, '#f5c542');
    c.translate(0, len + 0.05); for (let i = -11; i <= 11; i++) { const a = i * 0.135, r0 = 0.03, r1 = 0.088 - Math.abs(i) * 0.0012; line(c, [[Math.sin(a) * r0 * 0.7, Math.cos(a) * r0 - 0.012], [Math.sin(a * 1.05) * r1 * 0.72, Math.cos(a) * r1 - 0.012]], 0.0032, i % 2 ? '#0fa86a' : '#19c2b0'); }
    for (let i = 0; i < 7; i++) line(c, [[(i % 2 ? 1 : -1) * 0.004, -0.05 - i * 0.022], [(i % 2 ? 1 : -1) * (0.03 - i * 0.002), -0.035 - i * 0.022]], 0.0026, '#12a070');
    ell(c, 0, 0, 0.046, 0.066); fs(c, grad(c, 0, 0, 0.066, '#3fe08a', '#0b8a52'), 0.004); ell(c, 0, -0.004, 0.034, 0.05); fs(c, grad(c, 0, 0, 0.05, '#ffd75a', '#c98a08'), 0); ell(c, 0, -0.008, 0.024, 0.036); fs(c, grad(c, 0, -0.008, 0.036, '#59f0ff', '#0d93c9'), 0);
    sp(c, [[0, 0.012, 1], [0.014, -0.006], [0.01, -0.026], [0, -0.03], [-0.01, -0.026], [-0.014, -0.006]]); fs(c, '#16226e', 0); c.restore();
  }
  const PROFILE = [[0.048, -0.06, 1], [0.050, 0.045], [0.066, 0.062], [0.098, 0.070], [0.108, 0.086], [0.104, 0.099], [0.117, 0.108], [0.106, 0.1175, 1], [0.119, 0.127], [0.113, 0.139, 1], [0.150, 0.147], [0.152, 0.158], [0.132, 0.19], [0.119, 0.222], [0.118, 0.262], [0.103, 0.300],
    [0.02, 0.338], [-0.072, 0.312], [-0.114, 0.24], [-0.108, 0.16], [-0.068, 0.088], [-0.05, 0.04], [-0.05, -0.06, 1]];
  function drawHead(c, o) {
    const K = o.who === 'K';
    if (K) { for (const [r, lw] of [[0.262, 0.012], [0.238, 0.005]]) { c.beginPath(); c.arc(0.0, 0.2, r, 0, TAU); c.lineWidth = lw; c.strokeStyle = GOLD; c.stroke(); }                 // a nimbus: fine gold, flame-tipped, pearled
      for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; gem(c, Math.cos(a) * 0.25, 0.2 + Math.sin(a) * 0.25, 0.0052, i % 7 ? PEARL : RED, false); if (i % 2 === 0) { sp(c, [[Math.cos(a - 0.05) * 0.268, 0.2 + Math.sin(a - 0.05) * 0.268, 1], [Math.cos(a) * 0.298, 0.2 + Math.sin(a) * 0.298, 1], [Math.cos(a + 0.05) * 0.268, 0.2 + Math.sin(a + 0.05) * 0.268, 1]]); fs(c, GOLD, 0); } } }
    // hair behind the neck: three falling locks
    sp(c, [[-0.03, 0.31], [-0.10, 0.27], [-0.135, 0.17], [-0.15, 0.06], [-0.175, -0.02], [-0.165, -0.085], [-0.13, -0.10, 1], [-0.135, -0.05], [-0.105, -0.095, 1], [-0.10, -0.03], [-0.07, -0.07, 1], [-0.06, 0.03], [-0.04, 0.12]]); fs(c, grad(c, -0.09, 0.12, 0.26, '#2c2350', '#0b0914'), 0.005);
    // the face and neck
    sp(c, PROFILE); fs(c, grad(c, 0.03, 0.17, 0.2, o.skinA, o.skinB, 0.06, 0.2), 0.007);
    { const g = c.$c.createRadialGradient(0.066, 0.135, 0.002, 0.066, 0.135, 0.04); g.addColorStop(0, K ? 'rgba(170,120,255,.45)' : 'rgba(255,90,80,.42)'); g.addColorStop(1, 'rgba(255,90,80,0)'); c.$c.fillStyle = g; c.$c.beginPath(); c.$c.arc(0.066, 0.135, 0.04, 0, TAU); c.$c.fill(); }   // the bloom of the cheek
    line(c, [[0.062, 0.058], [0.03, 0.085], [0.004, 0.135]], 0.0035, o.skinL); for (let i = 0; i < 2; i++) line(c, [[0.044, 0.02 - i * 0.03], [0.0, 0.012 - i * 0.03], [-0.044, 0.02 - i * 0.03]], 0.003, o.skinL);
    // hair over the skull, a curl at the temple
    sp(c, [[0.100, 0.304], [0.062, 0.268], [0.03, 0.228], [0.022, 0.19], [0.034, 0.162, 1], [0.004, 0.172], [-0.03, 0.14], [-0.058, 0.07], [-0.072, 0.03, 1], [-0.11, 0.1], [-0.128, 0.2], [-0.12, 0.27], [-0.075, 0.324], [0.02, 0.348]]); fs(c, grad(c, -0.04, 0.26, 0.2, '#3a2f66', '#0b0914', 0.0, 0.32), 0.005);
    for (let i = 0; i < 6; i++) line(c, [[0.06 - i * 0.03, 0.295 + (i < 3 ? i : 4 - i) * 0.006], [0.0 - i * 0.022, 0.21 - i * 0.012], [-0.05 - i * 0.012, 0.11 - i * 0.004]], 0.0028, '#6a5aa6');
    c.beginPath(); c.arc(0.036, 0.176, 0.013, 0.2, 5.2); c.lineWidth = 0.005; c.strokeStyle = KOHL; c.stroke();
    // the ear, its great ring and pearl drop
    ell(c, -0.004, 0.19, 0.017, 0.031, 0.15); fs(c, o.skinA, 0.005); line(c, [[-0.002, 0.205], [-0.01, 0.19], [-0.002, 0.176]], 0.003, o.skinL);
    line(c, [[-0.004, 0.166], [-0.008, 0.146]], 0.006, GOLD); ell(c, -0.008, 0.112, 0.036, 0.036); fs(c, GOLD, 0.006); gem(c, -0.008, 0.112, 0.016, o.gem); for (let i = 0; i < 8; i++) gem(c, -0.008 + Math.cos(i * TAU / 8) * 0.0265, 0.112 + Math.sin(i * TAU / 8) * 0.0265, 0.0048, PEARL, false);
    line(c, [[-0.008, 0.076], [-0.008, 0.06]], 0.004, GOLD); gem(c, -0.008, 0.048, 0.011, PEARL);
    // the long eye
    c.save(); c.beginPath(); c.moveTo(0.113, 0.203); c.quadraticCurveTo(0.082, 0.236, 0.03, 0.214); c.quadraticCurveTo(0.074, 0.19, 0.113, 0.203); c.closePath(); fs(c, '#fffdf4', 0); c.clip();
    ell(c, 0.087, 0.2105, 0.0135, 0.0135); fs(c, grad(c, 0.087, 0.2105, 0.0135, K ? '#3b2a12' : '#5a3410', '#120804'), 0); ell(c, 0.088, 0.2105, 0.0062, 0.0062); fs(c, '#050302', 0); ell(c, 0.0915, 0.215, 0.003, 0.003); fs(c, '#ffffff', 0); c.restore();
    c.beginPath(); c.moveTo(0.114, 0.2025); c.quadraticCurveTo(0.082, 0.238, 0.03, 0.2145); c.lineTo(0.006, 0.229); c.lineWidth = 0.0085; c.strokeStyle = KOHL; c.stroke();
    c.beginPath(); c.moveTo(0.113, 0.203); c.quadraticCurveTo(0.074, 0.189, 0.03, 0.2145); c.lineWidth = 0.004; c.strokeStyle = KOHL; c.stroke();
    line(c, [[0.121, 0.238], [0.094, 0.257], [0.052, 0.259], [0.012, 0.243]], 0.0078, KOHL); line(c, [[0.128, 0.146], [0.121, 0.151], [0.123, 0.159]], 0.0035, o.skinL);
    // the mouth: a small smile
    sp(c, [[0.094, 0.1165], [0.108, 0.1275], [0.1195, 0.1265], [0.112, 0.1175, 1], [0.1175, 0.108], [0.106, 0.1055]]); fs(c, '#d81e3a', 0); line(c, [[0.114, 0.1175], [0.096, 0.1152], [0.086, 0.1205]], 0.004, KOHL);
    if (!K) line(c, [[0.110, 0.132], [0.088, 0.13], [0.066, 0.113], [0.058, 0.118]], 0.0095, KOHL);                                             // the warrior's moustache
    if (K) { sp(c, [[0.111, 0.248, 1], [0.105, 0.29, 1], [0.118, 0.288, 1], [0.117, 0.248, 1]]); fs(c, '#ffe27a', 0); line(c, [[0.113, 0.252], [0.111, 0.284]], 0.0034, ALTA); } else gem(c, 0.108, 0.262, 0.0075, RED, false);
    // the crown
    c.save(); c.translate(0.008, 0.292); c.rotate(0.10);
    beads(c, [[-0.088, 0.03], [-0.118, -0.06], [-0.112, -0.17], [-0.098, -0.24]], 13, 0.0058, k => k % 4 === 3 ? o.gem : PEARL);
    sp(c, [[-0.095, 0.03, 1], [-0.15, 0.062], [-0.208, 0.165], [-0.214, 0.222, 1], [-0.166, 0.168], [-0.125, 0.106], [-0.09, 0.076, 1]]); fs(c, GOLD, 0.006); for (let i = 0; i < 4; i++) gem(c, lerp(-0.124, -0.19, i / 3), lerp(0.074, 0.172, i / 3), 0.008 - i * 0.001, i % 2 ? GREEN : RED, false);
    const tiers = K ? [[0.046, 0.096, 0.078, 0.06], [0.106, 0.078, 0.06, 0.054], [0.160, 0.06, 0.04, 0.05], [0.210, 0.04, 0.022, 0.044]] : [[0.046, 0.096, 0.076, 0.064], [0.110, 0.076, 0.052, 0.058], [0.168, 0.052, 0.028, 0.052]];
    tiers.forEach(([y, wb, wt, h], i) => { sp(c, [[-wb, y, 1], [-wb * 1.12, y + h * 0.3], [-wt, y + h, 1], [wt, y + h, 1], [wb * 1.12, y + h * 0.3], [wb, y, 1]]); fs(c, i % 2 ? grad(c, 0, y + h * 0.5, wb * 1.2, K ? '#ff5a6a' : '#3fe08a', K ? '#9a0a22' : '#0a7a48') : GOLD, 0.006);
      const n = 5 - i; for (let k = 0; k < n; k++) gem(c, n > 1 ? lerp(-wb * 0.7, wb * 0.7, k / (n - 1)) : 0, y + h * 0.52, 0.0085 - i * 0.0008, i % 2 ? PEARL : [RED, GREEN, BLUE][k % 3], false); beads(c, [[-wb * 1.02, y + 0.005], [wb * 1.02, y + 0.005]], 9 - i, 0.0042); });
    const ty = tiers[tiers.length - 1][0] + tiers[tiers.length - 1][3]; ell(c, 0, ty + 0.012, 0.03, 0.012); fs(c, GOLD, 0.005); ell(c, 0, ty + 0.036, 0.021, 0.021); fs(c, GOLD, 0.005); gem(c, 0, ty + 0.036, 0.01, o.gem, false); sp(c, [[-0.011, ty + 0.054, 1], [0, ty + 0.105, 1], [0.011, ty + 0.054, 1]]); fs(c, GOLD, 0.004);
    sp(c, [[-0.064, 0.046, 1], [-0.072, 0.11], [-0.03, 0.15], [0, 0.2, 1], [0.03, 0.15], [0.072, 0.11], [0.064, 0.046, 1]]); fs(c, grad(c, 0, 0.1, 0.1, K ? '#3aa0ff' : '#ff5a6a', K ? '#0a2a9a' : '#8a0a20'), 0.006);                         // the crest plaque
    gem(c, 0, 0.1, 0.021, K ? RED : GREEN); for (const [x, y] of [[-0.036, 0.085], [0.036, 0.085], [0, 0.152]]) gem(c, x, y, 0.008, PEARL, false);
    c.beginPath(); c.rect(-0.109, 0, 0.218, 0.046); fs(c, GOLD, 0.006); for (let i = 0; i < 5; i++) gem(c, -0.078 + i * 0.039, 0.023, 0.012, [RED, GREEN, BLUE, GREEN, RED][i]); for (let i = 0; i < 4; i++) gem(c, -0.0585 + i * 0.039, 0.023, 0.0045, PEARL, false);
    beads(c, [[-0.106, 0.051], [0.106, 0.051]], 15, 0.0046); line(c, [[0.106, 0.002], [0.112, -0.022]], 0.003, GOLD); gem(c, 0.113, -0.03, 0.0075, PEARL, false);
    c.restore();
    if (K) { feather(c, 0.04, 0.52, -0.34, 0.15); feather(c, 0.02, 0.535, 0.03, 0.2); feather(c, 0.0, 0.52, 0.42, 0.15); }
    else { for (const [a, l, col] of [[-0.5, 0.17, SAF], [-0.18, 0.22, ALTA], [0.16, 0.2, MAG], [0.5, 0.15, SAF]]) { c.save(); c.translate(0.0, 0.5); c.rotate(-a); sp(c, [[-0.006, 0, 1], [-0.03, l * 0.5], [-0.012, l * 0.86], [0.008, l, 1], [0.03, l * 0.55], [0.008, 0, 1]]); fs(c, grad(c, 0, l * 0.5, l * 0.6, '#ffd75a', col), 0.004); line(c, [[0, 0.01], [0.004, l * 0.9]], 0.0025, GOLD); c.restore(); } }   // plumes
  }
  const TORSO = [[-0.115, -0.04, 1], [-0.122, 0.08], [-0.142, 0.2], [-0.188, 0.34], [-0.228, 0.43], [-0.2, 0.478], [-0.1, 0.497], [-0.052, 0.515], [0.052, 0.515], [0.1, 0.497], [0.2, 0.478], [0.228, 0.43], [0.188, 0.34], [0.142, 0.2], [0.122, 0.08], [0.115, -0.04, 1]];
  function drawTorso(c, o) {
    const K = o.who === 'K';
    if (K) {
      sp(c, TORSO); fs(c, grad(c, 0, 0.26, 0.34, o.skinA, o.skinB, 0.04, 0.33), 0.008);
      line(c, [[-0.14, 0.34], [-0.075, 0.305], [-0.012, 0.33]], 0.004, o.skinL); line(c, [[0.14, 0.34], [0.075, 0.305], [0.012, 0.33]], 0.004, o.skinL); line(c, [[0, 0.3], [0.002, 0.11]], 0.003, o.skinL); for (const y of [0.2, 0.14]) { line(c, [[-0.06, y], [-0.03, y - 0.012], [0, y - 0.004]], 0.003, o.skinL); line(c, [[0.06, y], [0.03, y - 0.012], [0, y - 0.004]], 0.003, o.skinL); }
      ell(c, 0, 0.078, 0.006, 0.009); fs(c, o.skinL, 0);
      // the forest garland: leaves and five colours of blossom
      const gp = [[-0.18, 0.47], [-0.205, 0.22], [-0.15, -0.1], [0, -0.255], [0.15, -0.1], [0.205, 0.22], [0.18, 0.47]]; sp(c, gp, false); c.lineWidth = 0.05; c.strokeStyle = INK; c.stroke(); c.lineWidth = 0.042; c.strokeStyle = '#0c8a4a'; c.stroke();
      const cols = [MAG, '#fff3d0', SAF, '#ffd23a', '#c86bff']; let k = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++, k++) { const u = (j + 0.5) / 5, x = lerp(gp[i][0], gp[i + 1][0], u), y = lerp(gp[i][1], gp[i + 1][1], u) + ((i === 2 || i === 3) ? -0.014 * Math.sin(u * Math.PI) : 0); flower(c, x, y, 0.017, cols[k % 5]); }
      beads(c, [[-0.165, 0.47], [-0.03, 0.26], [0.1, 0.0]], 26, 0.0042);                                                                              // the sacred thread, of seed pearls
    } else {
      sp(c, TORSO); fs(c, grad(c, 0, 0.26, 0.36, '#ff5266', '#8a0c22', 0.03, 0.34), 0.008);                                                         // a coat of ruby scales
      c.save(); sp(c, TORSO); c.clip(); for (let r = 0; r < 11; r++) for (let i = -5; i <= 5; i++) { const x = i * 0.048 + (r % 2) * 0.024, y = -0.03 + r * 0.05; c.beginPath(); c.arc(x, y + 0.03, 0.026, Math.PI, TAU); c.lineWidth = 0.0045; c.strokeStyle = GOLD; c.stroke(); gem(c, x, y + 0.016, 0.0036, PEARL, false); }
      c.restore(); sp(c, TORSO); fs(c, null, 0.008);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; sp(c, [[Math.cos(a - 0.11) * 0.058, 0.3 + Math.sin(a - 0.11) * 0.058, 1], [Math.cos(a) * 0.096, 0.3 + Math.sin(a) * 0.096, 1], [Math.cos(a + 0.11) * 0.058, 0.3 + Math.sin(a + 0.11) * 0.058, 1]]); fs(c, GOLD, 0.003); }
      ell(c, 0, 0.3, 0.06, 0.06); fs(c, GOLD, 0.006); gem(c, 0, 0.3, 0.03, RED); for (let i = 0; i < 10; i++) gem(c, Math.cos(i * TAU / 10) * 0.046, 0.3 + Math.sin(i * TAU / 10) * 0.046, 0.0055, PEARL, false);
      for (const s of [-1, 1]) { sp(c, [[s * 0.105, 0.497, 1], [s * 0.2, 0.484], [s * 0.24, 0.43], [s * 0.214, 0.378], [s * 0.15, 0.415], [s * 0.1, 0.45, 1]]); fs(c, GOLD, 0.006); for (let i = 0; i < 3; i++) gem(c, s * lerp(0.13, 0.208, i / 2), lerp(0.462, 0.428, i / 2), 0.009, [GREEN, RED, BLUE][i]); beads(c, [[s * 0.108, 0.447], [s * 0.15, 0.412], [s * 0.212, 0.375]], 7, 0.0046); }
      line(c, [[-0.118, 0.02], [0.118, 0.02]], 0.022, GOLD); for (let i = 0; i < 5; i++) gem(c, -0.08 + i * 0.04, 0.02, 0.0075, i % 2 ? GREEN : BLUE, false);
    }
    // necklaces: a jewelled collar, two strings of pearls, a long chain and its great stone
    for (const [r, w] of [[0.086, 0.03]]) { c.beginPath(); c.ellipse(0, 0.522, r, r * 1.05, 0, Math.PI * 1.08, Math.PI * 1.92); c.lineWidth = w + 0.01; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = GOLD; c.stroke();
      for (let i = 0; i < 7; i++) { const a = Math.PI * (1.14 + i * 0.12); gem(c, Math.cos(a) * r, 0.522 + Math.sin(a) * r * 1.05, 0.0085, [RED, GREEN, BLUE][i % 3], false); gem(c, Math.cos(a) * (r + 0.026), 0.522 + Math.sin(a) * (r + 0.026) * 1.05 - 0.004, 0.0052, PEARL, false); } }
    for (const [r, n] of [[0.132, 21], [0.158, 25]]) { const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.1 + i * 0.8 / 12); pts.push([Math.cos(a) * r, 0.53 + Math.sin(a) * r * 1.12]); } beads(c, pts, n, r > 0.14 ? 0.0052 : 0.0046, k => r > 0.14 && k % 6 === 3 ? (K ? RED : GREEN) : PEARL); }
    if (K) { line(c, [[-0.1, 0.47], [-0.06, 0.39], [0, 0.352], [0.06, 0.39], [0.1, 0.47]], 0.005, GOLD); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; sp(c, [[Math.cos(a - 0.2) * 0.026, 0.335 + Math.sin(a - 0.2) * 0.026, 1], [Math.cos(a) * 0.042, 0.335 + Math.sin(a) * 0.042, 1], [Math.cos(a + 0.2) * 0.026, 0.335 + Math.sin(a + 0.2) * 0.026, 1]]); fs(c, GOLD, 0); } ell(c, 0, 0.335, 0.028, 0.028); fs(c, GOLD, 0.005); gem(c, 0, 0.335, 0.019, RED); }
    if (K) { line(c, [[-0.125, 0.105], [0, 0.092], [0.125, 0.105]], 0.014, GOLD); for (let i = 0; i < 7; i++) gem(c, -0.096 + i * 0.032, 0.098, 0.0052, i % 2 ? RED : PEARL, false); }
  }
  function drawUpper(c, o) { limb(c, 0.30, 0.054, 0.038); fs(c, lgrad(c, -0.056, 0, 0.056, 0, [o.skinB, o.skinA, o.skinA, o.skinB]), 0.007);
    c.beginPath(); c.rect(-0.052, -0.134, 0.104, 0.04); fs(c, GOLD, 0.005); sp(c, [[-0.036, -0.094, 1], [-0.02, -0.062], [0, -0.03, 1], [0.02, -0.062], [0.036, -0.094, 1]]); fs(c, GOLD, 0.005); gem(c, 0, -0.072, 0.0105, o.gem); for (let i = 0; i < 3; i++) gem(c, -0.03 + i * 0.03, -0.114, 0.0085, [GREEN, RED, BLUE][i], false);
    for (let i = 0; i < 3; i++) { const x = -0.03 + i * 0.03; line(c, [[x, -0.134], [x, -0.15]], 0.003, GOLD); gem(c, x, -0.157, 0.006, PEARL, false); } beads(c, [[-0.05, -0.139], [0.05, -0.139]], 9, 0.0036); }
  function drawFore(c, o) {
    for (let i = 0; i < 4; i++) { const x = -0.0275 + i * 0.0183, l = [0.066, 0.084, 0.079, 0.06][i]; c.save(); c.translate(x, -0.332); c.rotate((i - 1.5) * 0.045); sp(c, [[-0.0092, 0.004, 1], [-0.0088, -l * 0.6], [-0.005, -l * 0.94], [0, -l, 1], [0.005, -l * 0.94], [0.0088, -l * 0.6], [0.0092, 0.004, 1]]); fs(c, o.skinA, 0.0045); ell(c, 0, -l * 0.86, 0.0052, 0.0095); fs(c, ALTA, 0); c.restore(); }
    c.save(); c.translate(0.03, -0.283); c.rotate(0.66); sp(c, [[-0.011, 0.004, 1], [-0.01, -0.04], [0, -0.066, 1], [0.01, -0.04], [0.011, 0.004, 1]]); fs(c, o.skinA, 0.0045); ell(c, 0, -0.054, 0.005, 0.009); fs(c, ALTA, 0); c.restore();
    ell(c, 0, -0.306, 0.038, 0.046); fs(c, grad(c, 0, -0.306, 0.046, o.skinA, o.skinB), 0.006); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(c, Math.cos(a) * 0.011, -0.312 + Math.sin(a) * 0.011, 0.0075, 0.0042, a); fs(c, ALTA, 0); } ell(c, 0, -0.312, 0.0045, 0.0045); fs(c, '#ffd75a', 0);
    limb(c, 0.262, 0.04, 0.028); fs(c, lgrad(c, -0.04, 0, 0.04, 0, [o.skinB, o.skinA, o.skinA, o.skinB]), 0.007);
    band(c, -0.2, 0.037, 0.02, GOLD, 0); beads(c, [[-0.036, -0.2], [0.036, -0.2]], 7, 0.0042); band(c, -0.228, 0.035, 0.026, GOLD, 3); beads(c, [[-0.033, -0.25], [0.033, -0.25]], 6, 0.005, k => k % 2 ? o.gem : PEARL); band(c, -0.27, 0.031, 0.014, GOLD, 0);
  }
  function drawHip(c, o) {
    const P = o.pleat, fan = [[-0.05, -0.02, 1], [-0.088, -0.3], [-0.12, P, 1], [-0.08, P + 0.032, 1], [-0.04, P - 0.012, 1], [0, P + 0.032, 1], [0.04, P - 0.012, 1], [0.08, P + 0.032, 1], [0.12, P, 1], [0.088, -0.3], [0.05, -0.02, 1]];
    sp(c, fan); fs(c, lgrad(c, -0.12, 0, 0.12, 0, [o.clothB, o.clothA, o.clothB, o.clothA, o.clothB]), 0.007);
    for (let i = -2; i <= 2; i++) line(c, [[i * 0.018, -0.03], [i * 0.042, P + 0.04]], 0.003, o.clothL); line(c, [[-0.112, P + 0.052], [-0.06, P + 0.085], [-0.03, P + 0.04], [0, P + 0.085], [0.03, P + 0.04], [0.06, P + 0.085], [0.112, P + 0.052]], 0.013, o.edge); line(c, [[-0.108, P + 0.082], [0, P + 0.11], [0.108, P + 0.082]], 0.004, GOLD);
    const skirt = [[-0.126, 0.035, 1], [0.126, 0.035, 1], [0.166, -0.1], [0.188, -0.235, 1], [0.13, -0.205], [0.09, -0.19], [0.045, -0.215], [0, -0.2], [-0.045, -0.215], [-0.09, -0.19], [-0.13, -0.205], [-0.188, -0.235, 1], [-0.166, -0.1]];
    sp(c, skirt); fs(c, grad(c, 0, -0.06, 0.24, o.clothA, o.clothB), 0.008); sp(c, skirt); brocade(c, -0.17, -0.17, 0.17, 0.0, 0.04, (x, y) => buti(c, x, y, 0.0065, o.buti));
    const hem = [[-0.178, -0.205], [-0.13, -0.178], [-0.09, -0.163], [-0.045, -0.188], [0, -0.173], [0.045, -0.188], [0.09, -0.163], [0.13, -0.178], [0.178, -0.205]]; line(c, hem, 0.017, o.edge); beads(c, hem, 22, 0.0038);
    c.beginPath(); c.rect(-0.134, -0.014, 0.268, 0.054); fs(c, GOLD, 0.006); for (let i = 0; i < 6; i++) gem(c, -0.1 + i * 0.04, 0.013, 0.012, [RED, GREEN, BLUE][i % 3]); beads(c, [[-0.13, 0.036], [0.13, 0.036]], 17, 0.004);
    for (let i = 0; i < 5; i++) { const x = -0.1 + i * 0.05, pts = []; for (let k = 0; k <= 6; k++) { const a = Math.PI + k / 6 * Math.PI; pts.push([x + Math.cos(a) * 0.025, -0.016 + Math.sin(a) * 0.034]); } beads(c, pts, 7, 0.0036); if (i < 4) { line(c, [[x + 0.025, -0.014], [x + 0.025, -0.05]], 0.003, GOLD); gem(c, x + 0.025, -0.058, 0.0068, i % 2 ? o.gem : RED, false); } }
    ell(c, 0, 0.013, 0.03, 0.03); fs(c, GOLD, 0.005); gem(c, 0, 0.013, 0.018, o.gem);
    for (const s of [-1, 1]) { sp(c, [[s * 0.12, 0.012, 1], [s * 0.205, -0.02], [s * 0.24, -0.13], [s * 0.262, -0.27, 1], [s * 0.21, -0.25], [s * 0.192, -0.14], [s * 0.14, -0.05, 1]]); fs(c, lgrad(c, s * 0.13, 0, s * 0.26, -0.26, [o.sashA, o.sashB]), 0.006); for (let i = 0; i < 4; i++) line(c, [[s * (0.168 + i * 0.016), -0.06 - i * 0.045], [s * (0.212 + i * 0.01), -0.075 - i * 0.045]], 0.004, GOLD); tassel(c, s * 0.236, -0.262, 0.07, o.sashA); }
  }
  function drawThigh(c, o) { limb(c, 0.44, 0.088, 0.062); fs(c, lgrad(c, -0.09, 0, 0.09, 0, [o.clothB, o.clothA, o.clothA, o.clothB]), 0.007); limb(c, 0.44, 0.088, 0.062); brocade(c, -0.09, -0.46, 0.09, 0.02, 0.042, (x, y) => buti(c, x, y, 0.0065, o.buti)); for (let i = 0; i < 4; i++) line(c, [[-0.085 + i * 0.006, -0.06 - i * 0.1], [0.0, -0.1 - i * 0.1], [0.085 - i * 0.006, -0.07 - i * 0.1]], 0.0028, o.clothL); }
  function drawShin(c, o) {
    sp(c, [[-0.04, -0.40, 1], [-0.054, -0.45], [-0.032, -0.484, 1], [0.15, -0.484, 1], [0.18, -0.47], [0.132, -0.444], [0.046, -0.40, 1]]); fs(c, grad(c, 0.04, -0.44, 0.16, o.skinA, o.skinB), 0.006); line(c, [[-0.03, -0.478], [0.165, -0.478]], 0.007, ALTA); for (let i = 0; i < 4; i++) line(c, [[0.11 + i * 0.017, -0.452 - i * 0.004], [0.118 + i * 0.017, -0.47]], 0.002, o.skinL); gem(c, 0.142, -0.458, 0.0045, GREEN, false);
    limb(c, 0.42, 0.06, 0.04); fs(c, lgrad(c, -0.06, 0, 0.06, 0, [o.skinB, o.skinA, o.skinB]), 0.007); band(c, -0.378, 0.046, 0.022, GOLD, 3); for (let i = 0; i < 4; i++) gem(c, -0.036 + i * 0.024, -0.398, 0.0062, PEARL, false);
    c.save(); c.beginPath(); c.rect(-0.2, -0.315, 0.4, 0.42); c.clip(); limb(c, 0.42, 0.064, 0.05); fs(c, lgrad(c, -0.066, 0, 0.066, 0, [o.clothB, o.clothA, o.clothA, o.clothB]), 0.007); limb(c, 0.42, 0.064, 0.05); brocade(c, -0.07, -0.26, 0.07, 0.02, 0.042, (x, y) => buti(c, x, y, 0.0062, o.buti)); c.restore();
    line(c, [[-0.058, -0.262], [0.058, -0.262]], 0.008, GOLD); line(c, [[-0.058, -0.288], [0.058, -0.288]], 0.03, o.edge); beads(c, [[-0.052, -0.288], [0.052, -0.288]], 6, 0.0055, k => k % 2 ? PEARL : GREEN); line(c, [[-0.056, -0.312], [0.056, -0.312]], 0.008, GOLD);
  }
  // a scarf that flies: drawn along +X from its knot; the material waves it by the wind phase
  function drawScarf(c, o) { const pts = [[0, 0.045, 1], [0.5, 0.062], [0.98, 0.05, 1], [0.9, 0.0], [0.98, -0.05, 1], [0.5, -0.062], [0, -0.045, 1]]; sp(c, pts); fs(c, lgrad(c, 0, 0, 1.0, 0, [o.sashA, o.sashB, o.sashA]), 0.006); line(c, [[0.02, 0.03], [0.5, 0.045], [0.93, 0.036]], 0.008, GOLD); line(c, [[0.02, -0.03], [0.5, -0.045], [0.93, -0.036]], 0.008, GOLD);
    for (let i = 0; i < 9; i++) buti(c, 0.1 + i * 0.095, 0, 0.011, GOLD); for (const y of [0.036, -0.036]) gem(c, 1.0, y, 0.01, PEARL); }
  // ---------- rig ----------
  // pose layout: 0 x, 1 y, 2 rot, 3 torso, 4 head, 5/6 leading arm (upper, fore), 7/8 trailing arm, 9/10 leading leg (thigh, shin), 11/12 trailing leg
  const KEYS = { x: 0, y: 1, rot: 2, torso: 3, head: 4, aF: 5, aB: 7, lF: 9, lB: 11 }, NP = 13;
  const pose = o => { const P = new Float32Array(NP); for (const k in o) { const i = KEYS[k]; if (i === undefined) throw new Error('pose key ' + k); if (Array.isArray(o[k])) { P[i] = o[k][0]; P[i + 1] = o[k][1]; } else P[i] = o[k]; } return P; };
  const mix = (out, list) => { out.fill(0); for (const [P, w] of list) if (w > 1e-5) for (let i = 0; i < NP; i++) out[i] += P[i] * w; return out; };
  function figure(o, U) {
    const P = (w, h, px, py, fn, x) => Pup.part(w, h, px, py, PPM, c => fn(c, o), U, x), root = new THREE.Group(), tg = new THREE.Group(), Z = 0.02;
    const leg = z => { const t = P(0.30, 0.62, 0.15, 0.52, drawThigh), s = P(0.44, 0.68, 0.14, 0.58, drawShin); s.position.set(0, -0.44, Z * 0.2); t.add(s); t.position.z = z; return [t, s]; };
    const arm = z => { const u = P(0.24, 0.48, 0.12, 0.40, drawUpper), f = P(0.26, 0.60, 0.13, 0.53, drawFore); f.position.set(0, -0.30, Z * 0.2); u.add(f); u.position.z = z; return [u, f]; };
    const lB = leg(-Z * 1.5), lF = leg(Z * 0.5), aB = arm(-Z), aF = arm(Z * 2);
    lB[0].position.x = -0.062; lF[0].position.x = 0.062; lB[0].position.y = lF[0].position.y = -0.03;
    const hip = P(0.64, 0.90, 0.32, 0.82, drawHip); hip.position.z = Z;
    const torso = P(0.60, 0.92, 0.30, 0.34, drawTorso), head = P(0.76, 1.16, 0.38, 0.14, drawHead); head.position.set(0, 0.50, Z * 1.5);
    aB[0].position.x = -0.2; aF[0].position.x = 0.2; aB[0].position.y = aF[0].position.y = 0.44;
    // two scarves streaming behind the shoulders
    const sU = Object.assign({}, U, { uWave: { value: 0.085 } }), scarves = [];
    for (const [x, y, rz, k] of [[-0.19, 0.45, 2.92, 1], [-0.16, 0.40, 3.32, 0.86]]) { const s = Pup.part(1.08, 0.3, 0.02, 0.15, 560, c => drawScarf(c, o), sU, { segX: 28, segY: 2 }); s.position.set(x, y, -Z * 2.2 - scarves.length * 0.008); s.rotation.z = rz; s.scale.setScalar(k); tg.add(s); scarves.push(s); }
    tg.add(aB[0], torso, head, aF[0]); root.add(lB[0], lF[0], hip, tg);
    const set = (p, flip = 1) => { root.position.x = o.x + p[0]; root.position.y = FLOOR + (0.93 + p[1]) * SC; root.rotation.z = p[2] * D; root.scale.set(SC * flip, SC, 1); tg.rotation.z = p[3] * D; head.rotation.z = p[4] * D;
      aF[0].rotation.z = p[5] * D; aF[1].rotation.z = p[6] * D; aB[0].rotation.z = p[7] * D; aB[1].rotation.z = p[8] * D; lF[0].rotation.z = p[9] * D; lF[1].rotation.z = p[10] * D; lB[0].rotation.z = p[11] * D; lB[1].rotation.z = p[12] * D; };
    return { root, tg, torso, head, hip, aF, aB, lF, lB, scarves, set };
  }
  // ---------- the chariot: a ratha with a jewelled hull, a pavilion on two pillars, a dome and its pennant ----------
  const CAR = [[-1.62, 0.93, 1], [-1.66, 1.5], [-1.74, 1.86], [-1.93, 2.06], [-1.9, 2.26], [-1.68, 2.2], [-1.5, 1.92], [-1.38, 1.66], [-0.6, 1.6], [0.4, 1.62], [0.95, 1.72], [1.28, 2.0], [1.46, 2.42], [1.66, 2.68], [1.93, 2.7], [2.0, 2.5], [1.84, 2.42], [1.72, 2.5], [1.62, 2.3], [1.56, 1.8], [1.48, 1.3], [1.4, 0.93, 1]];
  function drawCarFront(c) {
    sp(c, CAR); fs(c, lgrad(c, 0, 2.6, 0, 0.9, ['#ff4a4a', '#d81f2e', '#7d0b1c']), 0.014);
    c.save(); sp(c, CAR); c.clip();
    line(c, [[-1.7, 1.03], [1.5, 1.03]], 0.13, GOLD); line(c, [[-1.5, 1.52], [-0.6, 1.51], [0.4, 1.53], [0.95, 1.61], [1.22, 1.84]], 0.085, GOLD);
    // a frieze of cusped arches on peacock enamel, a lotus in each
    for (let i = 0; i < 6; i++) { const x = -1.33 + i * 0.5; sp(c, [[x - 0.2, 1.11, 1], [x - 0.2, 1.3], [x - 0.13, 1.36], [x - 0.09, 1.41], [x, 1.455, 1], [x + 0.09, 1.41], [x + 0.13, 1.36], [x + 0.2, 1.3], [x + 0.2, 1.11, 1]]); fs(c, grad(c, x, 1.27, 0.26, i % 2 ? '#35e0c8' : '#4aa8ff', i % 2 ? '#087a78' : '#0c2f9c'), 0.007);
      lotus(c, x, 1.27, 0.085, GOLD, i % 2 ? RED : GREEN); gem(c, x, 1.405, 0.014, PEARL); if (i < 5) { gem(c, x + 0.25, 1.39, 0.017, i % 2 ? BLUE : RED); gem(c, x + 0.25, 1.2, 0.012, PEARL); } }
    c.restore(); sp(c, CAR); fs(c, null, 0.014);
    for (let i = 0; i < 20; i++) gem(c, -1.5 + i * 0.152, 1.03, 0.022, [RED, GREEN, BLUE, PEARL][i % 4]); beads(c, [[-1.46, 1.52], [-0.6, 1.51], [0.4, 1.53], [0.95, 1.61], [1.2, 1.82]], 40, 0.012); beads(c, [[-1.6, 1.098], [1.44, 1.098]], 58, 0.0085);
    // the prow: a swan's neck, feathered, with a ruby eye
    for (let i = 0; i < 7; i++) { const u = i / 6, x = lerp(1.36, 1.6, u), y = lerp(1.78, 2.36, u); sp(c, [[x - 0.06, y - 0.05, 1], [x + 0.0, y + 0.03], [x + 0.07, y + 0.07, 1], [x + 0.04, y - 0.02]]); fs(c, i % 2 ? GOLD : '#ffe27a', 0.004); }
    line(c, [[1.36, 1.9], [1.5, 2.3], [1.68, 2.56], [1.86, 2.58]], 0.03, GOLD); gem(c, 1.87, 2.575, 0.03, RED); sp(c, [[1.96, 2.56, 1], [2.1, 2.5, 1], [1.97, 2.47, 1]]); fs(c, GOLD, 0.006);
    line(c, [[-1.7, 1.8], [-1.86, 2.04], [-1.82, 2.2]], 0.04, GOLD); gem(c, -1.83, 2.16, 0.034, GREEN);
    for (let i = 0; i < 17; i++) { const x = -1.52 + i * 0.18; tassel(c, x, 0.935, 0.17, [MAG, SAF, TEAL][i % 3]); }
  }
  function drawCarBack(c) {
    c.beginPath(); c.rect(-1.55, 0.94, 2.95, 0.72); fs(c, lgrad(c, 0, 1.66, 0, 0.94, ['#6a1020', '#2e0610']), 0.01); c.beginPath(); c.rect(-1.6, 0.96, 3.05, 0.08); fs(c, '#7a3414', 0.008);
    line(c, [[1.35, 1.0], [2.6, 1.2], [4.2, 1.5]], 0.085); line(c, [[1.35, 1.0], [2.6, 1.2], [4.2, 1.5]], 0.06, GOLD); for (let i = 0; i < 9; i++) gem(c, 1.6 + i * 0.3, 1.04 + i * 0.054, 0.02, i % 2 ? RED : BLUE, false); ell(c, 4.23, 1.5, 0.075, 0.075); fs(c, GOLD, 0.008); gem(c, 4.23, 1.5, 0.04, GREEN);
  }
  function drawCanopy(c) {
    // two pillars: lotus foot, banded shaft, lotus capital
    for (const x of [-1.42, 1.2]) { c.beginPath(); c.rect(x - 0.045, 1.6, 0.09, 2.75); fs(c, GOLD, 0.008);
      for (let i = 0; i < 9; i++) { const y = 1.8 + i * 0.3; c.beginPath(); c.rect(x - 0.06, y - 0.03, 0.12, 0.06); fs(c, i % 2 ? grad(c, x, y, 0.07, '#ff5a6a', '#8a0a20') : grad(c, x, y, 0.07, '#35e0c8', '#087a78'), 0.005); gem(c, x, y, 0.016, PEARL, false); }
      for (const [y, s] of [[1.66, 1], [4.3, -1]]) { sp(c, [[x - 0.05, y - s * 0.06, 1], [x - 0.12, y - s * 0.02], [x - 0.15, y + s * 0.06, 1], [x + 0.15, y + s * 0.06, 1], [x + 0.12, y - s * 0.02], [x + 0.05, y - s * 0.06, 1]]); fs(c, GOLD, 0.007); } }
    // the eave: a long bowed roof-line, tiled in enamel, hung with pearls and bells
    const eave = [[-1.95, 4.3, 1], [-1.7, 4.44], [-0.9, 4.6], [-0.11, 4.66], [0.7, 4.6], [1.5, 4.44], [1.75, 4.3, 1], [1.62, 4.34], [0.7, 4.44], [-0.11, 4.48], [-0.9, 4.44], [-1.82, 4.34]]; sp(c, eave); fs(c, lgrad(c, -1.9, 0, 1.7, 0, ['#ff9a1f', '#ff3f8e', '#ff9a1f', '#ff3f8e', '#ff9a1f']), 0.011); beads(c, [[-1.82, 4.34], [-0.9, 4.44], [-0.11, 4.48], [0.7, 4.44], [1.62, 4.34]], 46, 0.012, k => k % 5 === 2 ? RED : PEARL);
    for (let i = 0; i < 8; i++) { const x0 = -1.72 + i * 0.418, pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([x0 + u * 0.418, 4.33 + (i < 4 ? i : 7 - i) * 0.03 - Math.sin(u * Math.PI) * 0.15]); } beads(c, pts, 15, 0.009, k => k === 7 ? GREEN : PEARL); tassel(c, x0 + 0.418, 4.34 + (i < 3 ? i + 1 : 7 - i) * 0.028, 0.2, i % 2 ? TEAL : MAG); } tassel(c, -1.74, 4.33, 0.2, SAF);
    // the dome: three diminishing storeys of petals, a ribbed crown, a finial; and the staff
    const tiersD = [[4.64, 1.25, 0.3, '#35e0c8', '#087a78'], [4.94, 0.95, 0.28, '#ff5a8e', '#a00a4a'], [5.22, 0.66, 0.26, '#4aa8ff', '#0c2f9c']];
    for (const [y, w, h, a, b] of tiersD) { sp(c, [[-0.11 - w, y, 1], [-0.11 - w * 0.98, y + h * 0.5], [-0.11 - w * 0.72, y + h, 1], [-0.11 + w * 0.72, y + h, 1], [-0.11 + w * 0.98, y + h * 0.5], [-0.11 + w, y, 1]]); fs(c, lgrad(c, 0, y + h, 0, y, [a, b]), 0.01);
      const n = Math.round(w * 9); for (let k = 0; k < n; k++) { const x = -0.11 + (k - (n - 1) / 2) * (w * 1.8 / n); sp(c, [[x - w * 0.8 / n, y + 0.02, 1], [x - w * 0.7 / n, y + h * 0.55], [x, y + h * 0.9, 1], [x + w * 0.7 / n, y + h * 0.55], [x + w * 0.8 / n, y + 0.02, 1]]); fs(c, GOLD, 0.005); gem(c, x, y + h * 0.42, 0.024, [RED, GREEN, BLUE][k % 3]); } beads(c, [[-0.11 - w, y + 0.012], [-0.11 + w, y + 0.012]], Math.round(w * 26), 0.011); }
    ell(c, -0.11, 5.6, 0.34, 0.15); fs(c, lgrad(c, -0.45, 0, 0.23, 0, ['#c98a08', '#ffe27a', '#c98a08']), 0.009); for (let i = -4; i <= 4; i++) line(c, [[-0.11 + i * 0.075, 5.47], [-0.11 + i * 0.07, 5.73]], 0.005, '#c98a08');
    sp(c, [[-0.24, 5.72, 1], [-0.2, 5.86], [-0.11, 5.92], [-0.02, 5.86], [0.02, 5.72, 1]]); fs(c, GOLD, 0.008); ell(c, -0.11, 6.03, 0.1, 0.1); fs(c, GOLD, 0.008); gem(c, -0.11, 6.03, 0.055, RED);
    c.beginPath(); c.rect(-0.135, 6.12, 0.05, 1.7); fs(c, lgrad(c, -0.135, 0, -0.085, 0, ['#c98a08', '#ffe27a', '#c98a08']), 0.006); for (let i = 0; i < 6; i++) gem(c, -0.11, 6.3 + i * 0.26, 0.02, i % 2 ? GREEN : RED, false); sp(c, [[-0.15, 7.82, 1], [-0.11, 8.06, 1], [-0.07, 7.82, 1]]); fs(c, GOLD, 0.006);
  }
  function drawWheel(c) {
    const R = 0.86; for (let i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * TAU); sp(c, [[-0.02, 0.15, 1], [-0.05, 0.3], [-0.022, 0.42], [-0.04, 0.56], [-0.02, 0.66], [-0.03, 0.74, 1], [0.03, 0.74, 1], [0.02, 0.66], [0.04, 0.56], [0.022, 0.42], [0.05, 0.3], [0.02, 0.15, 1]]); fs(c, i % 2 ? GOLD : grad(c, 0, 0.45, 0.32, '#ff5a6a', '#8a0a20'), 0.007); gem(c, 0, 0.3, 0.02, i % 2 ? RED : PEARL, false); gem(c, 0, 0.56, 0.016, i % 2 ? GREEN : BLUE, false); c.restore(); }
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.arc(0, 0, R - 0.13, 0, TAU, true); fs(c, lgrad(c, -R, R, R, -R, ['#ffe27a', '#c98a08', '#ffe27a']), 0.012);
    c.beginPath(); c.arc(0, 0, R - 0.065, 0, TAU); c.lineWidth = 0.05; c.strokeStyle = '#0a8a88'; c.stroke(); for (let i = 0; i < 32; i++) { const a = (i + 0.5) / 32 * TAU; gem(c, Math.cos(a) * (R - 0.065), Math.sin(a) * (R - 0.065), 0.017, i % 4 === 0 ? RED : PEARL, false); }
    ell(c, 0, 0, 0.19, 0.19); fs(c, GOLD, 0.01); lotus(c, 0, 0, 0.15, '#ff5a6a', RED); beads(c, Array.from({ length: 25 }, (_, i) => [Math.cos(i / 24 * TAU) * 0.17, Math.sin(i / 24 * TAU) * 0.17]), 24, 0.01);
  }
  function drawBanner(c) {
    sp(c, [[0, 0.6, 1], [1.5, 0.5], [2.35, 0.42, 1], [2.0, 0.0], [2.35, -0.42, 1], [1.5, -0.5], [0, -0.6, 1]]); fs(c, lgrad(c, 0, 0, 2.3, 0, ['#ffb21f', '#ff6a1a', '#ff3f6e']), 0.012);
    line(c, [[0.06, 0.52], [1.5, 0.43], [2.15, 0.37]], 0.06, '#0fa3a8'); line(c, [[0.06, -0.52], [1.5, -0.43], [2.15, -0.37]], 0.06, '#0fa3a8'); beads(c, [[0.08, 0.52], [1.5, 0.43], [2.12, 0.372]], 22, 0.016); beads(c, [[0.08, -0.52], [1.5, -0.43], [2.12, -0.372]], 22, 0.016);
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; sp(c, [[0.8 + Math.cos(a - 0.09) * 0.3, Math.sin(a - 0.09) * 0.3, 1], [0.8 + Math.cos(a) * 0.41, Math.sin(a) * 0.41, 1], [0.8 + Math.cos(a + 0.09) * 0.3, Math.sin(a + 0.09) * 0.3, 1]]); fs(c, GOLD, 0.005); } ell(c, 0.8, 0, 0.3, 0.3); fs(c, grad(c, 0.8, 0, 0.3, '#fff0a0', '#ffb81c'), 0.01);
    // the ape of the banner, leaping, mace on his shoulder
    sp(c, [[0.66, -0.17], [0.69, 0.0], [0.78, 0.1], [0.75, 0.2], [0.86, 0.21], [0.91, 0.1], [0.99, 0.02], [0.92, -0.05], [0.99, -0.17], [0.9, -0.15], [0.84, -0.06], [0.76, -0.18]]); fs(c, '#b0201c', 0.005); line(c, [[0.66, -0.12], [0.56, 0.0], [0.6, 0.13], [0.66, 0.1]], 0.014, '#b0201c'); line(c, [[0.88, 0.02], [1.03, 0.2]], 0.016, '#b0201c'); ell(c, 1.045, 0.218, 0.04, 0.04); fs(c, '#b0201c', 0); gem(c, 0.83, 0.17, 0.012, PEARL, false);
    for (const y of [0.3, -0.3]) for (let i = 0; i < 4; i++) buti(c, 1.36 + i * 0.17, y * (1 - i * 0.04), 0.03, GOLD); for (let i = 0; i < 5; i++) gem(c, 0.2, 0.36 - i * 0.18, 0.026, i % 2 ? GREEN : RED);
  }
  // ---------- the horse (origin: on the ground under the saddle; facing +X) ----------
  const HA = '#ffffff', HB = '#c3cde6', HL = '#93a2c6';
  const HBODY = [[0.98, 1.22], [0.93, 0.98], [0.62, 0.86], [0.1, 0.84], [-0.38, 0.9], [-0.66, 1.0], [-0.9, 0.98], [-1.1, 1.18], [-1.13, 1.42], [-0.98, 1.62], [-0.6, 1.69], [-0.2, 1.62], [0.1, 1.59], [0.45, 1.67], [0.8, 1.62], [1.0, 1.45]];
  function drawHorseBody(c) {
    sp(c, HBODY); fs(c, lgrad(c, 0, 1.7, 0, 0.84, [HA, HA, HB]), 0.012);
    line(c, [[-0.8, 1.52], [-1.0, 1.3], [-0.92, 1.06]], 0.006, HL); line(c, [[-0.62, 1.46], [-0.72, 1.24], [-0.6, 1.02]], 0.004, HL); line(c, [[0.7, 1.5], [0.86, 1.3], [0.8, 1.05]], 0.006, HL); line(c, [[0.52, 0.9], [0.3, 0.87], [0.0, 0.875]], 0.004, HL);
    // the caparison: a field of enamel, a border of stones, a hem of tassels
    const CL = [[-0.52, 1.71, 1], [0.32, 1.67, 1], [0.4, 1.3], [0.36, 1.02, 1], [0.24, 0.98], [0.12, 1.03], [0.0, 0.98], [-0.12, 1.03], [-0.24, 0.98], [-0.36, 1.03], [-0.46, 0.99, 1], [-0.56, 1.32]];
    sp(c, CL); fs(c, grad(c, -0.08, 1.38, 0.6, '#ff4a6e', '#8a0a2a'), 0.01); sp(c, CL); brocade(c, -0.5, 1.2, 0.36, 1.6, 0.085, (x, y) => buti(c, x, y, 0.014, GOLD));
    const hem = [[-0.47, 1.075], [-0.36, 1.115], [-0.24, 1.065], [-0.12, 1.115], [0, 1.065], [0.12, 1.115], [0.24, 1.065], [0.37, 1.1]];
    c.save(); sp(c, CL); c.clip(); line(c, hem, 0.085, '#0a8a88'); line(c, [[-0.56, 1.66], [0.34, 1.62]], 0.07, '#0a8a88'); c.restore(); sp(c, CL); fs(c, null, 0.01);
    beads(c, hem, 22, 0.013, k => k % 3 === 1 ? RED : PEARL); beads(c, [[-0.5, 1.662], [0.3, 1.626]], 20, 0.012, k => k % 4 === 1 ? GREEN : PEARL);
    lotus(c, -0.08, 1.37, 0.13, GOLD, GREEN); for (const x of [-0.36, 0.2]) lotus(c, x, 1.37, 0.07, GOLD, BLUE);
    for (let i = 0; i < 8; i++) tassel(c, -0.46 + i * 0.117, 1.0 + (i % 2 ? 0.03 : -0.015), 0.14, [MAG, SAF, TEAL][i % 3]);
    line(c, [[0.36, 1.6], [0.7, 1.2], [0.96, 1.12]], 0.06); line(c, [[0.36, 1.6], [0.7, 1.2], [0.96, 1.12]], 0.044, GOLD); for (let i = 0; i < 6; i++) { const x = 0.42 + i * 0.1, y = 1.53 - i * 0.082; gem(c, x, y, 0.016, i % 2 ? RED : BLUE, false); line(c, [[x, y - 0.03], [x, y - 0.065]], 0.004, GOLD); ell(c, x, y - 0.09, 0.028, 0.028); fs(c, GOLD, 0.005); }   // breast band and its bells
    line(c, [[-0.52, 1.55], [-0.9, 1.3], [-1.09, 1.32]], 0.03, GOLD); for (let i = 0; i < 5; i++) gem(c, -0.6 - i * 0.1, 1.5 - i * 0.05, 0.012, i % 2 ? RED : GREEN, false);
  }
  const NECK = [[0.40, 1.62], [0.56, 1.9], [0.74, 2.2], [0.94, 2.42], [1.08, 2.46], [1.2, 2.4], [1.3, 2.26], [1.44, 2.0], [1.56, 1.78], [1.585, 1.68], [1.54, 1.615], [1.46, 1.63], [1.36, 1.74], [1.25, 1.88], [1.17, 1.93], [1.1, 1.8], [1.07, 1.55], [1.0, 1.25], [0.8, 1.1], [0.5, 1.28]];
  function drawHorseNeck(c) {
    c.translate(-0.72, -1.42);
    for (let i = 0; i < 11; i++) { const u = i / 10, x = lerp(0.44, 1.0, u) - 0.02 - Math.sin(u * Math.PI) * 0.06, y = lerp(1.68, 2.44, u) + Math.sin(u * Math.PI) * 0.075; sp(c, [[x + 0.04, y - 0.07, 1], [x - 0.07, y - 0.03], [x - 0.17, y + 0.03], [x - 0.2, y + 0.13, 1], [x - 0.1, y + 0.09], [x - 0.02, y + 0.07], [x + 0.06, y + 0.02, 1]]); fs(c, lgrad(c, x + 0.04, y, x - 0.2, y + 0.1, ['#fff3c8', '#f5c542', '#e08a10']), 0.006); line(c, [[x + 0.02, y - 0.03], [x - 0.08, y + 0.02], [x - 0.16, y + 0.09]], 0.003, '#b86a0a'); }
    sp(c, [[1.0, 2.4, 1], [0.99, 2.52], [1.03, 2.62, 1], [1.09, 2.52], [1.11, 2.42, 1]]); fs(c, HA, 0.008); line(c, [[1.035, 2.44], [1.04, 2.56]], 0.004, '#f0a0b0');
    sp(c, NECK); fs(c, lgrad(c, 0.5, 2.3, 1.2, 1.3, [HA, HA, HB]), 0.012);
    line(c, [[1.14, 2.22], [1.22, 2.06], [1.2, 1.94]], 0.005, HL); line(c, [[0.74, 1.9], [0.9, 1.6], [0.86, 1.3]], 0.005, HL); ell(c, 1.5, 1.7, 0.07, 0.05, -0.5); fs(c, '#ffd0d8', 0);
    c.beginPath(); c.moveTo(1.32, 2.2); c.quadraticCurveTo(1.24, 2.28, 1.15, 2.2); c.quadraticCurveTo(1.24, 2.15, 1.32, 2.2); c.closePath(); fs(c, '#fffdf5', 0); ell(c, 1.245, 2.207, 0.03, 0.03); fs(c, grad(c, 1.245, 2.207, 0.03, '#5a3410', '#0a0503'), 0); ell(c, 1.255, 2.217, 0.007, 0.007); fs(c, '#ffffff', 0);
    c.beginPath(); c.moveTo(1.33, 2.195); c.quadraticCurveTo(1.24, 2.285, 1.14, 2.2); c.lineTo(1.1, 2.225); c.lineWidth = 0.011; c.strokeStyle = KOHL; c.stroke(); ell(c, 1.525, 1.715, 0.013, 0.02, -0.5); fs(c, KOHL, 0); line(c, [[1.455, 1.635], [1.52, 1.655], [1.56, 1.665]], 0.006, KOHL);
    // a jewelled bridle; a rosette at the cheek; a tall aigrette
    for (const pts of [[[1.09, 2.4], [1.2, 1.93]], [[1.3, 2.28], [1.15, 1.94]], [[1.44, 2.02], [1.31, 1.8]], [[1.2, 1.93], [1.44, 1.72]]]) { line(c, pts, 0.036); line(c, pts, 0.026, GOLD); beads(c, pts, Math.round(Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / 0.05), 0.009, k => k % 2 ? RED : PEARL); }
    ell(c, 1.2, 1.93, 0.05, 0.05); fs(c, GOLD, 0.007); gem(c, 1.2, 1.93, 0.028, GREEN); ell(c, 1.19, 2.33, 0.036, 0.036); fs(c, GOLD, 0.006); gem(c, 1.19, 2.33, 0.02, RED); line(c, [[1.24, 2.33], [1.3, 2.3]], 0.005, GOLD); gem(c, 1.31, 2.29, 0.014, PEARL);
    for (const [a, l, col] of [[-0.28, 0.4, MAG], [0.0, 0.5, SAF], [0.3, 0.38, MAG]]) { c.save(); c.translate(1.05, 2.44); c.rotate(-a + 0.2); sp(c, [[-0.012, 0, 1], [-0.06, l * 0.5], [-0.03, l * 0.86], [0.01, l, 1], [0.06, l * 0.55], [0.014, 0, 1]]); fs(c, grad(c, 0, l * 0.5, l * 0.6, '#ffe27a', col), 0.006); line(c, [[0, 0.02], [0.006, l * 0.9]], 0.004, GOLD); c.restore(); } ell(c, 1.05, 2.44, 0.035, 0.035); fs(c, GOLD, 0.006); gem(c, 1.05, 2.44, 0.018, BLUE);
    for (const k of [0, 1]) { const pts = [[0.5, 1.52 - k * 0.1], [0.84, 1.3 - k * 0.09], [1.04, 1.44 - k * 0.1]]; line(c, pts, 0.04); line(c, pts, 0.028, GOLD); if (k) for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6, x = u < 0.63 ? lerp(0.5, 0.84, u / 0.63) : lerp(0.84, 1.04, (u - 0.63) / 0.37), y = (u < 0.63 ? lerp(1.42, 1.21, u / 0.63) : lerp(1.21, 1.34, (u - 0.63) / 0.37)) - 0.045; line(c, [[x, y + 0.03], [x, y]], 0.004, GOLD); ell(c, x, y - 0.02, 0.026, 0.026); fs(c, GOLD, 0.005); } else beads(c, pts, 9, 0.011, i => i % 2 ? GREEN : PEARL); }
  }
  function drawHorseLeg(c, hind, lower) {
    if (!lower) { if (hind) sp(c, [[-0.18, 0.1], [-0.22, -0.12], [-0.12, -0.36], [-0.062, -0.5, 1], [0.05, -0.5, 1], [0.085, -0.3], [0.18, -0.05], [0.13, 0.12]]); else sp(c, [[-0.11, 0.08], [-0.125, -0.1], [-0.07, -0.36], [-0.058, -0.48, 1], [0.058, -0.48, 1], [0.072, -0.34], [0.125, -0.08], [0.1, 0.09]]); fs(c, lgrad(c, -0.15, 0, 0.15, 0, [HB, HA, HA, HB]), 0.011); line(c, [[-0.03, -0.1], [-0.01, -0.34]], 0.004, HL); }
    else { sp(c, [[-0.036, -0.375, 1], [0.042, -0.375, 1], [0.09, -0.455, 1], [-0.002, -0.455, 1]]); fs(c, HA, 0.008); sp(c, [[-0.012, -0.45, 1], [0.098, -0.45, 1], [0.122, -0.532, 1], [-0.034, -0.532, 1]]); fs(c, lgrad(c, 0, -0.45, 0, -0.53, ['#ffe27a', '#c98a08']), 0.007);
      c.beginPath(); c.moveTo(-0.044, 0); c.lineTo(-0.036, -0.34); c.lineTo(0.036, -0.34); c.lineTo(0.042, 0); c.closePath(); fs(c, lgrad(c, -0.045, 0, 0.045, 0, [HB, HA, HB]), 0.009); ell(c, 0.004, -0.36, 0.05, 0.044); fs(c, HA, 0.008); ell(c, 0, -0.012, 0.064, 0.056); fs(c, lgrad(c, -0.06, 0, 0.06, 0, [HB, HA, HB]), 0.009);
      band(c, -0.3, 0.044, 0.03, GOLD, 2); beads(c, [[-0.04, -0.275], [0.04, -0.275]], 5, 0.0075); for (let i = 0; i < 3; i++) { line(c, [[-0.026 + i * 0.026, -0.315], [-0.026 + i * 0.026, -0.33]], 0.003, GOLD); ell(c, -0.026 + i * 0.026, -0.34, 0.011, 0.011); fs(c, GOLD, 0.003); } }
  }
  function drawTail(c) { sp(c, [[0.0, 0.04, 1], [-0.16, 0.08], [-0.36, -0.06], [-0.48, -0.36], [-0.44, -0.7], [-0.56, -0.92], [-0.62, -1.06, 1], [-0.42, -0.98], [-0.34, -0.84], [-0.3, -1.0, 1], [-0.22, -0.74], [-0.24, -0.44], [-0.15, -0.16], [0.02, -0.05, 1]]); fs(c, lgrad(c, 0, 0, -0.5, -1.0, ['#ffffff', '#fff3c8', '#f5c542']), 0.01);
    for (let i = 0; i < 5; i++) line(c, [[-0.08 - i * 0.03, 0.0 - i * 0.02], [-0.3 - i * 0.03, -0.28 - i * 0.02], [-0.32 - i * 0.04, -0.72 - i * 0.03]], 0.004, '#d79a2a'); c.save(); c.translate(-0.12, 0.0); c.rotate(0.9); band(c, 0, 0.06, 0.04, GOLD, 3); c.restore(); }

  // ---------- build ----------
  let K, A, bow, horses = [], flag, wheelB;
  const PK = {}, PA = {}, pk = new Float32Array(NP), pa = new Float32Array(NP), v3 = new THREE.Vector3();
  async function build(scene, prog, tick) {
    const stage = new THREE.Group(); scene.add(stage);
    K = figure({ who: 'K', x: KX, skinA: '#48a4ff', skinB: '#0c33b8', skinL: '#082a90', clothA: '#ffe04a', clothB: '#f08a00', clothL: '#b85e00', edge: '#d81e3a', buti: '#d81e3a', sashA: MAG, sashB: '#ffb21f', pleat: -0.62, gem: RED }, uK);
    prog(0.2); await tick();
    A = figure({ who: 'A', x: AX, skinA: '#ffe0b4', skinB: '#e39a54', skinL: '#b56a2c', clothA: '#fffaf0', clothB: '#e6cfa0', clothL: '#b89a60', edge: '#c0182d', buti: GOLD, sashA: '#19c887', sashB: '#12b5b0', pleat: -0.44, gem: GREEN }, uM);
    K.root.position.z = 0.0; A.root.position.z = -0.14; stage.add(K.root, A.root);
    prog(0.4); await tick();
    // Gandiva
    bow = Pup.part(0.6, 1.9, 0.14, 0.95, PPM, c => { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16 * 2 - 1, a = Math.abs(u); pts.push([0.24 - (0.30 * a * a - 0.07 * Math.pow(a, 5)), u * 0.86]); }
      line(c, [[0.012, -0.86], [0.012, 0.86]], 0.005, CREAM); c.lineWidth = 0.05; c.strokeStyle = INK; sp(c, pts, false); c.stroke(); c.lineWidth = 0.036; c.strokeStyle = GOLD; c.stroke(); beads(c, pts, 21, 0.01, k => k % 3 === 1 ? RED : k % 3 === 2 ? GREEN : PEARL);
      c.save(); c.translate(0.24, 0); band(c, 0, 0.034, 0.18, GOLD, 0); gem(c, 0, 0.05, 0.016, RED); gem(c, 0, -0.05, 0.016, BLUE); gem(c, 0, 0, 0.012, PEARL); c.restore(); for (const s of [-1, 1]) gem(c, 0.012, s * 0.86, 0.022, PEARL); }, uM);
    bow.geometry.translate(-0.24, 0, 0); stage.add(bow);
    // the chariot
    const cb = Pup.part(6.6, 1.2, 1.8, -0.7, 300, drawCarBack, uM), cf = Pup.part(4.4, 2.3, 2.1, -0.6, 420, drawCarFront, uM), wh = Pup.part(1.8, 1.8, 0.9, 0.9, 420, drawWheel, uM), cn = Pup.part(4.0, 6.7, 2.05, -1.5, 300, drawCanopy, uM);
    cb.position.z = -0.32; cn.position.z = -0.26; cf.position.z = 0.16; wh.position.set(-0.12, 0.87, 0.24); wheelB = new THREE.Mesh(wh.geometry, wh.material); wheelB.position.set(-0.42, 0.87, -0.5); wheelB.frustumCulled = false;
    flag = Pup.part(2.5, 1.5, 0.05, 0.75, 300, drawBanner, { uLit: uM.uLit, uWave: { value: 0.16 } }, { segX: 24, segY: 4 }); flag.position.set(-0.11, 7.3, -0.27); flag.rotation.y = Math.PI;
    stage.add(cb, cn, wheelB, cf, wh, flag);
    prog(0.6); await tick();
    // the four horses, staggered like a frieze
    const tb = Pup.sheet(2.9, 1.2, 1.3, -0.72, 380, drawHorseBody), tn = Pup.sheet(1.6, 2.3, 0.5, 0.42, 380, drawHorseNeck), tt = Pup.sheet(0.8, 1.3, 0.7, 1.18, 380, drawTail);
    const tl = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([h, l]) => Pup.sheet(0.5, 0.75, 0.25, 0.62, 380, c => drawHorseLeg(c, h, l)));
    const mats = new Map(), mk = (tex, w, h, px, py) => { if (!mats.has(tex)) mats.set(tex, Pup.leather(tex, uM)); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(w / 2 - px, h / 2 - py, 0), mats.get(tex)); m.frustumCulled = false; return m; };
    for (let i = 0; i < 4; i++) { const g = new THREE.Group(), body = mk(tb, 2.9, 1.2, 1.3, -0.72), neck = mk(tn, 1.6, 2.3, 0.5, 0.42), tail = mk(tt, 0.8, 1.3, 0.7, 1.18), legs = [];
      neck.position.set(0.72, 1.42, 0.012); tail.position.set(-1.08, 1.5, -0.012);
      for (const [hind, x, y, z] of [[0, 0.74, 1.02, 0.02], [0, 0.62, 1.02, -0.03], [1, -0.80, 1.06, 0.02], [1, -0.92, 1.06, -0.03]]) { const u = mk(tl[hind * 2], 0.5, 0.75, 0.25, 0.62), l = mk(tl[hind * 2 + 1], 0.5, 0.75, 0.25, 0.62); l.position.set(0, hind ? -0.5 : -0.48, 0.004); u.add(l); u.position.set(x, y, z); legs.push([u, l, hind]); g.add(u); }
      g.add(tail, body, neck); g.position.set(3.55 + i * 0.5, 0, -0.62 + i * 0.2); g.scale.setScalar(0.98 + (i % 2) * 0.04); stage.add(g); horses.push({ g, neck, tail, legs, ph: i * 1.9 + 0.4 }); }
    // soft shade on the ground under car and team
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sx = sc.getContext('2d'), gr = sx.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(0.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
    const sm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, color: 0x1a0d08 });
    for (const [x, z, w, d] of [[0, 2.2, 5.6, 8], [4.3, 2.2, 5.2, 8]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), sm); m.position.set(x, 0.03, z); m.renderOrder = -8; stage.add(m); }
    // ---- poses ----
    const st = { lF: [4, 0], lB: [-4, 0] }, kn = { lF: [14, -104], lB: [6, -99] }, si = { lF: [72, -150], lB: [62, -146] };
    PA.stand = pose({ ...st, aF: [52, 46], aB: [-8, -6] });
    PA.desp = pose({ ...st, torso: -9, head: -30, aF: [9, 8], aB: [-4, 5] });
    PA.sit = pose({ ...si, y: -0.50, torso: -20, head: -28, aF: [32, 22], aB: [36, 16] });
    PA.look = pose({ ...si, y: -0.50, torso: -5, head: 20, aF: [30, 26], aB: [34, 20] });
    PA.awe = pose({ ...kn, y: -0.39, torso: 9, head: 34, aF: [84, 62], aB: [-52, -84] });
    PA.pranam = pose({ ...kn, y: -0.39, torso: 5, head: 28, aF: [40, 104], aB: [44, 96] });
    PA.bowed = pose({ ...kn, y: -0.39, torso: -13, head: -14, aF: [46, 100], aB: [50, 92] });
    PA.rise = pose({ ...st, torso: 3, head: 9, aF: [152, 14], aB: [-12, -12] });
    PK.drive = pose({ ...st, aF: [50, 44], aB: [62, 30] });
    PK.calm = pose({ torso: 4, head: -7, aF: [10, 14], aB: [-7, -8], lF: [16, -30], lB: [-2, 0] });
    PK.abhaya = pose({ torso: 3, head: -9, aF: [44, 126], aB: [-8, -10], lF: [16, -30], lB: [-2, 0] });
    PK.behold = pose({ ...st, head: 13, aF: [106, 30], aB: [-106, -30] });
    G.tick.push(update); update(0); prog(1);
    G.info.puppetMP = +(Pup.px / 1e6).toFixed(1);
  }
  function update(t) {
    const T = Film.T, S = Film.state(t), w = S.wind;
    // the light through the enamel: the dusk sun; in the vision, the radiance of the form; at the flash, everything
    const lv = lerp(1.3, 0.6 + S.vir * 0.8, S.night) + S.flash * 3 + S.dawn * 0.2; uM.uLit.value.set(lv, lv * lerp(0.94, 0.86, S.night), lv * lerp(0.86, 0.62, S.night));
    // the key that rakes the relief: warm, from the lens side, drifting so the glints travel; in the vision it comes down from the form
    const kk = lerp(1.25, 0.5 + S.vir * 0.75, S.night) + S.flash * 2.5 + S.dawn * 0.25; Pup.light.uKeyCol.value.set(kk, kk * lerp(0.84, 0.78, S.night), kk * lerp(0.62, 0.5, S.night));
    Pup.light.uKey.value.set(-0.42 + Math.sin(t * 0.21) * 0.3, lerp(0.5, 0.95, S.night) + Math.sin(t * 0.13 + 1) * 0.12, lerp(0.75, 0.35, S.night)).normalize();
    // Krishna: the charioteer -> turns (the flip) -> lifts his hand (the wind stops) -> opens his arms: behold -> light -> blesses
    const kTurn = sstep(18.8, 20.6, t), kAb = sstep(21.4, 24.2, t) * sstep(29.6, 27.2, t), kBe = sstep(27.2, 30.6, t) * sstep(69.6, 66.6, t), kAb2 = sstep(67.0, 70.6, t), ab = Math.max(kAb, kAb2), calm = Math.max(kTurn - ab - kBe, 0);
    mix(pk, [[PK.drive, 1 - kTurn], [PK.calm, calm], [PK.abhaya, ab], [PK.behold, kBe]]);
    pk[3] += Math.sin(w * 0.9) * 0.8; pk[4] += Math.sin(w * 0.6 + 1) * 1.2; pk[6] += Math.sin(t * 1.3) * 1.5 * kBe;
    K.set(pk, Math.cos(sstep(19.0, 20.2, t) * Math.PI) || 1e-4); K.root.position.y += Math.sin(sstep(19.0, 20.2, t) * Math.PI) * 0.03;
    uK.uKG.value = sstep(T.LIGHT + 0.4, T.FLASH - 0.4, t) * sstep(T.RETURN + 4.4, T.RETURN + 1.4, t) * (0.92 + 0.08 * Math.sin(t * 7));
    // Arjuna: stands -> the bow slips, he sinks -> lifts his eyes -> on his knees before the form -> hands joined -> bows -> rises, bow high
    const a1 = sstep(10.6, 13.4, t), a2 = sstep(13.6, 16.6, t), a3 = sstep(22.6, 26, t), a4 = sstep(T.FLASH - 0.2, T.FLASH + 1.5, t), a5 = sstep(39.5, 43.5, t), a6 = sstep(67.6, 71, t), a7 = sstep(76.4, 79.4, t);
    mix(pa, [[PA.stand, 1 - a1], [PA.desp, a1 * (1 - a2)], [PA.sit, a2 * (1 - a3)], [PA.look, a3 * (1 - a4)], [PA.awe, a4 * (1 - a5)], [PA.pranam, a5 * (1 - a6)], [PA.bowed, a6 * (1 - a7)], [PA.rise, a7]]);
    const tr = S.vir; pa[3] += Math.sin(t * 29) * 0.45 * tr + Math.sin(w * 1.2) * 0.7; pa[4] += Math.sin(t * 23 + 1) * 0.7 * tr; pa[5] += Math.sin(t * 31) * 0.9 * tr; pa[7] += Math.sin(t * 27 + 2) * 0.9 * tr;
    A.set(pa);
    for (const f of [K, A]) f.scarves.forEach((s, i) => { s.rotation.z = (i ? 3.32 : 2.92) + Math.sin(w * 1.1 + i * 2 + (f === K ? 0 : 1.5)) * 0.07 - f.tg.rotation.z * 0.6; });
    // the bow: in his leading hand, upright; it slips (13.2) and falls out of sight behind the wall of the car; at dawn he lifts it high
    A.root.updateMatrixWorld(true); v3.set(0, -0.30, 0).applyMatrix4(A.aF[1].matrixWorld);
    const drop = sstep(13.0, 14.3, t) * sstep(78.2, 76.9, t), fall = drop * drop;
    bow.position.set(v3.x + drop * 0.25, lerp(v3.y, FLOOR + 0.12, fall), A.root.position.z + 0.05); bow.scale.setScalar(SC); bow.rotation.z = lerp(-0.06 - a7 * 0.22, -1.45, fall);
    // horses: they paw and toss while the wind runs, and stand like a frieze when it stops
    for (const h of horses) { const p = w * 1.25 + h.ph, lift = Math.pow(Math.max(Math.sin(p), 0), 3), lift2 = Math.pow(Math.max(Math.sin(p * 0.7 + 2), 0), 6);
      h.neck.rotation.z = (Math.sin(p * 0.8) * 3.2 + lift * 4 - 2) * D; h.tail.rotation.z = (Math.sin(p * 1.6) * 8 - 4) * D;
      h.legs[0][0].rotation.z = lift * 42 * D; h.legs[0][1].rotation.z = -lift * 82 * D; h.legs[1][0].rotation.z = -3 * D; h.legs[2][0].rotation.z = (-4 + lift2 * 14) * D; h.legs[2][1].rotation.z = (6 - lift2 * 30) * D; h.legs[3][0].rotation.z = 3 * D; h.legs[3][1].rotation.z = -2 * D; }
  }
  const krishnaHeart = out => out.set(KX, FLOOR + (0.93 + 0.3) * SC, 0);
  return { build, FLOOR, KX, AX, krishnaHeart, uM, uK };
})();
