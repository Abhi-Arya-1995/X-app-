import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import Avatar from './Avatar'

const LIMIT = 280

export default function Composer({ replyTo, placeholder = "What's happening?", onPosted, autoFocus = false }) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="composer-signedout">
        <p>Sign in to join the conversation.</p>
        <Link to="/login" className="btn-outline">
          Sign in
        </Link>
      </div>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text || busy) return

    setBusy(true)
    setError('')
    try {
      await api.createPost({ body: text, replyTo })
      setBody('')
      await onPosted?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remaining = LIMIT - body.length

  return (
    <form className="composer" onSubmit={submit}>
      <Avatar name={user.displayName} size={44} />
      <div className="composer-main">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          rows={replyTo ? 2 : 3}
          maxLength={LIMIT + 40}
          autoFocus={autoFocus}
          aria-label={replyTo ? 'Write a reply' : 'Write a post'}
        />
        {error && <p className="form-error">{error}</p>}
        <div className="composer-actions">
          <span className={`counter${remaining < 0 ? ' over' : ''}`}>{remaining}</span>
          <button className="btn-primary" type="submit" disabled={busy || !body.trim() || remaining < 0}>
            {busy ? 'Posting…' : replyTo ? 'Reply' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  )
}
