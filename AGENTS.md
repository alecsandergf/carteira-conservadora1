# Agent notes

- The whole app is one self-contained static page: `Alocação de Referência.html` (inline CSS/JS, Google Fonts only). No build step, no backend, no secrets.
- Dev: `docker compose -f docker-compose.base44.yml up -d` runs nginx on port 3000 with the repo bind-mounted read-only; `/` serves the HTML file. `Cache-Control: no-store` is set, so edits show up on a browser reload (no live reload).
- `.base44/nginx.conf` replaces the whole nginx.conf with `user root;` because the sandbox repo root is mode 700 and the default `nginx` worker user gets "Permission denied".
- Verify: `curl -s localhost:3000/ | grep '<title>'` should print `Alocação de Referência`.
