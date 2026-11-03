import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import Avatar from './Avatar'
import { ImageIcon } from './icons'

const LIMIT = 280
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default function Composer({ replyTo, placeholder = "What's happening?", onPosted, autoFocus = false }) {
  const { user } = useAuth()
  const fileInput = useRef(null)
  const [body, setBody] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
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

  const resetImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setImage(null)
    setPreview('')
    if (fileInput.current) fileInput.current.value = ''
  }

  const pickImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPEG, PNG, GIF or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Images must be 5MB or smaller.')
      event.target.value = ''
      return
    }

    setError('')
    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if ((!text && !image) || busy) return

    setBusy(true)
    setError('')
    try {
      await api.createPost({ body: text, replyTo, image })
      setBody('')
      resetImage()
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

        {preview && (
          <div className="composer-preview">
            <img src={preview} alt="Selected image preview" />
            <button
              type="button"
              className="preview-remove"
              onClick={resetImage}
              aria-label="Remove image"
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="composer-actions">
          <div className="composer-tools">
            <button
              type="button"
              className="icon-button attach"
              onClick={() => fileInput.current?.click()}
              aria-label="Add image"
              title="Add image"
            >
              <ImageIcon width="20" height="20" />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={pickImage}
              hidden
              aria-label="Choose an image"
            />
          </div>

          <div className="composer-submit">
            <span className={`counter${remaining < 0 ? ' over' : ''}`}>{remaining}</span>
            <button className="btn-primary" type="submit" disabled={busy || (!body.trim() && !image) || remaining < 0}>
              {busy ? 'Posting…' : replyTo ? 'Reply' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
