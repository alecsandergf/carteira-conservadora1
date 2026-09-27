'use strict';
const http = require('http');
const crypto = require('crypto');

const VISITOR_PWD = process.env.AUTH_VISITOR_PASSWORD || '';
const ADMIN_PWD = process.env.AUTH_ADMIN_PASSWORD || '';

function hash(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }
const VISITOR_HASH = VISITOR_PWD ? hash(VISITOR_PWD) : '';
const ADMIN_HASH = ADMIN_PWD ? hash(ADMIN_PWD) : '';

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST' && req.url === '/api/auth') {
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
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(3001, '0.0.0.0', () => console.log('Auth server on :3001'));
