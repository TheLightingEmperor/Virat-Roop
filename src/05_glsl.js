'use strict';
// ---- shared GLSL, the one state of the light and air, and the material patch --------------------------------------
//   GL.U            shared uniforms, written once per frame from Film.state(t) (see the tick at the bottom)
//   GL.NOISE        hash / value noise / fbm
//   GL.AIR          skyBase(dir), fogCol(dir), fogAmt(cam, p): the sky dome AND every material's haze use these, so the
//                   whole frame changes mood together (dusk -> the night of the vision -> fire -> dawn)
//   GL.patch(mat, o) built-in material + our haze + optional hooks: o.pars / o.vert (after begin_vertex) / o.frag (after
//                   color_fragment, may change diffuseColor) / o.emis (after emissivemap_fragment) / o.key
//   GL.SUN          direction TO the sun (it sits low at the far end of the corridor between the hosts)
const GL = (() => {
  const SUN = new THREE.Vector3(0.05, 0.075, -1).normalize();
  const U = { uT: { value: 0 }, uW: { value: 0 }, uSun: { value: SUN.clone() }, uSunCol: { value: new THREE.Vector3(1, 0.55, 0.25) }, uNight: { value: 0 }, uFire: { value: 0 },
    uDust: { value: 0.002 }, uGlowP: { value: new THREE.Vector3(0, 340, -580) }, uGlow: { value: 0 }, uDawn: { value: 0 } };
  const NOISE = /* glsl */`
    #ifndef FX_NOISE
    #define FX_NOISE
    float hash1(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    float hash13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash1(i), hash1(i + vec2(1., 0.)), f.x), mix(hash1(i + vec2(0., 1.)), hash1(i + vec2(1., 1.)), f.x), f.y); }
    float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= .5; } return s; }
    float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * vnoise3(p); p = p * 2.03 + vec3(17.1, 9.7, 4.3); a *= .5; } return s; }
    #endif`;
  const AIR = /* glsl */`
    #ifndef FX_AIR
    #define FX_AIR
    uniform vec3 uSun, uSunCol, uGlowP; uniform float uNight, uFire, uDust, uGlow, uDawn, uT, uW;
    // the colour of the air in a direction. Dusk: a dusty amber horizon under a slate-teal zenith. The vision: indigo night.
    vec3 skyBase(vec3 d){
      float h = max(d.y, 0.), sd = max(dot(d, uSun), 0.);
      vec3 hor = mix(vec3(.60, .22, .075), vec3(.80, .40, .19), uDawn), zen = mix(vec3(.035, .065, .17), vec3(.07, .15, .33), uDawn);
      vec3 c = mix(hor, zen, 1. - exp(-h * 3.4));
      c += uSunCol * (pow(sd, 8.) * .10 + pow(sd, 64.) * .40);
      vec3 n = mix(vec3(.050, .030, .085), vec3(.004, .006, .022), 1. - exp(-h * 2.6));
      c = mix(c, n, uNight);
      c += vec3(.75, .11, .02) * uFire * exp(-h * 5.5) * .30;
      return c;
    }
    vec3 fogCol(vec3 cam, vec3 d){
      vec3 f = normalize(vec3(d.x, abs(d.y) * .25 + .02, d.z));
      vec3 c = skyBase(f);
      vec3 gd = normalize(uGlowP - cam);                                  // the form's radiance scatters forward through the dust
      c += vec3(1., .74, .40) * uGlow * (pow(max(dot(d, gd), 0.), 4.) * .16 + .006);
      return c;
    }
    // how much air lies between the lens and p: a dust layer with a scale height, integrated along the ray in closed form
    float fogAmt(vec3 cam, vec3 p){
      const float H = 26.;
      float d = distance(cam, p), a = exp(-max(cam.y, 0.) / H), b = exp(-max(p.y, 0.) / H), dy = p.y - cam.y;
      float avg = abs(dy) > .5 ? H * (a - b) / dy : a;
      return 1. - exp(-d * (uDust * max(avg, 0.) + .00006));
    }
    #endif`;
  let nPatch = 0;
  function patch(mat, o = {}) {
    const key = o.key || 'p' + (nPatch++);
    mat.customProgramCacheKey = () => key;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U, o.uniforms || {});
      const rep = (src, a, b) => { if (!src.includes(a)) console.warn('patch miss', key, a); return src.replace(a, b); };
      sh.vertexShader = rep(sh.vertexShader, '#include <common>', '#include <common>\nvarying vec3 vWp; uniform float uT, uW;\n' + (o.vpars || ''));
      sh.vertexShader = rep(sh.vertexShader, '#include <begin_vertex>', '#include <begin_vertex>\n' + (o.vert || ''));
      sh.vertexShader = rep(sh.vertexShader, '#include <fog_vertex>', /* glsl */`{ vec4 w4 = vec4(transformed, 1.);
        #ifdef USE_INSTANCING
          w4 = instanceMatrix * w4;
        #endif
        vWp = (modelMatrix * w4).xyz; }`);
      sh.fragmentShader = rep(sh.fragmentShader, '#include <common>', '#include <common>\nvarying vec3 vWp;\n' + NOISE + AIR + '\n' + (o.pars || ''));
      if (o.frag) sh.fragmentShader = rep(sh.fragmentShader, '#include <color_fragment>', '#include <color_fragment>\n' + o.frag);
      if (o.emis) sh.fragmentShader = rep(sh.fragmentShader, '#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + o.emis);
      sh.fragmentShader = rep(sh.fragmentShader, '#include <fog_fragment>', /* glsl */`{ vec3 fd = normalize(vWp - cameraPosition);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol(cameraPosition, fd), fogAmt(cameraPosition, vWp) * ${(o.fog ?? 1).toFixed(2)}); }` + (o.post || ''));
    };
    return mat;
  }
  // one write per frame: the state of the light. Everything that glows, hazes or waves reads these.
  G.tick.unshift(t => { const S = Film.state(t); U.uT.value = t; U.uW.value = S.wind; U.uNight.value = S.night; U.uFire.value = S.fire; U.uGlow.value = S.glow; U.uDawn.value = S.dawn; U.uDust.value = S.dust;
    U.uSunCol.value.set(1, 0.55, 0.25).multiplyScalar(S.sun); });
  return { U, NOISE, AIR, patch, SUN };
})();
