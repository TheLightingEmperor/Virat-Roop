// Static preview server with a frame-capture endpoint.   node tools/serve.js [port]      (honours PORT)
//
//   GET  /anything            a file under the project root (no caching, so a rebuild is always what you see)
//   POST /__shot?name=x.jpg   debug only: the request body is written to _shots/x.jpg
//                             (contact sheets, recorded frames, a WAV of the score, a text marker when a recording ends)
//
// Why the endpoint exists: the page can draw any film time into its canvas, and a canvas can be turned into a JPEG and
// POSTed. That gives full-resolution stills on disk that can be opened and inspected, which a screenshot of a preview
// pane cannot (it is scaled, and it is whatever frame happened to be showing).
// Bound to 127.0.0.1 only. _shots/ is scratch: keep it in .gitignore and delete it when a review is over.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SHOTS = path.join(ROOT, '_shots');
const PORT = +process.env.PORT || +process.argv[2] || 4400;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };
const MAX = 64 * 1024 * 1024;                                            // one POST: a 4K PNG or a few minutes of WAV

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  if (req.method === 'POST' && p === '/__shot') {
    const name = (url.searchParams.get('name') || '').replace(/[^\w.-]/g, '');
    if (!/^[\w-]+\.(png|jpg|wav|txt|json)$/.test(name)) { res.writeHead(400); return res.end('bad name'); }
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > MAX) { res.writeHead(413); res.end(); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (n > MAX) return; fs.mkdirSync(SHOTS, { recursive: true });
      fs.writeFile(path.join(SHOTS, name), Buffer.concat(chunks), e => { res.writeHead(e ? 500 : 200); res.end(e ? 'write failed' : 'ok'); }); });
    return;
  }
  const f = path.join(ROOT, p);
  if (f !== ROOT && !f.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d);
  });
}).listen(PORT, '127.0.0.1', () => console.log('preview on http://127.0.0.1:' + PORT));
