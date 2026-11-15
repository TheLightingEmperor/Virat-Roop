'use strict';
// ---- the film: beat sheet, the state of the light, shots, camera, words ---------------------------------------------
//   Film.DUR, Film.T      length and NAMED times (3 s bars at 80 bpm; every cut is on a bar line). Picture and score read T.
//   Film.state(t)         the one state of light and air at t (pure): { night, vir, lift, fire, glow, key, sun, dawn, dust, wind, flash, pillar, ... }
//   Film.apply(t, cam)    camera + Film.post for film time t (pure)
//   Film.shadowAt(t, o)   where the sun's shadow frame sits for this shot
//   Film.words(t)         the lines on screen: [{ a, sa, en }]   Film.overlay paints the same for the recorder
// WORLD: the chariot stands at the origin facing -Z, down the open ground between the hosts (Pandavas x < -45, Kauravas
// x > 45). The sun sits low at the far end of that corridor; the form rises there, at Film.FORM, 430 m to its crown.
const Film = (() => {
  const DUR = 84;
  const T = { TITLE: 0, CHARIOT: 9, KRISHNA: 18, STILL: 24, LIGHT: 27, FLASH: 33, UNFURL: 36, CLOSE: 45, KALA: 54, MOUTH: 60, RETURN: 66, DAWN: 75, END: 84 };
  const CUT = { chariot: T.CHARIOT, krishna: T.KRISHNA, light: T.LIGHT, vision: T.FLASH, close: T.CLOSE, kala: T.KALA, mouth: T.MOUTH, ret: T.RETURN, dawn: T.DAWN };
  const scale = [0.9, 0.9, 0.9, 0.9, 0.85, 0.85, 0.85, 0.85, 0.9, 0.9];
  const FORM = new THREE.Vector3(0, 0, -560), FORM_H = 470, FK = FORM_H / 2.15, fy = u => u * FK - 14;      // fy: a height on the icon (figure metres) -> world
  const post = { exposure: 1, fade: 1, bloom: 0.1, kick: 0, fringe: 0, rays: 0, rayX: 0.5, rayY: 0.5 };
  // ---- wind: the mortal world's clock. It runs, stops when Krishna lifts his hand (banners hang, dust stands in the air),
  // and starts again when the vision closes. Phase = the integral of speed, tabulated once so nothing jumps.
  const windSpeed = t => 1 - win(t, T.STILL - 2.5, T.RETURN + 4, 3, 4.5);
  const WT = new Float32Array(DUR * 60 + 2); for (let i = 1; i < WT.length; i++) WT[i] = WT[i - 1] + windSpeed((i - 0.5) / 60) / 60;
  const windAt = t => { const x = clamp(t, 0, DUR) * 60, i = Math.min(x | 0, WT.length - 2); return lerp(WT[i], WT[i + 1], x - i); };
  const S = { night: 0, vir: 0, lift: 0, fire: 0, glow: 0, key: 5, sun: 1, dawn: 0, dust: 0.002, wind: 0, flash: 0, pillar: 0, unfurl: 0, still: 0, mouth: 0, t: -1 };
  function state(t) {
    if (S.t === t) return S; S.t = t;
    S.wind = windAt(t); S.still = 1 - windSpeed(t);
    S.night = Math.max(sstep(T.LIGHT, T.FLASH, t) * 0.62, sstep(T.FLASH - 0.05, T.FLASH + 0.6, t)) * sstep(T.RETURN + 6.5, T.RETURN + 1, t);
    S.vir = sstep(T.FLASH, T.FLASH + 5, t) * sstep(T.RETURN + 4, T.RETURN + 0.3, t);                 // how much of the form has come out of the light
    S.unfurl = sstep(T.UNFURL, T.UNFURL + 7.5, t) * sstep(T.RETURN + 3, T.RETURN, t);              // the arms and faces opening
    S.lift = sstep(T.LIGHT + 3, T.FLASH + 2, t) * sstep(T.RETURN + 6, T.RETURN + 1.5, t);           // the key light climbing from the sun to the form's radiance
    S.fire = win(t, T.KALA - 0.5, T.RETURN + 1, 4, 2.5);
    S.mouth = win(t, T.KALA, T.RETURN + 0.5, 3, 1.5);
    S.pillar = Math.max(win(t, T.LIGHT, T.FLASH + 4, 5.5, 3.5), win(t, T.RETURN, T.RETURN + 6, 2.5, 3));
    S.flash = pulse(t, T.FLASH, 0.05, 0.55) + pulse(t, T.FLASH + 0.11, 0.03, 0.2) * 0.4 + pulse(t, T.KALA, 0.08, 0.5) * 0.5 + pulse(t, T.RETURN + 2.6, 0.5, 0.9) * 0.55;
    S.glow = S.vir * (0.9 + 0.1 * Math.sin(t * 0.9)) + S.pillar * 0.25;
    S.dawn = sstep(T.RETURN + 3, T.DAWN + 3, t);
    S.sun = (1 - S.night) * (1 + S.dawn * 0.25);
    S.key = lerp(5.2 + S.dawn * 0.6, 0.9 + S.fire * 0.4, S.night) + S.flash * 5;
    S.dust = 0.002 * (1 - S.night * 0.3);
    return S;
  }
  // ---- camera ----
  const eye = new THREE.Vector3(), tgt = new THREE.Vector3(), rp = new THREE.Vector3(), HALOC = new THREE.Vector3(0, fy(1.62), FORM.z - 20);
  const shotOf = t => { let i = 0; for (const k in CUT) if (t >= CUT[k]) i++; return i; };
  const DBG = Q.get('cam') ? Q.get('cam').split(',').map(Number) : null;   // ?cam=ex,ey,ez,tx,ty,tz[,fov]
  const E = (u, a, b) => eye.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u));
  const L = (u, a, b) => tgt.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u));
  const seg = (t, a, b) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u) * 0.7 + u * 0.3; };   // mostly eased, never quite at rest: a crane that is always travelling
  function apply(t, cam) {
    let fov = 35, roll = 0; const s = state(t);
    if (t < T.CHARIOT) { const u = seg(t, 0, T.CHARIOT);                       // 1 KURUKSHETRA: a long crane down the open ground between the hosts, to one chariot standing alone
      E(u, [0, 30, 235], [0, 7, 105]); L(u, [0, 10, -60], [0, 5, 0]); fov = lerp(30, 26, u);
    } else if (t < T.KRISHNA) { const u = seg(t, T.CHARIOT, T.KRISHNA);        // 2 THE CHARIOT: the whole car and its horses, in profile like a frieze. Arjuna lowers the bow and sinks
      E(u, [0.2, 2.6, 19.5], [1.4, 2.5, 15]); L(u, [1.7, 2.35, 0], [0.9, 2.25, 0]); fov = lerp(27, 25, u);
    } else if (t < T.LIGHT) { const u = seg(t, T.KRISHNA, T.LIGHT);            // 3 KRISHNA: the sun behind his head. He turns, he lifts his hand, the wind stops
      E(u, [0.9, 2.25, 8.4], [0.25, 2.2, 6.6]); L(u, [0.0, 2.75, 0], [-0.1, 2.8, 0]); fov = lerp(23, 21, u);
    } else if (t < T.FLASH) { const u = seg(t, T.LIGHT, T.FLASH);              // 4 LIGHT: he opens his arms; a column of light stands up out of him; the lens falls back and looks up
      E(u, [0.3, 2.4, 8.5], [0.5, 1.5, 17.5]); L(u, [0.3, 2.9, 0], [0.5, 5.9, 0]); fov = lerp(26, 37, u);
    } else if (t < T.CLOSE) { const u = seg(t, T.FLASH, T.CLOSE);              // 5 THE FORM: one small kneeling man; the hosts; and the sky is a person
      E(u, [1.6, 1.0, 32], [0.5, 1.3, 25.5]); L(u, [0, 92, -300], [0, 106, -300]); fov = lerp(51, 48, u);
    } else if (t < T.KALA) { const u = seg(t, T.CLOSE, T.KALA);                // 6 THE COSMOS: rising up the body: worlds turning in the chest, the wheel of arms, the faces
      E(u, [-42, 70, -40], [34, 250, -100]); L(u, [0, fy(0.95), FORM.z], [0, fy(1.74), FORM.z]); fov = lerp(33, 28, u);
    } else if (t < T.MOUTH) { const u = seg(t, T.KALA, T.MOUTH);               // 7 KALA: over the Kaurava host. The warriors' lights lift out of the ranks like rivers running to one sea
      E(u, [78, 13, 124], [60, 22, 92]); L(u, [0, 150, -300], [0, 196, -380]); fov = lerp(47, 43, u);
    } else if (t < T.RETURN) { const u = seg(t, T.MOUTH, T.RETURN);            // 8 THE MOUTH: close on the face of Time; the streams pour in
      E(u, [-30, fy(1.55), -150], [10, fy(1.72), -205]); L(u, [0, fy(1.80), FORM.z], [0, fy(1.76), FORM.z]); fov = lerp(21, 17.5, u);
    } else if (t < T.DAWN) { const u = seg(t, T.RETURN, T.DAWN);               // 9 THE RETURN: the form folds back into the gentle one. Arjuna, hands joined
      E(u, [-1.4, 2.5, 10.4], [-0.4, 2.55, 7.8]); L(u, [-0.1, 2.7, 0], [-0.15, 2.75, 0]); fov = lerp(25, 23, u);
    } else { const u = seg(t, T.DAWN, T.END);                                  // 10 DAWN: wide, rising. The banners move again. He stands and lifts the bow
      const u2 = u * u; E(u2, [0.4, 2.7, 12.5], [0, 12, 50]); L(u2, [0.6, 3.3, 0], [0, 6, -40]); fov = lerp(30, 34, u2); }
    const D = window.__cam || DBG;
    if (D) { eye.set(D[0], D[1], D[2]); tgt.set(D[3], D[4], D[5]); fov = D[6] || fov; }
    // grade pulses
    const dip = win(t, T.FLASH - 0.09, T.FLASH - 0.005, 0.04, 0.004);                                // the frame before the flash goes dark: contrast from the dip
    post.exposure = (0.92 + s.flash * 1.5 - dip * 0.45);
    post.bloom = 0.09 + s.vir * 0.02 + s.flash * 0.18;
    post.kick = pulse(t, T.FLASH, 0.04, 0.3) * 0.05 + pulse(t, T.KALA, 0.06, 0.3) * 0.025;
    post.fringe = pulse(t, T.FLASH, 0.03, 0.28) + pulse(t, T.KALA, 0.05, 0.25) * 0.6;
    post.fade = Math.min(sstep(0, 2.2, t), sstep(DUR - 0.2, DUR - 2.6, t));
    const sk = (pulse(t, T.FLASH, 0.05, 0.9) * 0.012 + pulse(t, T.KALA, 0.2, 1.4) * 0.004 + win(t, T.LIGHT + 2, T.FLASH, 3, 0.1) * 0.0022) * fov / 35;
    cam.position.copy(eye); cam.up.set(0, 1, 0); cam.fov = fov; cam.lookAt(tgt);
    const b = fov / 35 * 0.0014; cam.rotateX(Math.sin(t * 0.83) * b + Math.sin(t * 2.1 + 1) * b * 0.4 + Math.sin(t * 61) * sk); cam.rotateY(Math.sin(t * 0.61 + 2) * b + Math.sin(t * 47 + 1) * sk); cam.rotateZ(roll);
    // where the shafts come from: the sun; in the vision, the heart of the halo
    cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    if (s.night < 0.5) rp.copy(GL.SUN).multiplyScalar(5000).add(cam.position); else rp.copy(HALOC);
    rp.project(cam); const on = rp.z < 1 ? sstep(1.9, 1.1, Math.max(Math.abs(rp.x), Math.abs(rp.y))) : 0;
    post.rayX = rp.x * 0.5 + 0.5; post.rayY = rp.y * 0.5 + 0.5; post.rays = on * (lerp(0.26, 0.0, sstep(0.2, 0.6, s.night)) + s.vir * sstep(0.5, 1, s.night) * 0.045 * (1 - s.fire * 0.5) + s.flash * 0.5); post.rayThr = lerp(2.2, 1.6, s.night);
  }
  function shadowAt(t, o) {
    if (t < T.CHARIOT || t >= T.DAWN) { o.x = 0; o.z = 40; o.r = 70; } else if (t >= T.FLASH && t < T.CLOSE) { o.x = 0; o.z = 12; o.r = 30; }
    else if (t >= T.CLOSE && t < T.RETURN) { o.x = 40; o.z = 60; o.r = 120; } else { o.x = 1; o.z = 8; o.r = 16; }
    return o;
  }
  // ---- words. The verses are from the eleventh chapter of the Bhagavad Gita; the English is ours.
  const LINES = [
    { a: 20.2, b: 26.4, sa: 'पश्य मे पार्थ रूपाणि शतशोऽथ सहस्रशः', en: 'Behold my forms, Arjuna — by the hundreds, by the thousands.' },
    { a: 38.0, b: 44.4, sa: 'दिवि सूर्यसहस्रस्य भवेद्युगपदुत्थिता', en: 'If a thousand suns were to rise at once in the sky…' },
    { a: 55.5, b: 65.0, sa: 'कालोऽस्मि लोकक्षयकृत्प्रवृद्धः', en: 'I am Time, grown vast, the unmaker of worlds.' } ];
  const title = t => win(t, 1.6, 7.6, 1.6, 1.4);
  const words = t => { for (const l of LINES) if (t > l.a && t < l.b) return { a: win(t, l.a, l.b, 1.2, 1.2), sa: l.sa, en: l.en }; return null; };
  function overlay(ctx, t, W, Hh) {
    const a = title(t), w = words(t); ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = Hh * 0.03;
    if (a > 0.002) { ctx.globalAlpha = a; ctx.fillStyle = '#ffe2b0'; ctx.font = '400 ' + Math.round(Hh * 0.15) + 'px Jaini, serif'; ctx.fillText('विराट रूप', W / 2, Hh * 0.70);
      ctx.font = '400 ' + Math.round(Hh * 0.021) + 'px Georgia, serif'; ctx.fillStyle = '#f3d6a8'; if ('letterSpacing' in ctx) ctx.letterSpacing = Math.round(Hh * 0.012) + 'px'; ctx.fillText('THE UNIVERSAL FORM', W / 2, Hh * 0.82); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; }
    if (w) { ctx.globalAlpha = w.a; ctx.save(); ctx.shadowBlur = 0; ctx.translate(W / 2, Hh * 0.875); ctx.scale(W * 0.46, Hh * 0.09); const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(8,4,2,.62)'); gr.addColorStop(0.55, 'rgba(8,4,2,.34)'); gr.addColorStop(1, 'rgba(8,4,2,0)'); ctx.fillStyle = gr; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
      ctx.fillStyle = '#ffe2b0'; ctx.font = '400 ' + Math.round(Hh * 0.05) + 'px Jaini, serif'; ctx.fillText(w.sa, W / 2, Hh * 0.845);
      ctx.font = 'italic 400 ' + Math.round(Hh * 0.024) + 'px Georgia, serif'; ctx.fillStyle = '#f1dcbd'; ctx.fillText(w.en, W / 2, Hh * 0.905); }
    ctx.restore();
  }
  return { DUR, T, CUT, scale, FORM, FORM_H, FK, fy, post, state, apply, shadowAt, shotOf, title, words, overlay, windSpeed };
})();
