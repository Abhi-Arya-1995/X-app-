# AGENTS.md

## How it runs

- `docker-compose.base44.yml` runs two services: `web` (node:22 with the repo bind-mounted, `npm install` then `npm run dev`) and `db` (postgres:16).
- `npm run dev` starts **one** Node process: `server/index.js` hosts the Express API **and** Vite in middleware mode on port 3000. There is no separate frontend server and no CORS setup — `/api/*` and the SPA share an origin.
- Postgres credentials are local-only (`xapp`/`xapp`, database `xapp`), wired through `DATABASE_URL` in compose. `server/db.js` creates the schema with `CREATE TABLE IF NOT EXISTS` on every boot and seeds demo users/posts only when the `users` table is empty.
- `BASE44_PREVIEW_MODE` is passed through to the web service; when it equals `"1"`, `server/index.js` adds `.<BASE44_SANDBOX_HOST_DOMAIN>` to Vite's `allowedHosts` so the preview proxy host is accepted. Unset (or any other value) keeps Vite's default allowlist.

## Conventions

- Auth is a demo cookie session (handle only, no password) stored in `sessions`. It is intentionally not real authentication.
- API responses are camelCase; DB columns are snake_case and mapped in `server/index.js`.

## Verifying changes

- `curl http://localhost:3000/api/health` → `{"ok":true}`
- `curl http://localhost:3000/api/posts` → seeded feed JSON
- Run node/npm commands inside the container: `docker compose -f docker-compose.base44.yml exec web npm ...`
