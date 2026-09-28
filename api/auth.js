'use strict';
const crypto = require('crypto');

function hash(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

const VISITOR_PWD = process.env.AUTH_VISITOR_PASSWORD || '';
const ADMIN_PWD = process.env.AUTH_ADMIN_PASSWORD || '';
const VISITOR_HASH = VISITOR_PWD ? hash(VISITOR_PWD) : '';
const ADMIN_HASH = ADMIN_PWD ? hash(ADMIN_PWD) : '';

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end(JSON.stringify({ ok: false, error: 'Método não permitido' }));
  }

  let password;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    password = body && body.password;
  } catch {
    password = null;
  }

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
};
