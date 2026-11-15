// Render the score to a WAV (for the MP4) and assert facts about the mix.   node tools/wav.mjs [out.wav]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url))), src = fs.readFileSync(path.join(root, 'src/85_audio.js'), 'utf8'), film = fs.readFileSync(path.join(root, 'src/88_film.js'), 'utf8');
if (/Math\.random|OfflineAudioContext/.test(src)) throw new Error('non-deterministic source');
const T = new Function('return ' + film.match(/const T = (\{[^}]*\})/)[1])(), DUR = +film.match(/const DUR = (\d+)/)[1];
const Score = new Function('Film', 'window', src + '; return Score;')({ DUR, T }, {});
const t0 = Date.now(), [L, R] = Score.synth(44100, DUR, T), ms = Date.now() - t0, N = L.length;
let peak = 0, sum = 0, bad = 0, dc = 0; for (let i = 0; i < N; i++) { if (!Number.isFinite(L[i]) || !Number.isFinite(R[i])) bad++; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); sum += L[i] * L[i] + R[i] * R[i]; dc += L[i]; }
const rms = Math.sqrt(sum / (2 * N)), win = 4 * 44100; let best = 0, bestT = 0; for (let s = 0; s + win < N; s += 22050) { let e = 0; for (let i = s; i < s + win; i += 8) e += L[i] * L[i]; if (e > best) { best = e; bestT = s / 44100; } }
const sec = []; for (let s = 0; s < DUR; s += 6) { let e = 0; for (let i = s * 44100; i < (s + 6) * 44100 && i < N; i += 4) e += L[i] * L[i] + R[i] * R[i]; sec.push((10 * Math.log10(e / (3 * 44100) + 1e-12)).toFixed(1)); }
console.log({ renderMs: ms, seconds: N / 44100, peak: +peak.toFixed(3), rmsDb: +(20 * Math.log10(rms)).toFixed(1), crestDb: +(20 * Math.log10(peak / rms)).toFixed(1), nan: bad, dc: +(dc / N).toFixed(5), loudest4sAt: bestT, per6sDb: sec.join(' ') });
if (bad) throw new Error('NaN in the mix'); if (peak > 0.9) throw new Error('peak over 0.9');
const out = process.argv[2] || path.join(root, '_out/score.wav'); fs.mkdirSync(path.dirname(out), { recursive: true });
const b = Buffer.alloc(44 + N * 4); b.write('RIFF', 0); b.writeUInt32LE(36 + N * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(44100, 24); b.writeUInt32LE(44100 * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 4, 40);
let sd = 7; const dn = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
for (let i = 0; i < N; i++) { b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767 + dn() - dn()))), 44 + i * 4); b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767 + dn() - dn()))), 46 + i * 4); }
fs.writeFileSync(out, b); console.log('wrote', out);
