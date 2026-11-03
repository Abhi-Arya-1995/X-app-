import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { LogoIcon } from '../components/icons'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(handle, displayName)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="login-page">
      <div className="login-mark">
        <LogoIcon width="36" height="36" />
      </div>
      <h1>Join X App</h1>
      <p className="login-sub">
        {user ? `You are signed in as @${user.handle}.` : 'Pick a handle to start posting. No password needed in this demo.'}
      </p>

      <form className="login-form" onSubmit={submit}>
        <label>
          Handle
          <div className="input-with-prefix">
            <span>@</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="yourhandle"
              autoComplete="username"
              required
            />
          </div>
        </label>

        <label>
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your Name"
            autoComplete="name"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn-primary login-submit" type="submit" disabled={busy || handle.trim().length < 2}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="login-hint">Already have a handle above? Signing in again reuses that account.</p>
    </section>
  )
}
