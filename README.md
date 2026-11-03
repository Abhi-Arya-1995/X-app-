# X App

A small X (Twitter)-style app: a feed, composer, replies, likes, and profiles.

- **Frontend:** React + Vite (`src/`)
- **Backend:** Express API (`server/`), served from the same process as the Vite dev server
- **Database:** Postgres (`server/db.js` creates the schema and seeds demo posts on first boot)

## Run with Docker

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

The app is on http://localhost:3000.

## Run locally (Node 20+ and Postgres)

```bash
npm install
export DATABASE_URL=postgres://xapp:xapp@localhost:5432/xapp
npm run dev
```

## Notes

- Signing in asks for a handle only (no password) — this is a demo login, not real authentication.
- Demo accounts (`ada`, `grace`, `linus`) and a few posts are seeded the first time the database is empty.
