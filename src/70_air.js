'use strict';
// ---- light and dust: the column of light, the rivers of the Kala shots, motes in the sun ------------------------------
//   Air.build(scene, prog, tick)
// All stateless: every particle's place is a closed form of film time (or of the wind phase, so the dust hangs when the
// wind stops). One blend for everything: premultiplied, alpha 0 = pure added light.
const Air = (() => {
  const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide };
  let pillar, pU, sU, mU, fU; const heart = new THREE.Vector3(), sUm = () => typeof Virat !== 'undefined' ? Virat.MOUTH : new THREE.Vector3(0, 370, -556);
  async function build(scene, prog, tick) {
    // ---- the column: it stands on Krishna's heart and goes up out of the picture ----
    pU = Object.assign({ uAmt: { value: 0 }, uWide: { value: 1 } }, GL.U);
    pillar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.ShaderMaterial(Object.assign({ uniforms: pU,
      vertexShader: 'varying vec2 vUv; varying float vY; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`uniform float uAmt, uT; varying vec2 vUv; varying float vY; ${GL.NOISE}
        void main(){ float x = (vUv.x - .5) * 2.; float core = exp(-x * x * 60.) * 2.4 + exp(-x * x * 7.) * .5 + exp(-abs(x) * 2.2) * .12;
          float st = fbm(vec2(x * 5., vY * .06 - uT * 2.6)) * .8 + .5; float base = smoothstep(0., 1.6, vY - 2.2) * (1. - smoothstep(.75, 1., abs(x)));
          gl_FragColor = vec4(vec3(1., .82, .48) * core * st * base * uAmt * 3., 0.); }` }, ADD)));
    pillar.frustumCulled = false; pillar.renderOrder = 4; scene.add(pillar);
    prog(0.3); await tick();
    // ---- the rivers: the lights of the warriors, rising out of both hosts and running to the mouth of Time ----
    const N = 16000, NR = 14, r = rng(4401), P0 = new Float32Array(N * 3), SD = new Float32Array(N * 4), CB = new Float32Array(N * 3), CC = new Float32Array(N * 3), ap = typeof Army !== 'undefined' && Army.pos ? Army.pos : null, an = ap ? Army.n : 0, MO = sUm();
    // fourteen rivers, seven out of each host. Each has a spring (a patch of the ranks), a course, and a time it begins to run.
    const riv = []; for (let k = 0; k < NR; k++) { const sg = k < NR / 2 ? -1 : 1, i = k % (NR / 2), cx = sg * (70 + r() * 150), cz = 120 - i * 62 + r() * 30, up = 70 + r() * 90; riv.push({ sg, cx, cz, t0: r() * 3.2,
      b: [cx - sg * 10, up, cz - 30], c: [lerp(cx, MO.x, 0.62) + sg * (30 + r() * 70) * (i % 2 ? 1 : 0.3), lerp(60, MO.y, 0.62) + 90 + r() * 110, lerp(cz, MO.z, 0.62) + 40 * (r() - 0.5)], near: [] }); }
    if (an) for (let j = 0; j < an; j++) { const x = ap[j * 3], z = ap[j * 3 + 2]; for (const R of riv) if (Math.sign(x) === R.sg && Math.hypot(x - R.cx, z - R.cz) < 46) R.near.push(j); }
    for (let i = 0; i < N; i++) { const k = Math.floor(r() * NR), R = riv[k]; let x, y = 0, z;
      if (R.near.length) { const j = R.near[Math.floor(r() * R.near.length)]; x = ap[j * 3]; y = ap[j * 3 + 1]; z = ap[j * 3 + 2]; } else { x = R.cx + (r() - 0.5) * 70; z = R.cz + (r() - 0.5) * 70; }
      P0.set([x, y + 1.5, z], i * 3); const j1 = 14, j2 = 22; CB.set([R.b[0] + (r() - 0.5) * j1, R.b[1] + (r() - 0.5) * j1 * 2, R.b[2] + (r() - 0.5) * j1], i * 3); CC.set([R.c[0] + (r() - 0.5) * j2, R.c[1] + (r() - 0.5) * j2, R.c[2] + (r() - 0.5) * j2], i * 3);
      SD[i * 4] = (R.t0 + r() * 7.4) / 10.6; SD[i * 4 + 1] = r(); SD[i * 4 + 2] = r(); SD[i * 4 + 3] = r(); }
    const g = new THREE.InstancedBufferGeometry(); g.index = new THREE.PlaneGeometry(1, 1).index; g.setAttribute('position', new THREE.PlaneGeometry(1, 1).attributes.position); g.setAttribute('aP', new THREE.InstancedBufferAttribute(P0, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(SD, 4));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(CB, 3)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(CC, 3)); g.instanceCount = N;
    sU = Object.assign({ uMouth: { value: MO }, uT0: { value: Film.T.KALA - 1.2 }, uAmt: { value: 0 } }, GL.U);
    const streams = new THREE.Mesh(g, new THREE.ShaderMaterial(Object.assign({ uniforms: sU, vertexShader: /* glsl */`
      attribute vec3 aP, aB, aC; attribute vec4 aS; uniform vec3 uMouth; uniform float uT, uT0; varying float vU; varying vec2 vQ; varying float vS, vN;
      vec3 path(float e){ float m = 1. - e; vec3 p = aP * m * m * m + 3. * aB * m * m * e + 3. * aC * m * e * e + uMouth * e * e * e;
        float k = (1. - e) * smoothstep(0., .2, e); p.x += sin(e * 21. + aS.y * 40.) * k * 5.; p.y += cos(e * 17. + aS.z * 30.) * k * 4.; return p; }
      void main(){ float life = 6.0 + aS.y * 1.6, age = uT - uT0 - aS.x * 10.6, u = age / life; vU = u; vS = aS.z;
        if (u <= 0. || u >= 1.) { gl_Position = vec4(2., 2., 2., 1.); return; }
        float e = pow(u, 1.7), e0 = max(e - .022 - .04 * e, 0.);
        vec4 v1 = viewMatrix * vec4(path(e), 1.), v0 = viewMatrix * vec4(path(e0), 1.);
        vec2 dir = v1.xy - v0.xy; float l = length(dir); dir = l > 1e-4 ? dir / l : vec2(0., 1.); vec2 nrm = vec2(-dir.y, dir.x);
        float wd = max(.8 + aS.w * 1.1, -v1.z * .0014); vN = smoothstep(22., 80., -v1.z);
        vec3 p = mix(v0.xyz, v1.xyz, position.x + .5); p.xy += nrm * position.y * wd + dir * position.x * wd; vQ = position.xy * 2.;
        gl_Position = projectionMatrix * vec4(p, 1.); }`,
      fragmentShader: /* glsl */`uniform float uAmt; varying float vU; varying vec2 vQ; varying float vS, vN;
        void main(){ float a = (1. - abs(vQ.y)) * (1. - vQ.x * vQ.x); a *= a; float f = smoothstep(0., .07, vU) * (1. - smoothstep(.95, 1., vU));
          vec3 c = mix(vec3(1., .78, .42), vec3(1., .32, .06), smoothstep(.3, 1., vU) * (.6 + vS * .4)); gl_FragColor = vec4(c * a * f * vN * uAmt * (1.7 + vU * 2.6), 0.); }` }, ADD)));
    streams.frustumCulled = false; streams.renderOrder = 3; scene.add(streams);
    prog(0.7); await tick();
    // ---- motes: dust in the low sun, drifting with the wind; they stand still when it stops ----
    const M = 2200, r2 = rng(5502), MP = new Float32Array(M * 3), MS = new Float32Array(M * 4); for (let i = 0; i < M; i++) { MP[i * 3] = r2(); MP[i * 3 + 1] = r2() * r2(); MP[i * 3 + 2] = r2(); MS[i * 4] = r2(); MS[i * 4 + 1] = r2(); MS[i * 4 + 2] = r2(); MS[i * 4 + 3] = r2(); }
    const mg = new THREE.InstancedBufferGeometry(); mg.index = g.index; mg.setAttribute('position', g.attributes.position); mg.setAttribute('aP', new THREE.InstancedBufferAttribute(MP, 3)); mg.setAttribute('aS', new THREE.InstancedBufferAttribute(MS, 4)); mg.instanceCount = M;
    mU = Object.assign({ uCol: { value: new THREE.Vector3(1, 0.7, 0.35) } }, GL.U);
    const motes = new THREE.Mesh(mg, new THREE.ShaderMaterial(Object.assign({ uniforms: mU, vertexShader: /* glsl */`
      attribute vec3 aP; attribute vec4 aS; uniform float uT, uW; varying vec2 vQ; varying float vA;
      void main(){ vec3 box = vec3(46., 13., 44.); vec3 p = aP * box; p.x -= uW * (.9 + aS.x * .9); p.y += sin(uW * (.4 + aS.y) + aS.z * 20.) * .35 + uW * .05 * (aS.w - .3); p.z += cos(uW * .5 + aS.x * 30.) * .4;
        vec3 org = vec3(cameraPosition.x, 0., cameraPosition.z) - vec3(box.x, 0., box.z) * .5 + vec3(0., 0., -box.z * .42); p = mod(p - org, box) + org; p.y = mod(p.y, box.y) + .15;
        vec4 v = viewMatrix * vec4(p, 1.); float sz = max(.012 + aS.w * .028, -v.z * .0009); vQ = position.xy * 2.;
        vA = smoothstep(.8, 3.5, -v.z) * (1. - smoothstep(30., 42., -v.z)) * (.4 + .6 * sin(uT * (1. + aS.y * 3.) + aS.z * 50.) * sin(uT * (1. + aS.y * 3.) + aS.z * 50.));
        v.xy += position.xy * sz; gl_Position = projectionMatrix * v; }`,
      fragmentShader: 'uniform vec3 uCol; varying vec2 vQ; varying float vA; void main(){ float a = max(1. - dot(vQ, vQ), 0.); gl_FragColor = vec4(uCol * a * a * vA, 0.); }' }, ADD)));
    motes.frustumCulled = false; motes.renderOrder = 5; scene.add(motes);
    // ---- pushpa-vrishti: the heavens shower flowers. Petals of five colours, tumbling down through the vision and the dawn ----
    const PN = 2600, r3 = rng(6603), PP = new Float32Array(PN * 3), PS = new Float32Array(PN * 4), PC = new Float32Array(PN * 3), cols = [[1.0, 0.36, 0.04], [1.0, 0.16, 0.36], [1.0, 0.86, 0.72], [1.0, 0.66, 0.06], [0.72, 0.28, 1.0]];
    for (let i = 0; i < PN; i++) { PP[i * 3] = r3(); PP[i * 3 + 1] = r3(); PP[i * 3 + 2] = r3(); PS[i * 4] = r3(); PS[i * 4 + 1] = r3(); PS[i * 4 + 2] = r3(); PS[i * 4 + 3] = r3(); PC.set(cols[Math.floor(r3() * 5)], i * 3); }
    const pg = new THREE.InstancedBufferGeometry(); pg.index = g.index; pg.setAttribute('position', g.attributes.position); pg.setAttribute('aP', new THREE.InstancedBufferAttribute(PP, 3)); pg.setAttribute('aS', new THREE.InstancedBufferAttribute(PS, 4)); pg.setAttribute('aC', new THREE.InstancedBufferAttribute(PC, 3)); pg.instanceCount = PN;
    fU = Object.assign({ uAmt: { value: 0 }, uLitP: { value: 1 } }, GL.U);
    const petals = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: fU, side: THREE.DoubleSide, vertexShader: /* glsl */`
      attribute vec3 aP, aC; attribute vec4 aS; uniform float uT, uAmt; varying vec2 vQ; varying vec3 vC; varying float vA;
      void main(){ vec3 box = vec3(56., 24., 60.); vec3 p = aP * box; float fall = .55 + aS.x * .7; p.y -= uT * fall; p.x += sin(uT * (.5 + aS.y) + aS.z * 30.) * .7 - uT * .12; p.z += cos(uT * (.4 + aS.w) + aS.x * 20.) * .5;
        vec3 org = vec3(cameraPosition.x, 0., cameraPosition.z) - vec3(box.x, 0., box.z) * .5 + vec3(0., 0., -box.z * .44); p = mod(p - org, box) + org; p.y = mod(p.y, box.y) + .05;
        float a = uT * (1.5 + aS.y * 2.5) + aS.z * 40., b = uT * (1.1 + aS.w * 2.) + aS.x * 30.;                   // tumbling: the petal turns edge-on and back
        vec2 q = position.xy * vec2(1., .62); q = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a)); q.y *= .25 + .75 * abs(cos(b));
        vec4 v = viewMatrix * vec4(p, 1.); float sz = max(.05 + aS.w * .05, -v.z * .0016); vQ = position.xy * 2.; vC = aC * (.75 + .5 * abs(cos(b)));
        vA = step(aS.z, uAmt) * smoothstep(1.2, 4., -v.z) * (1. - smoothstep(44., 58., -v.z)) * smoothstep(.0, 1.5, box.y - p.y);
        v.xy += q * sz; gl_Position = vA < .01 ? vec4(2., 2., 2., 1.) : projectionMatrix * v; }`,
      fragmentShader: 'uniform float uLitP; varying vec2 vQ; varying vec3 vC; varying float vA; void main(){ float d = dot(vQ, vQ); if (d > 1.) discard; gl_FragColor = vec4(vC * uLitP * (1.15 - d * .45), 1.); }' }));
    petals.frustumCulled = false; scene.add(petals);
    G.tick.push(update); update(0); prog(1);
  }
  function update(t) {
    const S = Film.state(t), cam = G.camera; if (typeof Cast !== 'undefined') Cast.krishnaHeart(heart); else heart.set(0.6, 2.4, 0);
    const wide = lerp(1.4, 9, sstep(Film.T.LIGHT + 2, Film.T.FLASH, t)) + S.flash * 30 + pulse(t, Film.T.RETURN + 2.6, 0.5, 0.9) * 10;
    pillar.visible = S.pillar > 0.002; pillar.position.copy(heart); pillar.position.y -= 2.2; pillar.scale.set(wide * 2, 1800, 1); pillar.rotation.y = Math.atan2(cam.position.x - heart.x, cam.position.z - heart.z); pU.uAmt.value = S.pillar * (0.85 + 0.15 * Math.sin(t * 9));
    sU.uAmt.value = lerp(1, 0.28, sstep(Film.T.MOUTH - 0.05, Film.T.MOUTH + 0.05, t));
    fU.uAmt.value = Math.max(sstep(Film.T.UNFURL, Film.T.UNFURL + 6, t) * 0.6 * (1 - S.fire), sstep(Film.T.RETURN + 1.5, Film.T.RETURN + 7, t)) * sstep(Film.DUR - 0.5, Film.DUR - 4, t); fU.uLitP.value = lerp(1.5, 0.9 + S.vir * 0.9, S.night) + S.flash * 2;
    const m = lerp(1.25, 0.5 + S.vir * 0.9, S.night) + S.flash * 2; mU.uCol.value.set(m, m * lerp(0.66, 0.74, S.night), m * lerp(0.30, 0.42, S.night));
  }
  return { build, fx: null };
})();
