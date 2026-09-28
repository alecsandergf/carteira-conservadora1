'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VISITOR_PWD = process.env.AUTH_VISITOR_PASSWORD || '';
const ADMIN_PWD = process.env.AUTH_ADMIN_PASSWORD || '';

function hash(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }
const VISITOR_HASH = VISITOR_PWD ? hash(VISITOR_PWD) : '';
const ADMIN_HASH = ADMIN_PWD ? hash(ADMIN_PWD) : '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(__dirname, urlPath));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.writeHead(200);
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/auth') {
    res.setHeader('Content-Type', 'application/json');
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body);
        if (!password || typeof password !== 'string') {
          res.writeHead(401);
          return res.end(JSON.stringify({ ok: false, error: 'Senha incorreta' }));
        }
        const h = hash(password);
        if (ADMIN_HASH && h === ADMIN_HASH) {
          res.writeHead(200);
          return res.end(JSON.stringify({ ok: true, role: 'admin' }));
        }
        if (VISITOR_HASH && h === VISITOR_HASH) {
          res.writeHead(200);
          return res.end(JSON.stringify({ ok: true, role: 'visitor' }));
        }
        res.writeHead(401);
        res.end(JSON.stringify({ ok: false, error: 'Senha incorreta' }));
      } catch {
        res.writeHead(401);
        res.end(JSON.stringify({ ok: false, error: 'Senha incorreta' }));
      }
    });
  } else {
    serveStatic(req, res);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log('Server on :' + PORT));
