import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import Avatar from './Avatar'
import { HeartIcon, ReplyIcon, TrashIcon } from './icons'
import { relativeTime } from '../lib/time'

export default function PostCard({ post, onChange, linkToPost = true }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLiked(post.liked)
    setLikeCount(post.likeCount)
  }, [post.liked, post.likeCount])

  const isOwn = user?.handle === post.author.handle

  const openPost = () => {
    if (linkToPost) navigate(`/p/${post.id}`)
  }

  const toggleLike = async (event) => {
    event.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const data = await api.toggleLike(post.id)
      setLiked(data.liked)
      setLikeCount(data.likeCount)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (event) => {
    event.stopPropagation()
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      setTimeout(() => setConfirmingDelete(false), 3000)
      return
    }
    setConfirmingDelete(false)
    try {
      await api.deletePost(post.id)
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <article
      className={`post${linkToPost ? ' clickable' : ''}`}
      onClick={openPost}
      onKeyDown={(event) => {
        if (linkToPost && event.key === 'Enter') openPost()
      }}
      tabIndex={linkToPost ? 0 : undefined}
      role={linkToPost ? 'link' : undefined}
      aria-label={linkToPost ? `Post by ${post.author.displayName}` : undefined}
    >
      <Link to={`/u/${post.author.handle}`} className="post-avatar" onClick={(event) => event.stopPropagation()}>
        <Avatar name={post.author.displayName} size={44} />
      </Link>

      <div className="post-body">
        <header className="post-header">
          <Link to={`/u/${post.author.handle}`} className="post-name" onClick={(event) => event.stopPropagation()}>
            {post.author.displayName}
          </Link>
          <span className="post-handle">@{post.author.handle}</span>
          <span className="dot">·</span>
          <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
          {isOwn && (
            <button
              className={`icon-button post-delete${confirmingDelete ? ' confirming' : ''}`}
              onClick={remove}
              aria-label={confirmingDelete ? 'Confirm delete' : 'Delete post'}
              title={confirmingDelete ? 'Click again to delete' : 'Delete post'}
            >
              {confirmingDelete ? <span className="confirm-label">Delete?</span> : <TrashIcon width="16" height="16" />}
            </button>
          )}
        </header>

        {post.body && <p className="post-text">{post.body}</p>}

        {post.image && (
          <img className="post-image" src={post.image} alt={`Image attached to post by ${post.author.displayName}`} loading="lazy" />
        )}

        <div className="post-actions">
          <Link
            to={`/p/${post.id}`}
            className="action reply"
            onClick={(event) => event.stopPropagation()}
            aria-label={`Reply, ${post.replyCount} replies`}
          >
            <ReplyIcon width="18" height="18" />
            <span>{post.replyCount || ''}</span>
          </Link>

          <button
            className={`action like${liked ? ' liked' : ''}`}
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <HeartIcon width="18" height="18" filled={liked} />
            <span>{likeCount || ''}</span>
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>
    </article>
  )
}
