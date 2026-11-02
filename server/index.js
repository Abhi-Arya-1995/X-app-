import express from 'express'
import cookieParser from 'cookie-parser'
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { pool, initDb } from './db.js'

const PORT = Number(process.env.PORT || 3000)
const IS_PROD = process.env.NODE_ENV === 'production'

const app = express()
app.use(express.json())
app.use(cookieParser())

// Attach the signed-in user (if any) from the session cookie.
app.use(async (req, _res, next) => {
  try {
    const token = req.cookies?.session
    if (token) {
      const { rows } = await pool.query(
        `SELECT u.id, u.handle, u.display_name
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token = $1`,
        [token],
      )
      if (rows[0]) req.user = rows[0]
    }
    next()
  } catch (err) {
    next(err)
  }
})

const publicUser = (user) => ({
  id: user.id,
  handle: user.handle,
  displayName: user.display_name,
})

const POST_COLUMNS = `
  p.id, p.body, p.reply_to, p.created_at,
  u.handle, u.display_name,
  (SELECT count(*) FROM likes l WHERE l.post_id = p.id)::int AS like_count,
  (SELECT count(*) FROM posts r WHERE r.reply_to = p.id)::int AS reply_count,
  EXISTS (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = $1) AS liked
`

const serializePost = (row) => ({
  id: row.id,
  body: row.body,
  replyTo: row.reply_to,
  createdAt: row.created_at,
  author: { handle: row.handle, displayName: row.display_name },
  likeCount: row.like_count,
  replyCount: row.reply_count,
  liked: row.liked,
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null })
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const handle = String(req.body?.handle || '').trim().replace(/^@/, '').toLowerCase()
    const displayName = String(req.body?.displayName || '').trim()

    if (!/^[a-z0-9_]{2,20}$/.test(handle)) {
      return res.status(400).json({ error: 'Handle must be 2-20 letters, numbers or underscores.' })
    }

    const { rows } = await pool.query(
      `INSERT INTO users (handle, display_name) VALUES ($1, $2)
       ON CONFLICT (handle) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id, handle, display_name`,
      [handle, displayName || handle],
    )
    const user = rows[0]
    const token = randomUUID()
    await pool.query('INSERT INTO sessions (token, user_id) VALUES ($1, $2)', [token, user.id])

    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    })
    res.json({ user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.session
    if (token) await pool.query('DELETE FROM sessions WHERE token = $1', [token])
    res.clearCookie('session', { path: '/' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

app.get('/api/posts', async (req, res, next) => {
  try {
    const viewer = req.user?.id ?? null
    const params = [viewer]
    let where = 'p.reply_to IS NULL'

    if (req.query.author) {
      params.push(String(req.query.author).replace(/^@/, '').toLowerCase())
      where += ` AND u.handle = $${params.length}`
    }

    const { rows } = await pool.query(
      `SELECT ${POST_COLUMNS}
         FROM posts p JOIN users u ON u.id = p.author_id
        WHERE ${where}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 50`,
      params,
    )
    res.json({ posts: rows.map(serializePost) })
  } catch (err) {
    next(err)
  }
})

app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid post id.' })

    const viewer = req.user?.id ?? null
    const post = await pool.query(
      `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = $2`,
      [viewer, id],
    )
    if (!post.rows[0]) return res.status(404).json({ error: 'Post not found.' })

    const replies = await pool.query(
      `SELECT ${POST_COLUMNS}
         FROM posts p JOIN users u ON u.id = p.author_id
        WHERE p.reply_to = $2
        ORDER BY p.created_at ASC, p.id ASC`,
      [viewer, id],
    )

    res.json({ post: serializePost(post.rows[0]), replies: replies.rows.map(serializePost) })
  } catch (err) {
    next(err)
  }
})

app.post('/api/posts', async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Sign in to post.' })

    const body = String(req.body?.body || '').trim()
    const replyTo = req.body?.replyTo ? Number(req.body.replyTo) : null

    if (!body) return res.status(400).json({ error: 'Write something first.' })
    if (body.length > 280) return res.status(400).json({ error: 'Posts are limited to 280 characters.' })

    if (replyTo) {
      const parent = await pool.query('SELECT 1 FROM posts WHERE id = $1', [replyTo])
      if (!parent.rowCount) return res.status(404).json({ error: 'Post not found.' })
    }

    const { rows } = await pool.query(
      'INSERT INTO posts (author_id, body, reply_to) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, body, replyTo],
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    next(err)
  }
})

