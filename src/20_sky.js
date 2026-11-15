'use strict';
// ---- the sky dome, the light rig, the environment map ---------------------------------------------------------------
//   Sky.build(scene, prog, tick)   dome (follows the lens), sun + hemisphere, a PMREM of the dusk sky for the bronzes
//   reads GL.U every frame (through the shared uniforms), Film.state(t) for the lights, Film.shadowAt(t) for the shadow frame
const Sky = (() => {
  let sun, hemi, dome;
  const HALO = new THREE.Vector3(0, 0.52, -0.86).normalize(), dir = new THREE.Vector3(), sh = { x: 0, z: 0, r: 20 };
  const FS = /* glsl */`
    varying vec3 vD; uniform float uEnv;
    ${GL.NOISE}${GL.AIR}
    vec3 starField(vec3 d, float sc, float thr){ vec3 p = d * sc, i = floor(p), f = fract(p) - .5; float h = hash13(i);
      vec3 o = (vec3(hash13(i + 1.7), hash13(i + 5.1), hash13(i + 9.3)) - .5) * .7; float r = length(f - o);
      float s = smoothstep(thr, 1., h) * smoothstep(.16, .0, r) * (.65 + .35 * sin(uT * (1.5 + h * 3.) + h * 90.));
      return s * mix(vec3(.7, .8, 1.3), vec3(1.3, 1., .7), hash13(i + 3.3)); }
    void main(){
      vec3 d = normalize(vD); vec3 c = skyBase(d);
      float sd = max(dot(d, uSun), 0.), day = 1. - uNight;
      // high streaked cloud, lit from below by the low sun
      vec2 uv = d.xz / (max(d.y, 0.) + .09) * .55; float n = fbm(uv * vec2(1., 2.6) + vec2(uW * .004, 0.));
      float cl = smoothstep(.46, .78, n) * smoothstep(.0, .14, d.y) * .75;
      vec3 cc = mix(vec3(.30, .20, .24), uSunCol * vec3(1.5, 1.05, .8), pow(sd, 2.5) * .9 + .12) + vec3(.9, .16, .03) * uFire * .22;
      c = mix(c, cc, cl * mix(1., .22, uNight));
      c += uSunCol * smoothstep(.99962, .99985, dot(d, uSun)) * 22. * day * (1. - uEnv * .93);     // the disc (weakened for the environment capture: it sparkles otherwise)
      // the night of the vision: stars, and a river of them
      float up = smoothstep(-.02, .2, d.y);
      vec3 ax = normalize(vec3(.55, .35, .76)); float band = exp(-pow(dot(d, ax), 2.) * 9.);
      float neb = fbm3(d * 3.2 + 4.) ; float neb2 = fbm3(d * 7.1 - 2.);
      vec3 st = starField(d, 170., .93) * 2.2 + starField(d, 380., .90) * 1.1 + starField(d, 90., .985) * 5.;
      vec3 nb = (vec3(.44, .16, .66) * neb + vec3(.06, .36, .62) * neb2) * band * .75 + vec3(.6, .22, .10) * pow(neb * neb2, 2.) * band * 2. + vec3(.05, .30, .26) * pow(fbm3(d * 2.1 + 11.), 3.) * 1.2 + vec3(.40, .06, .22) * pow(fbm3(d * 1.7 - 5.), 3.) * 1.2;
      c += (st * (1. + band * 1.6) + nb) * uNight * up * (1. - cl * .8);
      gl_FragColor = vec4(max(c, 0.), 1.);
    }`;
  async function build(scene, prog, tick) {
    const mat = new THREE.ShaderMaterial({ uniforms: Object.assign({ uEnv: { value: 0 } }, GL.U), side: THREE.BackSide, depthWrite: false, depthTest: true,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); gl_Position = p.xyww; }', fragmentShader: FS });
    dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat); dome.frustumCulled = false; dome.renderOrder = -10;
    // the environment the bronzes mirror: the dusk sky, captured once
    const es = new THREE.Scene(); es.add(dome); mat.uniforms.uEnv.value = 1;
    const pm = new THREE.PMREMGenerator(G.R); const env = pm.fromScene(es, 0, 0.1, 100).texture; pm.dispose(); mat.uniforms.uEnv.value = 0;
    scene.add(dome); scene.environment = env; scene.environmentIntensity = 0.5;
    prog(0.6); await tick();
    sun = new THREE.DirectionalLight(0xffffff, 5); sun.castShadow = true; sun.shadow.mapSize.set(3072, 3072); sun.shadow.bias = -0.0002; sun.shadow.radius = 2.2;
    hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(sun, sun.target, hemi);
    G.tick.push(update); prog(1);
  }
  function update(t) {
    const S = Film.state(t), n = S.night;
    dir.copy(GL.SUN).lerp(HALO, S.lift).normalize();
    Film.shadowAt(t, sh); const sc = sun.shadow.camera, r = sh.r;
    sun.target.position.set(sh.x, 0, sh.z); sun.position.copy(dir).multiplyScalar(r * 4 + 60).add(sun.target.position);
    if (sc.right !== r) { sc.left = sc.bottom = -r; sc.right = sc.top = r; sc.near = 10; sc.far = r * 8 + 200; sc.updateProjectionMatrix(); sun.shadow.normalBias = 0.03 + 0.0022 * r; }
    // dusk sun -> the light of the form (paler, from higher) -> dawn
    sun.color.setRGB(lerp(1.0, 1.0, n), lerp(0.60 + S.dawn * 0.12, 0.84, n), lerp(0.30 + S.dawn * 0.16, 0.62, n)); sun.intensity = S.key;
    hemi.color.setRGB(lerp(0.36, 0.09, n) + S.fire * 0.10, lerp(0.44, 0.11, n), lerp(0.66, 0.30, n)); hemi.groundColor.setRGB(lerp(0.36, 0.05, n) + S.fire * 0.22, lerp(0.26, 0.04, n) + S.fire * 0.03, lerp(0.16, 0.07, n));
    hemi.intensity = lerp(1.05, 0.5, n) + S.flash * 2.5;
    G.scene.environmentIntensity = lerp(0.5, 0.16, n);
  }
  return { build, HALO };
})();
