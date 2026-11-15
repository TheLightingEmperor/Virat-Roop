'use strict';
// ---- shared helpers. First module in name order: everything after it may use these names. -----------------------
// All modules are joined into ONE script scope, so every top-level name is global to the film. Keep one IIFE per
// module that returns a small object (const Sky = (() => { ... })()), and keep the list of bare globals short.
const Q = new URLSearchParams(location.search);
// ?noraf=1  drive frames from a timer. A page in a hidden pane or a background tab never gets requestAnimationFrame
//           callbacks, so without this it would never finish booting and no debug hook would ever answer.
if (Q.has('noraf')) window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16);

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };     // works with a > b too (falling edge)
const fract = x => x - Math.floor(x);
// seeded random stream. Never Math.random(): layout must be identical on every load, or frames cannot be compared.
// Give every concern its own seed, so adding a tree does not reshuffle the birds.
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x9E3779B9) | 0; let t = s ^ (s >>> 16); t = Math.imul(t, 0x21F0AAAD); t ^= t >>> 15; t = Math.imul(t, 0x735A2D97); return ((t ^ (t >>> 15)) >>> 0) / 4294967296; }; }
// keyed curve through [[x, y], ...] sorted by x: eased between keys (or linear). The workhorse of camera and grade tracks.
const keyed = (ks, lin) => x => {
  if (x <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (x <= ks[i][0]) { const u = (x - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]); return lerp(ks[i - 1][1], ks[i][1], lin ? u : u * u * (3 - 2 * u)); }
  return ks[ks.length - 1][1];
};
// an event envelope: 0 before t0, a smooth attack, then an exponential release. Continuous everywhere (a step in an
// envelope is a visible pop). Sum several of these to script shake, flash, exposure and gusts against the beat sheet.
const pulse = (t, t0, att, rel) => t < t0 ? 0 : t < t0 + att ? sstep(t0, t0 + att, t) : Math.exp(-(t - t0 - att) / rel);

// World state every module shares. G.tick holds closures (t, dt) => void that recompute their thing FROM t ALONE.
// Nothing may read what it did last frame: that is what makes ?t=, contact sheets and offline recording possible.
const G = { t: 0, info: {}, tick: [] };

// ---- CPU value noise (seeded lattice hash) + fbm: terrain, layout, anything that must agree between loads ----
const hash2 = (x, y) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), ux), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), ux), uy); };
const fbm2 = (x, y, o = 4) => { let a = 0.5, s = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return s; };
const win = (t, a, b, up = 1, dn = 1) => Math.min(sstep(a, a + up, t), sstep(b, b - dn, t));

// ---- geometry helpers ----
// merge([geo, ...]) -> one non-indexed geometry with position, normal, color (white where a part has none) and uv.
function mergeGeo(list) {
  let n = 0; const parts = list.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3).fill(1), V = new Float32Array(n * 2); let o = 0;
  for (const q of parts) { const c = q.attributes.position.count; P.set(q.attributes.position.array, o * 3); if (q.attributes.normal) N.set(q.attributes.normal.array, o * 3);
    if (q.attributes.color) C.set(q.attributes.color.array, o * 3); if (q.attributes.uv) V.set(q.attributes.uv.array, o * 2); o += c; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.BufferAttribute(V, 2)); return g;
}
// paint a whole geometry one linear colour (as a vertex colour), return it: tint(new THREE.BoxGeometry(...), r, g, b)
function tint(g, r, gg, b) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = gg; a[i * 3 + 2] = b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
// place a geometry: xf(geo, x, y, z, rx, ry, rz, sx, sy, sz)
const _xm = new THREE.Matrix4(), _xq = new THREE.Quaternion(), _xe = new THREE.Euler(), _xp = new THREE.Vector3(), _xs = new THREE.Vector3();
function xf(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { g.applyMatrix4(_xm.compose(_xp.set(x, y, z), _xq.setFromEuler(_xe.set(rx, ry, rz)), _xs.set(sx, sy, sz))); return g; }