app.delete('/api/posts/:id', async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Sign in to delete a post.' })
    const id = Number(req.params.id)
    const { rowCount } = await pool.query('DELETE FROM posts WHERE id = $1 AND author_id = $2', [id, req.user.id])
    if (!rowCount) return res.status(404).json({ error: 'Post not found.' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

app.post('/api/posts/:id/like', async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Sign in to like a post.' })

    const postId = Number(req.params.id)
    const removed = await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [req.user.id, postId])

    let liked = false
    if (!removed.rowCount) {
      const post = await pool.query('SELECT 1 FROM posts WHERE id = $1', [postId])
      if (!post.rowCount) return res.status(404).json({ error: 'Post not found.' })
      await pool.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, postId],
      )
      liked = true
    }

    const { rows } = await pool.query('SELECT count(*)::int AS count FROM likes WHERE post_id = $1', [postId])
    res.json({ liked, likeCount: rows[0].count })
  } catch (err) {
    next(err)
  }
})

app.get('/api/users', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.handle, u.display_name, count(p.id)::int AS post_count
         FROM users u LEFT JOIN posts p ON p.author_id = u.id
        GROUP BY u.id
        ORDER BY post_count DESC, u.handle ASC
        LIMIT 5`,
    )
    res.json({
      users: rows.map((row) => ({
        handle: row.handle,
        displayName: row.display_name,
        postCount: row.post_count,
      })),
    })
  } catch (err) {
    next(err)
  }
})

app.get('/api/users/:handle', async (req, res, next) => {
  try {
    const handle = req.params.handle.replace(/^@/, '').toLowerCase()
    const { rows } = await pool.query(
      `SELECT u.id, u.handle, u.display_name, u.created_at,
              (SELECT count(*) FROM posts p WHERE p.author_id = u.id)::int AS post_count
         FROM users u WHERE u.handle = $1`,
      [handle],
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' })

    const viewer = req.user?.id ?? null
    const posts = await pool.query(
      `SELECT ${POST_COLUMNS}
         FROM posts p JOIN users u ON u.id = p.author_id
        WHERE u.handle = $2
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 50`,
      [viewer, handle],
    )

    const user = rows[0]
    res.json({
      user: {
        handle: user.handle,
        displayName: user.display_name,
        postCount: user.post_count,
        joinedAt: user.created_at,
      },
      posts: posts.rows.map(serializePost),
    })
  } catch (err) {
    next(err)
  }
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong.' })
})

const server = http.createServer(app)
await initDb()

if (IS_PROD) {
  const dist = path.resolve('dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  const { createServer: createViteServer } = await import('vite')

  // The preview proxy forwards the sandbox host, and the browser sends the
  // public origin. Only widen Vite's allowlist inside the Base44 sandbox.
  const allowedHosts =
    process.env.BASE44_PREVIEW_MODE === '1' && process.env.BASE44_SANDBOX_HOST_DOMAIN
      ? [`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`]
      : undefined

  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server }, allowedHosts },
    appType: 'custom',
  })

  app.use(vite.middlewares)
  app.use(async (req, res, next) => {
    try {
      const template = await fs.readFile(path.resolve('index.html'), 'utf-8')
      const html = await vite.transformIndexHtml(req.originalUrl, template)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (err) {
      next(err)
    }
  })
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`X App listening on http://0.0.0.0:${PORT}`)
})
