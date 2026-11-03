import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import { joinedDate } from '../lib/time'

export default function Profile() {
  const { handle } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.user(handle)
      setProfile(data.user)
      setPosts(data.posts)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [handle])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  return (
    <>
      <header className="column-header">
        <div>
          <h1>{profile ? profile.displayName : 'Profile'}</h1>
          {profile && <span className="header-note">{profile.postCount} posts</span>}
        </div>
      </header>

      {error && <p className="banner-error">{error}</p>}
      {loading && <p className="empty-note">Loading profile…</p>}

      {profile && (
        <>
          <section className="profile-card">
            <Avatar name={profile.displayName} size={84} />
            <h2>{profile.displayName}</h2>
            <p className="post-handle">@{profile.handle}</p>
            <p className="profile-meta">Joined {joinedDate(profile.joinedAt)}</p>
          </section>

          {posts.length === 0 ? (
            <p className="empty-note">No posts yet.</p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} onChange={load} />)
          )}
        </>
      )}
    </>
  )
}
