import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import Composer from '../components/Composer'
import PostCard from '../components/PostCard'

export default function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.post(id)
      setPost(data.post)
      setReplies(data.replies)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  const afterChange = async () => {
    await load()
    if (!post) navigate('/')
  }

  return (
    <>
      <header className="column-header with-back">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="Go back">
          ←
        </button>
        <h1>Post</h1>
      </header>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="empty-note">Loading post…</p>}

      {post && (
        <>
          <PostCard post={post} onChange={afterChange} linkToPost={false} />
          <Composer replyTo={post.id} placeholder="Post your reply" onPosted={load} />

          {replies.length === 0 ? (
            <p className="empty-note">No replies yet.</p>
          ) : (
            replies.map((reply) => (
              <PostCard key={reply.id} post={reply} onChange={load} linkToPost={false} />
            ))
          )}
        </>
      )}
    </>
  )
}
