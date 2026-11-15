'use strict';
// ---- the lens: MSAA HDR scene (with a depth texture) -> blur pyramid (bloom) -> grade. A compact starting point. ----
//   Post.init(R); Post.size(w, h); Post.render(scene, camera, P)       P = { exposure, fade, bloom }
//   Post.fxU + Post.GLSL_SOFTZ   for soft particles / mist in an effects scene: fade each fragment against the scene's depth
// The renderer does NO tone mapping and NO colour-space conversion (see 90_main.js): the scene is linear HDR in a
// half-float target, and the last pass here does exposure, tone map, grade and gamma in one place, in a fixed order.
// Grow it in this order when the film needs it: AO at half size, an effects scene drawn onto the resolved image, depth of
// field from two levels of the same pyramid, sun shafts at quarter size (rendering-recipes.md has the numbers).
const Post = (() => {
  let R, W = 4, H = 4, rtScene = null, dn = [], up = [], ray = [];
  const LV = 5;                                                           // pyramid levels; the smallest ones add little: measure before adding more
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));   // one big triangle, not a quad: no diagonal seam
  const qm = new THREE.Mesh(tri); qm.frustumCulled = false; const qs = new THREE.Scene(), qc = new THREE.Camera(); qs.add(qm);
  const VS = 'varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }';
  const mk = (fs, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
  const fxU = { tDepth: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uNF: { value: new THREE.Vector2(0.1, 2000) } };
  const GLSL_SOFTZ = /* glsl */`
    uniform sampler2D tDepth; uniform vec2 uRes; uniform vec2 uNF;
    float sceneZ(vec2 uv){ float z = texture2D(tDepth, uv).x * 2. - 1.; return 2. * uNF.x * uNF.y / (uNF.y + uNF.x - z * (uNF.y - uNF.x)); }
    // viewZ: this fragment's distance in front of the lens (metres, positive). fade: metres over which it melts into what is behind it
    float softZ(float viewZ, float fade){ return clamp((sceneZ(gl_FragCoord.xy / uRes) - viewZ) / fade, 0., 1.); }`;
  // first step down: each tap is weighted against its own brightness, so one HDR pixel (a sun glint) cannot flicker the whole bloom
  const mDown = mk(/* glsl */`uniform sampler2D t; uniform vec2 px; uniform float karis; varying vec2 vUv;
    vec3 tap(vec2 o){ vec3 c = min(texture2D(t, vUv + o * px).rgb, vec3(120.)); return karis > .5 ? c / (1. + dot(c, vec3(.3, .5, .2))) : c; }
    void main(){ vec3 c = (tap(vec2(0.)) * 4. + tap(vec2(-1., -1.)) + tap(vec2(1., -1.)) + tap(vec2(-1., 1.)) + tap(vec2(1., 1.))) / 8.;
      if (karis > .5) c = c / max(1. - dot(c, vec3(.3, .5, .2)), .02); gl_FragColor = vec4(max(c, 0.), 1.); }`, { t: { value: null }, px: { value: new THREE.Vector2() }, karis: { value: 0 } });
  const mUp = mk(/* glsl */`uniform sampler2D t, tD; uniform vec2 px; uniform float mixk; varying vec2 vUv;
    void main(){ vec3 c = texture2D(t, vUv + vec2(-2., 0.) * px).rgb + texture2D(t, vUv + vec2(2., 0.) * px).rgb + texture2D(t, vUv + vec2(0., -2.) * px).rgb + texture2D(t, vUv + vec2(0., 2.) * px).rgb
      + 2. * (texture2D(t, vUv + vec2(-1., -1.) * px).rgb + texture2D(t, vUv + vec2(1., -1.) * px).rgb + texture2D(t, vUv + vec2(-1., 1.) * px).rgb + texture2D(t, vUv + vec2(1., 1.) * px).rgb);
      gl_FragColor = vec4(mix(texture2D(tD, vUv).rgb, c / 12., mixk), 1.); }`, { t: { value: null }, tD: { value: null }, px: { value: new THREE.Vector2() }, mixk: { value: 0.62 } });
  const mRay = mk(/* glsl */`uniform sampler2D t; uniform vec2 uC; uniform float uLen, uThr; varying vec2 vUv;
    void main(){ vec2 d = (uC - vUv) * uLen / 14.; vec3 s = vec3(0.); float w = 0.; vec2 p = vUv; float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      p += d * jit; for (int i = 0; i < 14; i++){ float k = 1. - float(i) / 14.; vec3 c = texture2D(t, p).rgb; if (uThr > 0.) c = max(c - uThr, 0.); s += c * k; w += k; p += d; }
      gl_FragColor = vec4(s / w, 1.); }`, { t: { value: null }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uLen: { value: 0.3 }, uThr: { value: 0 } });
  const mFinal = mk(/* glsl */`uniform sampler2D tScene, tBloom, tRay; uniform vec4 uP; uniform vec4 uK; uniform float uT; varying vec2 vUv;
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
    void main(){
      vec2 q = vUv - .5; float r2 = dot(q, q); vec2 uv = .5 + q * (1. - uK.x * (1. - r2 * 2.));            // the kick: the frame punched toward the lens for a moment
      vec2 ca = q * (r2 * .006 + uK.y * (.004 + r2 * .05));                                                // a sliver of colour split toward the corners; more on a hit
      vec3 c = vec3(texture2D(tScene, uv + ca).r, texture2D(tScene, uv).g, texture2D(tScene, uv - ca).b);
      vec3 bl = texture2D(tBloom, uv).rgb;
      c = mix(c, bl, uP.z);                                                                   // bloom as a MIX with the blurred frame, not an add: it cannot blow out
      c += texture2D(tRay, uv).rgb * uK.z;                                                    // shafts from the sun / from the form
      c *= uP.x * (1. - smoothstep(.12, .78, r2) * .5);                                       // exposure, then the lens darkening toward its corners
      c = aces(c);                                                                            // tone map
      float l = dot(c, vec3(.2126, .7152, .0722));
      c *= mix(vec3(.94, 1.0, 1.06), vec3(1.05, 1.0, .93), smoothstep(.02, .75, l));          // split tone: cool shadows, warm lights
      c = mix(vec3(l), c, 1.12);                                                              // saturation
      c = mix(c, c * c * (3. - 2. * c), .3);                                                  // S-curve
      c = pow(max(c, 0.), vec3(1. / 2.2));                                                    // gamma, last
      float gn = fract(sin(dot(gl_FragCoord.xy + uT * 61., vec2(12.9898, 78.233))) * 43758.5453);
      c += (gn - .5) * .02;                                                                   // grain: hides banding in skies; seeded by film time, so a frame is reproducible
      gl_FragColor = vec4(c * uP.y, 1.);
    }`, { tScene: { value: null }, tBloom: { value: null }, tRay: { value: null }, uP: { value: new THREE.Vector4(1, 1, 0.1, 0) }, uK: { value: new THREE.Vector4(0, 0, 0, 0) }, uT: { value: 0 } });
  const pass = (m, target) => { qm.material = m; R.setRenderTarget(target); R.render(qs, qc); };
  const mkRT = (w, h) => new THREE.WebGLRenderTarget(Math.max(2, w | 0), Math.max(2, h | 0), { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  return {
    fxU, GLSL_SOFTZ, get W() { return W; }, get H() { return H; },
    init(r) { R = r; },
    size(w, h) {
      if (w === W && h === H && rtScene) return; W = w; H = h;
      for (const t of [rtScene, ...dn, ...up, ...ray]) if (t) t.dispose(); ray = [mkRT(w >> 2, h >> 2), mkRT(w >> 2, h >> 2)];
      if (rtScene && rtScene.depthTexture) rtScene.depthTexture.dispose();
      const dt = new THREE.DepthTexture(w, h); dt.type = THREE.UnsignedIntType;
      rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, depthTexture: dt, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      fxU.uRes.value.set(w, h); dn = []; up = [];
      for (let i = 0; i < LV; i++) { dn.push(mkRT(w >> (i + 1), h >> (i + 1))); up.push(i < LV - 1 ? mkRT(w >> (i + 1), h >> (i + 1)) : null); }
    },
    render(scene, camera, P) {
      if (!rtScene) return;                                                 // a collapsed window has no targets yet: draw nothing rather than fail the boot
      fxU.uNF.value.set(camera.near, camera.far); fxU.tDepth.value = rtScene.depthTexture;
      R.setRenderTarget(rtScene); R.clear(); R.render(scene, camera);
      let src = rtScene;
      for (let i = 0; i < LV; i++) { mDown.uniforms.t.value = src.texture; mDown.uniforms.px.value.set(1 / src.width, 1 / src.height); mDown.uniforms.karis.value = i === 0 ? 1 : 0; pass(mDown, dn[i]); src = dn[i]; }
      let prev = dn[LV - 1];
      for (let i = LV - 2; i >= 0; i--) { mUp.uniforms.t.value = prev.texture; mUp.uniforms.tD.value = dn[i].texture; mUp.uniforms.px.value.set(0.5 / prev.width, 0.5 / prev.height); pass(mUp, up[i]); prev = up[i]; }
      const ru = mRay.uniforms, rs = P.rays || 0;
      if (rs > 0.002) { ru.uC.value.set(P.rayX, P.rayY); ru.t.value = dn[1].texture; ru.uLen.value = 0.22; ru.uThr.value = P.rayThr ?? 1.0; pass(mRay, ray[0]); ru.t.value = ray[0].texture; ru.uLen.value = 0.6; ru.uThr.value = 0; pass(mRay, ray[1]); }
      const u = mFinal.uniforms; u.tScene.value = rtScene.texture; u.tBloom.value = prev.texture; u.tRay.value = ray[1].texture; u.uK.value.set(P.kick || 0, P.fringe || 0, rs > 0.002 ? rs : 0, 0);
      u.uP.value.set(P.exposure ?? 1, P.fade ?? 1, P.bloom ?? 0.1, 0); u.uT.value = (G.t * 60) % 977;
      pass(mFinal, null);
    } };
})();
