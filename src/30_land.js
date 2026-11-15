'use strict';
// ---- Kurukshetra: the plain ------------------------------------------------------------------------------------------
//   Land.h(x, z)     ground height (pure; the hosts and the chariot stand on it). Flat where the chariot waits.
//   Land.build(scene, prog, tick)
const Land = (() => {
  const h = (x, z) => { const flat = sstep(18, 70, Math.hypot(x, z * 0.5)); return (fbm2(x * 0.006 + 3, z * 0.006 + 8, 3) - 0.5) * 7 * flat * sstep(30, 300, Math.abs(x) + 30) + (fbm2(x * 0.05, z * 0.05, 2) - 0.5) * 0.5 * flat; };
  async function build(scene, prog, tick) {
    const S = 6000, N = 260, g = new THREE.PlaneGeometry(S, S, N, N).rotateX(-Math.PI / 2), p = g.attributes.position;
    // warp the grid so cells are small near the chariot and large at the horizon
    for (let i = 0; i < p.count; i++) { let x = p.getX(i) / (S / 2), z = p.getZ(i) / (S / 2); x = Math.sign(x) * Math.pow(Math.abs(x), 2.4) * S / 2; z = Math.sign(z) * Math.pow(Math.abs(z), 2.4) * S / 2; p.setXYZ(i, x, h(x, z), z); }
    g.computeVertexNormals();
    const m = GL.patch(new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.42, 0.27, 0.15), roughness: 1, metalness: 0, envMapIntensity: 0.3 }), { key: 'land', frag: /* glsl */`
      { vec2 p = vWp.xz; float dist = distance(vWp, cameraPosition);
        float n1 = fbm(p * .035 + 3.), n2 = fbm(p * .42), n3 = vnoise(p * 5.) * (1. - smoothstep(20., 70., dist)) + .5 * smoothstep(20., 70., dist);
        diffuseColor.rgb *= mix(.66, 1.18, n1) * mix(.84, 1.12, n2) * mix(.90, 1.08, n3);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.22, .80, .62), smoothstep(.42, .68, fbm(p * .011 + 11.)));      // red earth
        float lane = 1. - smoothstep(30., 46., abs(p.x));                                                                                  // the open ground between the hosts: paler, wind-scoured
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 1.12, 1.0), lane * .5);
        float rut = smoothstep(.10, .0, abs(abs(p.x + sin(p.y * .03) * 1.6) - .95)) * smoothstep(-4., 4., p.y) * (1. - smoothstep(40., 160., dist));   // the chariot's own wheel tracks, behind it
        diffuseColor.rgb *= 1. - rut * .32;
        float cr = smoothstep(.035, .0, abs(fract(fbm(p * .5) * 9.) - .5)) * (1. - smoothstep(8., 40., dist));                              // sun-cracked crust, close to the lens only
        diffuseColor.rgb *= 1. - cr * .22;
        diffuseColor.rgb *= mix(vec3(1.), vec3(.42, .46, .66), uNight); }` });
    const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh);
    prog(1);
  }
  return { build, h };
})();
