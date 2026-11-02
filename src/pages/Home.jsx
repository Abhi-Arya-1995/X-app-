import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import Composer from '../components/Composer'
import PostCard from '../components/PostCard'

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.posts()
      setPosts(data.posts)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, user?.id])

  return (
    <>
      <header className="column-header">
        <h1>Home</h1>
        <span className="header-note">Latest</span>
      </header>

      <Composer onPosted={load} />

      {error && <p className="banner-error">{error}</p>}

      {loading ? (
        <p className="empty-note">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="empty-note">No posts yet — be the first to post.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onChange={load} />
          ))}
        </div>
      )}
    </>
  )
}
