// Server locale senza dipendenze: `python -m http.server` e simili non gestiscono
// le richieste Range, e senza quelle il browser non può spostarsi nel video
// (né quindi saltare a una riga del testo).
const { createServer } = require('node:http');
const { createReadStream, statSync } = require('node:fs');
const { pipeline } = require('node:stream');
const { networkInterfaces } = require('node:os');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 4321;

// Solo questi file sono raggiungibili, tutto il resto della cartella no.
const FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/timings.json': ['timings.json', 'application/json; charset=utf-8'],
  '/lyrics.txt': ['lyrics.txt', 'text/plain; charset=utf-8'],
  '/frasi.json': ['frasi.json', 'application/json; charset=utf-8'],
  '/sfondo.jpg': ['sfondo.jpg', 'image/jpeg'],
  '/sfondo-largo.jpg': ['sfondo-largo.jpg', 'image/jpeg'],
  '/video.mp4': ['video.mp4', 'video/mp4'],
};

// Traduce l'header Range in { start, end } inclusivi; null se non è soddisfacibile.
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (match[1] === '' && match[2] === '')) return null;
  const start = match[1] === '' ? Math.max(size - Number(match[2]), 0) : Number(match[1]);
  const end = match[1] === '' || match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  return start <= end ? { start, end } : null;
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const entry = FILES[pathname];
  if (!entry || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404).end();
    return;
  }

  const file = path.join(__dirname, entry[0]);
  let size;
  try {
    size = statSync(file).size;
  } catch {
    res.writeHead(404).end();
    return;
  }

  const headers = {
    'Content-Type': entry[1],
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  };

  let range = { start: 0, end: size - 1 };
  let status = 200;
  if (req.headers.range && size > 0) {
    range = parseRange(req.headers.range, size);
    if (!range) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    status = 206;
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${size}`;
  }
  headers['Content-Length'] = size === 0 ? 0 : range.end - range.start + 1;

  res.writeHead(status, headers);
  if (req.method === 'HEAD' || size === 0) {
    res.end();
    return;
  }
  // Il browser interrompe spesso una richiesta quando si sposta nel video: non è un errore.
  pipeline(createReadStream(file, range), res, () => {});
});

// In ascolto su tutta la rete locale, così il sito si apre anche dal telefono sulla stessa
// Wi-Fi: chi è su quella rete può vedere il video finché il server è acceso.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Computer: http://localhost:${PORT}`);
  for (const addresses of Object.values(networkInterfaces())) {
    for (const { family, internal, address } of addresses) {
      if (family === 'IPv4' && !internal) console.log(`Telefono: http://${address}:${PORT}`);
    }
  }
});
