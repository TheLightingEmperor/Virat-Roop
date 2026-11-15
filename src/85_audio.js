'use strict';
// ---- the score: synthesised in code, rendered once into a stereo buffer, driven by the film's own beat sheet ---------
//   Score.prepare()   start rendering (in a worker; the loader does not wait)      Score.play(tFn) / pause() / resume(t) / toggle()
//   Score.time()      film time now being heard          Score.playing, Score.ready          Score.synth(sr, dur, T) -> [L, R]
// 80 beats a minute: a beat is 0.75 s, a bar 3 s, and every cut of the film sits on a bar line.
// The plan: conches and a tanpura over the waiting hosts; a bamboo flute when Krishna turns; the wind stops and so does
// nearly everything; a column of sound rises with the light, is CUT for a breath, and the form arrives as gong, drums and
// a choir of fifths; Time darkens the mode and drives the drums; then the flute again, and morning.
// synth() is self-contained (it is turned into a worker from its own source text): no reference to anything outside it.
const Score = (() => {
  function synth(sr, DUR, T) {
    const N = Math.round(DUR * sr), L = new Float32Array(N), R = new Float32Array(N), SL = new Float32Array(N), SR = new Float32Array(N), TAU = Math.PI * 2;
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12), clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
    // mix a mono buffer in at time t with gain, pan (0..1) and reverb send; tails wrap round the end so the loop is seamless
    const put = (buf, t, g, pan = 0.5, send = 0.3) => { const o = Math.round(t * sr), gl = g * Math.cos(pan * Math.PI / 2), gr = g * Math.sin(pan * Math.PI / 2); for (let i = 0; i < buf.length; i++) { const j = (o + i) % N, v = buf[i]; L[j] += v * gl; R[j] += v * gr; SL[j] += v * gl * send; SR[j] += v * gr * send; } };
    // ---- instruments ----
    function tanpura(f, len = 6.5) { const n = Math.round(len * sr), b = new Float32Array(n), P = 22; for (let k = 1; k <= P; k++) { const w = TAU * f * k * (1 + 0.00012 * k * k) / sr, pk = 6 + 9 * Math.exp(-0.0 ), a0 = 1 / Math.pow(k, 0.85); let ph = k * 1.3;
        for (let i = 0; i < n; i++) { const t = i / sr, sweep = Math.exp(-Math.pow((k - (3 + 15 * Math.exp(-t * 1.3))) / 3.2, 2)); b[i] += Math.sin(ph) * a0 * (0.25 + 1.6 * sweep) * Math.exp(-t * (0.42 + k * 0.035)) * Math.min(t * 90, 1); ph += w; } } return b; }
    function drum(f0, f1, dec, noise = 0.3, len = 1.6) { const n = Math.round(len * sr), b = new Float32Array(n); let ph = 0, lp = 0; for (let i = 0; i < n; i++) { const t = i / sr, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / sr; lp += (rnd() - lp) * 0.25;
        b[i] = Math.tanh((Math.sin(ph) + 0.35 * Math.sin(ph * 1.59) * Math.exp(-t * 9) + 0.2 * Math.sin(ph * 2.31) * Math.exp(-t * 14)) * 1.6) * Math.exp(-t * dec) + lp * noise * Math.exp(-t * 34); } return b; }
    function gong(f, len = 11) { const n = Math.round(len * sr), b = new Float32Array(n), PR = [1, 1.48, 2.02, 2.41, 2.74, 3.31, 4.07, 5.2, 6.4], AM = [1, 0.7, 0.55, 0.3, 0.45, 0.3, 0.22, 0.14, 0.08];
      for (let k = 0; k < PR.length; k++) for (const det of [1, 1.004]) { const w = TAU * f * PR[k] * det / sr; let ph = k * 2.1; const d = 0.22 + k * 0.11; for (let i = 0; i < n; i++) { const t = i / sr; b[i] += Math.sin(ph) * AM[k] * 0.5 * Math.exp(-t * d) * (1 - Math.exp(-t * (30 + k * 30)) * 0.0) * Math.min(t * 200, 1); ph += w; } } return b; }
    function bell(f, len = 2.6) { const n = Math.round(len * sr), b = new Float32Array(n), PR = [1, 2.0, 3.01, 4.2, 5.43], AM = [1, 0.5, 0.3, 0.2, 0.1]; for (let k = 0; k < 5; k++) { const w = TAU * f * PR[k] / sr; let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; b[i] += Math.sin(ph) * AM[k] * Math.exp(-t * (1.6 + k * 1.3)) * Math.min(t * 400, 1); ph += w; } } return b; }
    function conch(f, len) { const n = Math.round(len * sr), b = new Float32Array(n); let ph = 0, lp = 0, lp2 = 0; for (let i = 0; i < n; i++) { const t = i / sr, u = t / len, ff = f * (0.93 + 0.07 * ss(0, 0.5, t)) * (1 + 0.004 * Math.sin(t * 31)); ph += TAU * ff / sr;
        const env = ss(0, 0.5, t) * ss(len, len - 0.9, t) * (0.8 + 0.2 * Math.sin(t * 2.2)); let v = 0; for (let k = 1; k <= 9; k++) { const fk = ff * k, form = Math.exp(-Math.pow((fk - 640) / 330, 2)) + 0.5 * Math.exp(-Math.pow((fk - 1500) / 420, 2)) + 0.12; v += Math.sin(ph * k + k) * form / Math.sqrt(k); }
        lp += (rnd() - lp) * 0.2; lp2 += (lp - lp2) * 0.12; b[i] = (v * 0.4 + lp2 * 0.5 * (0.4 + u)) * env; } return b; }
    // one gliding voice: notes [beat, midi, beats]. A flute: sine + breath-dependent harmonics, breath noise, late vibrato.
    function flute(notes, t0, beat, vol, pan, send) { const end = notes[notes.length - 1][0] + notes[notes.length - 1][2] + 1.5, n = Math.round(end * beat * sr), b = new Float32Array(n); let ph = 0, m = notes[0][1] - 1.5, amp = 0, bp1 = 0, bp2 = 0, vt = 0;
      for (let i = 0; i < n; i++) { const tb = i / sr / beat; let cur = null; for (const q of notes) if (tb >= q[0] && tb < q[0] + q[2]) { cur = q; break; }
        const target = cur ? cur[1] : m, on = cur ? 1 : 0; m += (target - m) * (cur ? 0.00042 : 0.0); if (cur && amp < 0.02 && tb - cur[0] < 0.02) { m = cur[1] - 1.2; vt = 0; } if (cur) vt += 1 / sr; amp += (on * Math.min(1, 0.55 + (cur ? 0.45 * Math.sin(Math.PI * clamp((tb - cur[0]) / cur[2])) : 0)) - amp) * (on ? 0.0007 : 0.0003);
        const vib = Math.sin(i / sr * TAU * 5.1) * 0.16 * ss(0.25, 0.8, vt), f = mtof(m + vib); ph += TAU * f / sr; const x = rnd(); bp1 += (x - bp1) * clamp(f * 2.6 / sr * 6.28, 0, 0.9); bp2 += (bp1 - bp2) * 0.3; const breath = (bp1 - bp2);
        b[i] = (Math.sin(ph) + amp * 0.42 * Math.sin(ph * 2) + amp * amp * 0.16 * Math.sin(ph * 3) + amp * 0.05 * Math.sin(ph * 4) + breath * (0.5 + 0.5 * amp)) * amp; }
      put(b, t0, vol, pan, send); }
    // a choir of slow voices: each note a pair of detuned stacks of harmonics, weighted toward an open vowel
    function pad(t0, t1, midis, vol, bright = 1, att = 2.5, rel = 3.5, send = 0.5) { const n = Math.round((t1 - t0 + rel) * sr), b = new Float32Array(n); midis.forEach((mm, vi) => { for (const det of [0.9982, 1.0021]) { const f = mtof(mm) * det, H = Math.min(12, Math.floor(5200 / f)); const w = [], ph = [];
          for (let k = 1; k <= H; k++) { const fk = f * k; w.push((Math.exp(-Math.pow((fk - 520) / 300, 2)) * 1.0 + Math.exp(-Math.pow((fk - 1150) / 380, 2)) * 0.45 * bright + 0.16 / k) / Math.sqrt(k)); ph.push(vi * 1.7 + k); }
          const dw = TAU * f / sr; for (let i = 0; i < n; i++) { const t = i / sr, e = ss(0, att, t) * ss(t1 - t0 + rel, t1 - t0, t) * (0.85 + 0.15 * Math.sin(t * (0.5 + vi * 0.13) + vi)); if (e < 1e-4) continue; let v = 0; const p0 = dw * i; for (let k = 0; k < H; k++) v += Math.sin(p0 * (k + 1) + ph[k]) * w[k]; b[i] += v * e; } } });
      put(b, t0, vol / Math.sqrt(midis.length), 0.5, send); const o = Math.round(t0 * sr), wd = Math.round(0.011 * sr); for (let i = 0; i < n; i++) { const j = (o + i) % N, k = (j + wd) % N; R[k] += b[i] * vol * 0.22 / Math.sqrt(midis.length); L[j] -= 0; } }
    function noiseSweep(t0, t1, vol, f0, f1) { const n = Math.round((t1 - t0) * sr), b = new Float32Array(n); let lp = 0, bp = 0; for (let i = 0; i < n; i++) { const u = i / n, fc = f0 * Math.pow(f1 / f0, u), a = clamp(fc / sr * 6.28, 0, 0.9); lp += (rnd() - lp) * a; bp += (lp - bp) * a * 0.3; b[i] = (lp - bp) * u * u * (1 - ss(0.985, 1, u) * 0); } put(b, t0, vol, 0.5, 0.35); }
    const B = 0.75, D2 = 38, D3 = 50, D4 = 62, D5 = 74;
    // ---- tanpura: Pa Sa' Sa' Sa, a string every beat and a half, the whole film. It thins when the wind stops. ----
    const strings = [tanpura(mtof(45)), tanpura(mtof(50)), tanpura(mtof(50) * 1.003), tanpura(mtof(38))];
    for (let t = 0, i = 0; t < DUR; t += B * 1.5, i++) { const still = ss(T.STILL - 2, T.STILL, t) * ss(T.FLASH, T.FLASH - 1, t), vis = ss(T.FLASH, T.FLASH + 2, t) * ss(T.RETURN + 2, T.RETURN, t); put(strings[i % 4], t, 0.085 * (1 - still * 0.55) * (1 - vis * 0.5) * (0.6 + 0.4 * ss(0, 4, t)), 0.35 + 0.3 * ((i % 4) / 3), 0.45); }
    // ---- the hosts: conches answer each other across the field; kettledrums far off ----
    put(conch(mtof(57), 3.6), 0.9, 0.20, 0.2, 0.6); put(conch(mtof(57) * 1.5, 3.0), 3.9, 0.12, 0.82, 0.7); put(conch(mtof(55), 2.6), 6.4, 0.07, 0.65, 0.8); put(conch(mtof(57), 3.4), T.DAWN + 2.0, 0.10, 0.3, 0.8);
    const nag = drum(92, 46, 4.2, 0.35), nagS = drum(120, 62, 7, 0.4, 0.9), big = drum(70, 30, 2.2, 0.5, 3.2), tom = drum(170, 95, 9, 0.5, 0.7);
    for (let bar = 0; bar < 8; bar++) { const t = bar * 3; put(nag, t, bar < 6 ? 0.34 : 0.34 * (1 - (bar - 5) * 0.3), 0.45, 0.45); if (bar < 6) { put(nagS, t + B * 2.5, 0.14, 0.6, 0.4); put(nagS, t + B * 3.5, 0.10, 0.55, 0.4); } }
    // ---- the flute: when he turns to his friend ----
    flute([[1, 69, 2], [3, 71, 1], [4, 74, 3], [7.5, 76, 0.5], [8, 78, 1.5], [9.5, 76, 0.5], [10, 74, 2.6]], T.KRISHNA, B, 0.13, 0.56, 0.55);
    // ---- the light: a column of sound stands up with it ----
    pad(T.LIGHT, T.FLASH - 0.25, [D3, D3 + 7, D4, D4 + 7, D5], 0.10, 1.4, 5.5, 0.12, 0.6); noiseSweep(T.LIGHT + 1, T.FLASH - 0.12, 0.30, 180, 7000);
    { const n = Math.round(5.8 * sr), b = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const u = i / n; ph += TAU * (38 * Math.pow(4, u * u)) / sr; b[i] = Math.sin(ph) * u * u * 0.9; } put(b, T.FLASH - 5.9, 0.26, 0.5, 0.2); }
    for (let i = 0; i < 14; i++) { const u = i / 13; put(bell(mtof([74, 81, 86, 78, 83, 90][i % 6])), T.LIGHT + 0.8 + u * u * 4.6, 0.02 + u * 0.05, 0.2 + 0.6 * ((i * 7) % 10) / 10, 0.7); }
    // ---- the form: gong, the great drum, a choir of fifths; then its slow theme ----
    const G = gong(mtof(26)), G2 = gong(mtof(33), 8);
    put(G, T.FLASH, 0.42, 0.5, 0.6); put(big, T.FLASH, 0.9, 0.5, 0.5); put(big, T.FLASH + 0.11, 0.4, 0.4, 0.5); put(G2, T.UNFURL, 0.2, 0.6, 0.6);
    pad(T.FLASH, T.KALA - 0.2, [D2, D2 + 7, D3, D3 + 7], 0.16, 0.8, 0.5, 1.5, 0.55);
    const theme = [[0, 62, 4], [4, 69, 4], [8, 71, 2], [10, 69, 2], [12, 66, 2], [14, 69, 2]];
    for (const [b0, m, len] of theme) { pad(T.FLASH + b0 * B, T.FLASH + (b0 + len) * B - 0.3, [m, m + 12], 0.15, 1.5, 0.5, 1.2, 0.6); pad(T.FLASH + b0 * B, T.FLASH + (b0 + len) * B - 0.3, [m - 12 + 7], 0.05, 1.0, 0.6, 1.2, 0.6); }
    for (let bar = 1; bar < 4; bar++) { put(big, T.FLASH + bar * 3, 0.55, 0.5, 0.5); put(nag, T.FLASH + bar * 3 + B * 3, 0.3, 0.4, 0.5); put(nagS, T.FLASH + bar * 3 + B * 3.5, 0.2, 0.6, 0.5); }
    // ---- the cosmos: bells like struck strings, the choir an octave up, the flute above it ----
    pad(T.CLOSE, T.KALA - 0.3, [D4, D4 + 7, D5, D5 + 4], 0.11, 1.3, 1.5, 1.2, 0.65); put(G2, T.CLOSE, 0.16, 0.4, 0.6);
    const arp = [74, 78, 81, 86, 83, 81, 78, 81]; for (let i = 0; i < 24; i++) put(bell(mtof(arp[i % 8] + (i % 16 >= 8 ? 2 : 0) * 0)), T.CLOSE + i * B * 0.5, 0.055, 0.25 + 0.5 * ((i * 3) % 8) / 8, 0.6);
    flute([[2, 81, 3], [5, 83, 1], [6, 86, 4], [10.3, 83, 0.7], [11, 81, 1]], T.CLOSE, B, 0.085, 0.42, 0.7);
    // ---- Time: the mode darkens (the second and third fall), and the drums do not stop ----
    put(G, T.KALA, 0.36, 0.5, 0.6); put(big, T.KALA, 0.8, 0.5, 0.5);
    const dark = [[0, 50, 4], [4, 51, 4], [8, 50, 2], [10, 53, 2], [12, 51, 4]];
    for (const [b0, m, len] of dark) { pad(T.KALA + b0 * B, T.KALA + (b0 + len) * B - 0.2, [m - 12, m, m + 7, m + 12], 0.17, 0.9 + b0 * 0.05, 0.35, 0.9, 0.5); }
    for (let i = 0; i < 16; i++) { const t = T.KALA + i * B, acc = i % 4 === 0, k = 0.5 + 0.5 * i / 15; put(acc ? big : nag, t, (acc ? 0.6 : 0.34) * k, 0.5, 0.4); put(tom, t + B * 0.5, 0.16 * k, 0.3, 0.35); if (i % 2) { put(tom, t + B * 0.75, 0.13 * k, 0.7, 0.35); } if (i >= 12) put(tom, t + B * 0.25, 0.14 * k, 0.6, 0.3); }
    { const n = Math.round(12 * sr), b = new Float32Array(n); let ph = 0, lp = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += TAU * (36.7 + Math.sin(t * 0.7) * 0.6) / sr; lp += (rnd() - lp) * 0.02; b[i] = (Math.tanh(Math.sin(ph) * 2.2 + Math.sin(ph * 2.01) * 0.6) * 0.5 + lp * 2.2) * ss(0, 3, t) * ss(12, 10.6, t); } put(b, T.KALA, 0.2, 0.5, 0.25); }
    noiseSweep(T.RETURN - 4.5, T.RETURN - 0.1, 0.22, 240, 5200);
    // ---- the return: the last stroke rings away into the major; the flute, close and plain; morning ----
    put(G2, T.RETURN, 0.26, 0.5, 0.7); put(big, T.RETURN, 0.6, 0.5, 0.6);
    pad(T.RETURN + 0.5, T.END - 3.5, [D3, D3 + 7, D4, D4 + 4], 0.085, 0.9, 3, 3.2, 0.6);
    flute([[3, 78, 2], [5, 76, 1], [6, 74, 3], [9.5, 71, 0.5], [10, 69, 2], [12, 74, 4.5], [17.5, 76, 0.5], [18, 78, 1], [19, 81, 3]], T.RETURN, B, 0.13, 0.56, 0.55);
    for (let i = 0; i < 6; i++) put(bell(mtof([74, 81, 78, 86, 81, 74][i])), T.DAWN + 0.75 + i * B * 1.5, 0.04, 0.3 + 0.08 * i, 0.7);
    put(nag, T.DAWN, 0.26, 0.5, 0.5); put(nag, T.DAWN + 6, 0.2, 0.5, 0.6);
    // ---- the room: four combs and two all-passes a side ----
    for (const [S, O, dl] of [[SL, L, [1557, 1617, 1491, 1422, 225, 556]], [SR, R, [1601, 1669, 1529, 1447, 241, 579]]]) { const k = sr / 44100, cb = dl.slice(0, 4).map(d => ({ b: new Float32Array(Math.round(d * 1.9 * k)), i: 0, lp: 0 })), ap = dl.slice(4).map(d => ({ b: new Float32Array(Math.round(d * k)), i: 0 }));
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) { const x = S[i]; let y = 0; for (const c of cb) { const o = c.b[c.i]; c.lp += (o - c.lp) * 0.32; c.b[c.i] = x + c.lp * 0.865; c.i = (c.i + 1) % c.b.length; y += o; } y *= 0.25;
        for (const a of ap) { const o = a.b[a.i], v = y + o * 0.5; a.b[a.i] = v; a.i = (a.i + 1) % a.b.length; y = o - v * 0.5; } if (pass) O[i] += y * 0.9; } }
    // ---- composed silence, then the master ----
    for (let i = 0; i < N; i++) { const t = i / sr, duck = 1 - 0.96 * ss(T.FLASH - 0.26, T.FLASH - 0.16, t) * ss(T.FLASH + 0.0, T.FLASH - 0.012, t), dk2 = 1 - 0.6 * ss(T.KALA - 0.2, T.KALA - 0.12, t) * ss(T.KALA, T.KALA - 0.01, t), fade = ss(0, 1.5, t) * ss(DUR - 0.05, DUR - 2.6, t), g = duck * dk2 * fade * 1.5 * (1 + 0.65 * ss(T.FLASH - 3, T.LIGHT - 2, t) + 0.4 * ss(T.RETURN + 1, T.RETURN + 5, t)); L[i] *= g; R[i] *= g; }
    let hpL = 0, hpR = 0, pL = 0, pR = 0, peak = 0; for (let i = 0; i < N; i++) { const l = L[i], r = R[i]; hpL = 0.9965 * (hpL + l - pL); pL = l; hpR = 0.9965 * (hpR + r - pR); pR = r; L[i] = Math.tanh(hpL * 1.25); R[i] = Math.tanh(hpR * 1.25); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
    const nrm = 0.89 / (peak || 1); for (let i = 0; i < N; i++) { L[i] *= nrm; R[i] *= nrm; }
    return [L, R];
  }
  let ctx = null, buf = null, src = null, gain = null, data = null, prom = null, ready = false, playing = false, muted = false, tStart = 0, off = 0;
  function prepare() {
    if (prom) return prom;
    prom = new Promise(res => { const done = d => { data = d; ready = true; res(); }, args = { sr: 44100, dur: Film.DUR, T: Film.T };
      try { const code = 'onmessage=function(e){var r=(' + synth.toString() + ')(e.data.sr,e.data.dur,e.data.T);postMessage(r,[r[0].buffer,r[1].buffer]);}';
        const w = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))); w.onmessage = e => { done(e.data); w.terminate(); }; w.onerror = () => { w.terminate(); done(synth(args.sr, args.dur, args.T)); }; w.postMessage(args);
      } catch (e) { setTimeout(() => done(synth(args.sr, args.dur, args.T)), 0); } });
    return prom;
  }
  function start(t) { if (src) { try { src.stop(); } catch (e) { } } src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; gain = ctx.createGain(); const now = ctx.currentTime; gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.35);
    src.connect(gain).connect(ctx.destination); off = ((t % Film.DUR) + Film.DUR) % Film.DUR; src.start(now + 0.05, off); tStart = now + 0.05; playing = true; }
  async function play(tFn) {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 }); ctx.resume();                    // inside the gesture, before any await
    await prepare(); if (!buf) { buf = ctx.createBuffer(2, data[0].length, 44100); buf.copyToChannel(data[0], 0); buf.copyToChannel(data[1], 1); }
    start(typeof tFn === 'function' ? tFn() : tFn);
  }
  const time = () => { const lat = ctx ? Math.min(ctx.outputLatency || ctx.baseLatency || 0, 0.2) : 0; return (((ctx.currentTime - tStart - lat + off) % Film.DUR) + Film.DUR) % Film.DUR; };
  return { synth, prepare, play, time, pause() { if (src) { try { src.stop(); } catch (e) { } src = null; } playing = false; }, resume(t) { if (ready && ctx && buf) start(t); },
    toggle() { muted = !muted; if (gain) gain.gain.linearRampToValueAtTime(muted ? 0 : 1, ctx.currentTime + 0.2); }, get playing() { return playing; }, get ready() { return ready; } };
})();
