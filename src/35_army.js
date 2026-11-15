'use strict';
// ---- the two hosts ----------------------------------------------------------------------------------------------------
//   Army.build(scene, prog, tick)   Pandavas at x < -46 facing +X, Kauravas at x > 46 facing -X; blocks with lanes; standards,
//                                   war cars under white parasols, elephants. Everything instanced; LOD is STATIC, chosen at
//                                   load from each man's distance to the scripted camera paths.
//   Army.pos (Float32Array xyz), Army.n       where every soldier stands (the streams of the Kala shots rise from these)
// Motion: a sway driven by GL.U.uW, the wind phase. When the wind stops (Film.state.still) the hosts stand like a painting.
const Army = (() => {
  const C = (r, g, b) => [r, g, b], SKIN = C(0.20, 0.11, 0.06), BRONZE = C(0.48, 0.30, 0.10), STEEL = C(0.62, 0.62, 0.68), WOOD = C(0.16, 0.09, 0.05), HIDE = C(0.26, 0.15, 0.08);
  const SIDES = [
    { sg: -1, cloth: C(0.80, 0.36, 0.06), cloth2: C(0.74, 0.68, 0.56), flags: [C(0.95, 0.42, 0.05), C(0.85, 0.78, 0.62), C(0.90, 0.62, 0.10)] },   // Pandavas: saffron and white
    { sg: 1, cloth: C(0.42, 0.04, 0.04), cloth2: C(0.10, 0.10, 0.26), flags: [C(0.62, 0.04, 0.04), C(0.10, 0.12, 0.40), C(0.52, 0.34, 0.05)] } ];  // Kauravas: crimson and indigo
  const T = (g, c) => tint(g, c[0], c[1], c[2]);
  function soldier(S, lod) {
    const p = [];
    if (lod === 0) {
      p.push(T(xf(new THREE.CylinderGeometry(0.13, 0.17, 0.82, 6), 0, 0.41, 0), S.cloth2));                       // dhoti
      p.push(T(xf(new THREE.CylinderGeometry(0.20, 0.15, 0.56, 6), 0, 1.10, 0, 0, 0, 0, 1, 1, 0.7), BRONZE));     // cuirass
      p.push(T(xf(new THREE.BoxGeometry(0.42, 0.10, 0.20), 0, 0.84, 0), S.cloth));                                // sash
      p.push(T(xf(new THREE.IcosahedronGeometry(0.115, 1), 0, 1.53, 0.01), SKIN));
      p.push(T(xf(new THREE.ConeGeometry(0.13, 0.20, 6), 0, 1.68, 0), S.cloth));                                  // turban / helm
      p.push(T(xf(new THREE.CylinderGeometry(0.045, 0.04, 0.5, 5), 0.24, 1.12, 0.03, 0.25), SKIN));               // spear arm
      p.push(T(xf(new THREE.CylinderGeometry(0.045, 0.04, 0.5, 5), -0.24, 1.12, 0.06, -0.5), SKIN));
      p.push(T(xf(new THREE.CylinderGeometry(0.30, 0.30, 0.03, 10), -0.26, 1.08, 0.20, Math.PI / 2, 0, 0.12), HIDE));  // shield
      p.push(T(xf(new THREE.SphereGeometry(0.07, 6, 4), -0.26, 1.08, 0.225), BRONZE));
      p.push(T(xf(new THREE.CylinderGeometry(0.014, 0.014, 2.7, 4), 0.27, 1.45, 0.10), WOOD));                    // spear
      p.push(T(xf(new THREE.ConeGeometry(0.035, 0.26, 4), 0.27, 2.93, 0.10), STEEL));
    } else if (lod === 2) {      // far ranks: a body, a head, a spear. They are a few pixels tall in haze.
      p.push(T(xf(new THREE.BoxGeometry(0.36, 1.42, 0.22), 0, 0.71, 0), BRONZE)); p.push(T(xf(new THREE.OctahedronGeometry(0.15, 0), 0, 1.56, 0, 0, 0, 0, 1, 1.25, 1), S.cloth));
      p.push(T(xf(new THREE.PlaneGeometry(0.045, 2.9), 0.27, 1.52, 0.10), WOOD), T(xf(new THREE.PlaneGeometry(0.045, 2.9), 0.27, 1.52, 0.10, 0, Math.PI / 2, 0), WOOD));
    } else {
      p.push(T(xf(new THREE.BoxGeometry(0.26, 0.82, 0.22), 0, 0.41, 0), S.cloth2));
      p.push(T(xf(new THREE.BoxGeometry(0.40, 0.60, 0.22), 0, 1.10, 0), BRONZE));
      p.push(T(xf(new THREE.OctahedronGeometry(0.14, 0), 0, 1.56, 0, 0, 0, 0, 1, 1.25, 1), lod === 1 ? S.cloth : SKIN));
      p.push(T(xf(new THREE.CircleGeometry(0.30, 6), -0.26, 1.08, 0.20), HIDE));
      p.push(T(xf(new THREE.BoxGeometry(0.03, 2.9, 0.03), 0.27, 1.52, 0.10), WOOD));
    }
    return mergeGeo(p);
  }
  function banner(col) {            // a pole and a long swallow-tailed standard; uv.x = how far from the pole (0 on the pole itself)
    const pole = T(xf(new THREE.CylinderGeometry(0.035, 0.045, 6.2, 5), 0, 3.1, 0), WOOD); pole.attributes.uv.array.fill(0);
    const f = new THREE.PlaneGeometry(2.4, 1.1, 10, 3), P = f.attributes.position, V = f.attributes.uv;
    for (let i = 0; i < P.count; i++) { const u = V.getX(i), v = V.getY(i); P.setXYZ(i, u * 2.4, 5.55 + (v - 0.5) * 1.1 * (1 - u * 0.35) + (u > 0.95 ? (Math.abs(v - 0.5) - 0.25) * 0.9 : 0), 0); V.setXY(i, Math.max(u, 0.001), v); }
    f.computeVertexNormals(); const top = T(xf(new THREE.SphereGeometry(0.09, 6, 4), 0, 6.25, 0), BRONZE); top.attributes.uv.array.fill(0);
    return mergeGeo([pole, T(f, col), top]);
  }
  function warcar(S) {
    const p = [T(xf(new THREE.BoxGeometry(1.5, 0.75, 2.0), 0, 1.15, 0), WOOD), T(xf(new THREE.BoxGeometry(1.56, 0.12, 2.06), 0, 1.55, 0), BRONZE)];
    for (const sx of [-1, 1]) p.push(T(xf(new THREE.CylinderGeometry(0.78, 0.78, 0.10, 14), sx * 0.86, 0.78, 0.1, 0, 0, Math.PI / 2), WOOD));
    p.push(T(xf(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 4), 0, 3.0, -0.6), BRONZE));
    p.push(T(xf(new THREE.SphereGeometry(1.25, 14, 5, 0, TAU, 0, 1.15), 0, 3.6, -0.6, 0, 0, 0, 1, 0.55, 1), C(0.86, 0.82, 0.72)));   // the white parasol of a king
    p.push(T(xf(new THREE.ConeGeometry(0.09, 0.4, 5), 0, 4.45, -0.6), BRONZE));
    p.push(T(xf(new THREE.CylinderGeometry(0.2, 0.24, 1.0, 6), 0, 2.0, 0.1), S.cloth), T(xf(new THREE.SphereGeometry(0.15, 6, 5), 0, 2.65, 0.1), SKIN));   // the car-warrior
    for (const sx of [-0.5, 0.5]) { p.push(T(xf(new THREE.CapsuleGeometry(0.33, 1.3, 2, 7), sx, 1.25, 2.6, Math.PI / 2), C(0.35, 0.24, 0.16)), T(xf(new THREE.CapsuleGeometry(0.16, 0.7, 2, 6), sx, 1.85, 3.45, 0.7), C(0.35, 0.24, 0.16)));
      for (const lz of [2.05, 3.15]) p.push(T(xf(new THREE.BoxGeometry(0.14, 1.0, 0.14), sx, 0.5, lz), C(0.30, 0.20, 0.13))); }
    return mergeGeo(p);
  }
  function elephant(S) {
    const G = C(0.17, 0.15, 0.14), p = [T(xf(new THREE.SphereGeometry(1, 14, 10), 0, 2.25, 0, 0, 0, 0, 1.15, 1.15, 1.9), G), T(xf(new THREE.SphereGeometry(0.78, 12, 9), 0, 2.75, 2.0, 0, 0, 0, 1, 1.1, 1), G)];
    for (const [x, z] of [[-0.62, 1.05], [0.62, 1.05], [-0.62, -1.05], [0.62, -1.05]]) p.push(T(xf(new THREE.CylinderGeometry(0.30, 0.34, 1.7, 8), x, 0.85, z), G));
    let ty = 2.55, tz = 2.72; for (let i = 0; i < 6; i++) { const a = 0.25 + i * 0.16; p.push(T(xf(new THREE.CylinderGeometry(0.25 - i * 0.03, 0.22 - i * 0.03, 0.5, 7), 0, ty, tz, -a), G)); ty -= 0.42 * Math.cos(a) * 0.95; tz += 0.42 * Math.sin(a) * 0.4 - 0.05; }
    for (const sx of [-1, 1]) { p.push(T(xf(new THREE.SphereGeometry(0.62, 8, 6), sx * 0.80, 2.75, 1.72, 0, sx * 0.5, 0, 0.14, 1.15, 0.9), G)); p.push(T(xf(new THREE.ConeGeometry(0.07, 0.9, 5), sx * 0.34, 2.05, 2.92, 1.9, 0, 0), C(0.75, 0.70, 0.58))); }
    p.push(T(xf(new THREE.BoxGeometry(2.4, 0.9, 2.3), 0, 2.85, -0.1), S.cloth), T(xf(new THREE.BoxGeometry(2.46, 0.14, 2.36), 0, 2.42, -0.1), BRONZE));     // caparison
    p.push(T(xf(new THREE.BoxGeometry(1.5, 0.7, 1.6), 0, 3.75, -0.1), WOOD), T(xf(new THREE.ConeGeometry(1.2, 0.8, 4), 0, 5.2, -0.1, 0, Math.PI / 4), S.cloth2));   // howdah and its canopy
    for (const [x, z] of [[-0.7, -0.85], [0.7, -0.85], [-0.7, 0.65], [0.7, 0.65]]) p.push(T(xf(new THREE.BoxGeometry(0.06, 0.9, 0.06), x, 4.45, z), BRONZE));
    return mergeGeo(p);
  }
  const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, u = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)); return Math.hypot(x - ax - dx * u, z - az - dz * u); };
  let pos = null, n = 0;
  async function build(scene, prog, tick) {
    const K = +Q.get('army') || 0.62, r = rng(1101), list = [[], []], flagsL = [[], []], cars = [[], []], eles = [[], []];
    for (let si = 0; si < 2; si++) { const S = SIDES[si], sg = S.sg, r2 = rng(2200 + si);
      for (let bz = -640; bz < 250; bz += 52) for (let bx = 0; bx < 7; bx++) {
        const z0 = bz + (r2() - 0.5) * 6, x0 = 46 + bx * 36 + Math.sin(bz * 0.011 + si * 2) * 5 + (bx === 0 ? 0 : (r2() - 0.5) * 6), far = Math.hypot(x0, z0 + 22);
        if (far > 560) continue;
        const sx = far > 300 ? 2.6 : far > 170 ? 2.0 : 1.55, sz = far > 300 ? 2.3 : far > 170 ? 1.75 : 1.35, kind = r2();
        if (bx >= 1 && kind < 0.16) { for (let i = 0; i < 5; i++) eles[si].push([sg * (x0 + 6 + (i % 2) * 11 + r2() * 2), z0 + 6 + i * 8.5 + r2() * 2]); }
        else if (bx >= 1 && kind < 0.36) { for (let i = 0; i < 6; i++) cars[si].push([sg * (x0 + 5 + (i % 2) * 12 + r2() * 2), z0 + 4 + i * 7.4 + r2() * 2]); }
        else for (let ix = 0; ix * sx < 27; ix++) for (let iz = 0; iz * sz < 45; iz++) { if (K < 1 && r2() > K) continue; list[si].push([sg * (x0 + ix * sx + (r2() - 0.5) * 0.5), z0 + iz * sz + (r2() - 0.5) * 0.45]); }
        const nf = far > 300 ? 1 : 3; for (let i = 0; i < nf; i++) flagsL[si].push([sg * (x0 + 1 + r2() * 24), z0 + 2 + r2() * 40]);
      } }
    prog(0.2); await tick();
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
    const SWAY = /* glsl */`
      #ifdef USE_INSTANCING
      { float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3, k = max(position.y - .9, 0.);
        transformed.x += sin(uW * 1.1 + ph) * .016 * k * k; transformed.z += sin(uW * .8 + ph * 1.3) * .012 * k; }
      #endif`;
    const mat = GL.patch(new THREE.MeshStandardMaterial({ vertexColors: true, color: 0x8a8a8a, roughness: 0.62, metalness: 0.25, envMapIntensity: 0.7 }), { key: 'soldier', vert: SWAY });
    const matFar = GL.patch(new THREE.MeshLambertMaterial({ vertexColors: true }), { key: 'soldierFar', vert: SWAY });
    const matFar2 = GL.patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { key: 'soldierFar2', vert: SWAY });
    const all = []; let tris = 0;
    for (let si = 0; si < 2; si++) { const S = SIDES[si], L = list[si], near = [], far = [], far2 = [];
      for (const a of L) { const d = segD(a[0], a[1], 75, 120, 58, 88); (d < 46 ? near : Math.hypot(a[0], a[1] - 60) > 150 && d > 110 ? far2 : far).push(a); all.push(a); }
      [[near, 0, mat], [far, 1, matFar], [far2, 2, matFar2]].forEach(([arr, lod, mm]) => { if (!arr.length) return; const g = soldier(S, lod), im = new THREE.InstancedMesh(g, mm, arr.length);
        arr.forEach((a, i) => { const k = 0.93 + r() * 0.16; m.compose(p.set(a[0], Land.h(a[0], a[1]), a[1]), q.setFromEuler(e.set(0, -S.sg * Math.PI / 2 + (r() - 0.5) * 0.35, 0)), s.set(k, k * (0.96 + r() * 0.1), k)); im.setMatrixAt(i, m);
          const v = 0.72 + r() * 0.5; im.setColorAt(i, col.setRGB(v * (0.95 + r() * 0.1), v, v * (0.95 + r() * 0.1))); });
        im.castShadow = lod === 0; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); tris += g.attributes.position.count / 3 * arr.length; });
      prog(0.3 + si * 0.25); await tick();
      // standards
      const FV = /* glsl */`{ float u = uv.x, ph = instanceMatrix[3].x * .9 + instanceMatrix[3].z * 1.3;
        float w = sin(u * 5.5 - uW * 5.2 + ph) * .22 + sin(u * 11. - uW * 8.1 + ph * 2.) * .07;
        transformed.z += w * u; transformed.y -= u * u * .22 * (1. + sin(uW * 1.7 + ph) * .5); }`;
      const fm = GL.patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { key: 'flag', vert: FV });
      S.flags.forEach((fc, fi) => { const arr = flagsL[si].filter((_, i) => i % 3 === fi); if (!arr.length) return; const im = new THREE.InstancedMesh(banner(fc), fm, arr.length);
        arr.forEach((a, i) => { const k = 0.85 + r() * 0.5; m.compose(p.set(a[0], Land.h(a[0], a[1]), a[1]), q.setFromEuler(e.set(0, Math.PI + (r() - 0.5) * 0.5, 0)), s.set(k, k, k)); im.setMatrixAt(i, m); });   // all streaming one way: the wind blows toward +Z... toward the lens of the wide shots
        im.frustumCulled = false; im.castShadow = true; scene.add(im); });
      for (const [arr, geo] of [[cars[si], warcar(S)], [eles[si], elephant(S)]]) { if (!arr.length) continue; const im = new THREE.InstancedMesh(geo, mat, arr.length);
        arr.forEach((a, i) => { const k = 0.95 + r() * 0.15; m.compose(p.set(a[0], Land.h(a[0], a[1]), a[1]), q.setFromEuler(e.set(0, -S.sg * Math.PI / 2 + (r() - 0.5) * 0.2, 0)), s.set(k, k, k)); im.setMatrixAt(i, m); const v = 0.8 + r() * 0.4; im.setColorAt(i, col.setRGB(v, v, v)); });
        im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; scene.add(im); tris += geo.attributes.position.count / 3 * arr.length; }
    }
    n = all.length; pos = new Float32Array(n * 3); all.forEach((a, i) => { pos[i * 3] = a[0]; pos[i * 3 + 1] = Land.h(a[0], a[1]); pos[i * 3 + 2] = a[1]; });
    G.info.soldiers = n; G.info.armyTris = Math.round(tris); prog(1);
  }
  return { build, get pos() { return pos; }, get n() { return n; } };
})();
