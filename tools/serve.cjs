// Tiny static server for trying the site the way a host will serve it: node tools/serve.cjs [port]
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', 'app'), port = +process.argv[2] || 4177;
const types = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', txt: 'text/plain; charset=utf-8', json: 'application/json' };
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]), file = path.resolve(root, '.' + (p === '/' ? '/index.html' : p));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.setHeader('Content-Type', types[file.split('.').pop()] || 'application/octet-stream'); res.setHeader('Cache-Control', 'no-store'); res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log('Cubic: http://127.0.0.1:' + port));
