'use strict';
const crypto = require('crypto');

function hash(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

function getBody(req) {
  if (req.body) {
    return Promise.resolve(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  }
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_PWD = process.env.AUTH_ADMIN_PASSWORD || '';
  const ADMIN_HASH = ADMIN_PWD ? hash(ADMIN_PWD) : '';

  if (!SUPABASE_URL || !ANON_KEY) {
    res.writeHead(503);
    return res.end(JSON.stringify({ ok: false, error: 'Supabase não configurado' }));
  }

  // GET — ler modelo (público)
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/alloc_model?id=eq.1&select=data`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
      });
      const rows = await r.json();
      const modelData = (rows && rows.length > 0) ? rows[0].data : null;
      res.writeHead(200);
      return res.end(JSON.stringify({ ok: true, model: modelData }));
    } catch {
      res.writeHead(500);
      return res.end(JSON.stringify({ ok: false, error: 'Erro ao buscar modelo' }));
    }
  }

  // PUT — salvar modelo (admin only)
  if (req.method === 'PUT') {
    let body;
    try {
      const raw = await getBody(req);
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400);
      return res.end(JSON.stringify({ ok: false, error: 'Body inválido' }));
    }

    if (!body.password || hash(body.password) !== ADMIN_HASH) {
      res.writeHead(401);
      return res.end(JSON.stringify({ ok: false, error: 'Não autorizado' }));
    }

    if (!SERVICE_KEY) {
      res.writeHead(503);
      return res.end(JSON.stringify({ ok: false, error: 'Supabase service key não configurado' }));
    }

    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/alloc_model?id=eq.1`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal,resolution=merge-duplicates'
        },
        body: JSON.stringify({ id: 1, data: body.model, updated_at: new Date().toISOString() })
      });
      if (r.ok) {
        res.writeHead(200);
        return res.end(JSON.stringify({ ok: true }));
      }
      res.writeHead(500);
      return res.end(JSON.stringify({ ok: false, error: 'Erro ao salvar modelo' }));
    } catch {
      res.writeHead(500);
      return res.end(JSON.stringify({ ok: false, error: 'Erro ao salvar modelo' }));
    }
  }

  res.writeHead(405);
  res.end(JSON.stringify({ ok: false, error: 'Método não permitido' }));
};
