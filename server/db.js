import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://xapp:xapp@localhost:5432/xapp',
})

const SEED_USERS = [
  ['ada', 'Ada Lovelace'],
  ['grace', 'Grace Hopper'],
  ['linus', 'Linus Torvalds'],
]

const SEED_POSTS = [
  ['ada', 'Shipped the first version of X App tonight. Composer, likes, replies and profiles all work. 🚀', 55],
  ['grace', 'Reminder: the best way to debug a feed is to read it top to bottom and ask who wrote each line.', 140],
  ['linus', 'Hot take: a 280 character limit is a feature, not a bug.', 260],
  ['ada', 'Small things that make an app feel alive: instant optimistic likes and a feed that remembers where you were.', 420],
]

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      handle TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      reply_to INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, post_id)
    );
  `)

  await seed()
}

async function seed() {
  const { rows } = await pool.query('SELECT count(*)::int AS count FROM users')
  if (rows[0].count > 0) return

  const ids = {}
  for (const [handle, displayName] of SEED_USERS) {
    const inserted = await pool.query(
      'INSERT INTO users (handle, display_name) VALUES ($1, $2) ON CONFLICT (handle) DO UPDATE SET display_name = EXCLUDED.display_name RETURNING id',
      [handle, displayName],
    )
    ids[handle] = inserted.rows[0].id
  }

  for (const [handle, body, minutesAgo] of SEED_POSTS) {
    await pool.query(
      'INSERT INTO posts (author_id, body, created_at) VALUES ($1, $2, now() - ($3 || \' minutes\')::interval)',
      [ids[handle], body, String(minutesAgo)],
    )
  }

  await pool.query(
    'INSERT INTO likes (user_id, post_id) SELECT $1, id FROM posts WHERE author_id = $2 ON CONFLICT DO NOTHING',
    [ids.grace, ids.ada],
  )
}
