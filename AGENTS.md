# Agent notes

- Frontend: `index.html` + `app.css` + `app.js` (vanilla JS, Chart.js + Lucide via CDN, Google Fonts). No build step.
- Backend: `server.js` — tiny Node http server. Handles `POST /api/auth` (password → role) and serves static files for any non-API route. Listens on `process.env.PORT || 3001`.
- Secrets: `AUTH_ADMIN_PASSWORD` and `AUTH_VISITOR_PASSWORD` (sha256-hashed at boot). Set via dashboard; dev placeholders in `.env.base44-defaults` are overridden by `/run/base44/app.env`.

## Base44 dev environment
- `docker compose -f docker-compose.base44.yml up -d` runs nginx (port 3000, static + `/api/` proxy) and node `server.js` (port 3001, API only).
- `.base44/nginx.conf` uses `user root;` because the sandbox repo root is mode 700.
- nginx serves `/`, `.js`, `.css`; `/api/` proxies to `api:3001`. node's own static serving is never reached in dev (nginx intercepts first) — it's there for the single-process production image.
- Verify: `curl -s localhost:3000/ | grep '<title>'` → `Alocação de Referência`; `curl -s -X POST localhost:3000/api/auth -H 'Content-Type: application/json' -d '{"password":"..."}'`.

## Production deploy (Render)
- `Dockerfile` builds a single-process image: node serves static files + API on `PORT` (default 3000). Render injects `PORT` automatically.
- `render.yaml` is a Render Blueprint — create a web service from this repo, set `AUTH_ADMIN_PASSWORD` and `AUTH_VISITOR_PASSWORD` as env vars in the Render dashboard.
- The standalone `Alocação de Referência.html` is not referenced by the app and is excluded from the Docker image (its name breaks the Docker COPY parser).
