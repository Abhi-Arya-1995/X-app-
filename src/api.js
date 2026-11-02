async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  me: () => request('/me'),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  posts: (author) => request(`/posts${author ? `?author=${encodeURIComponent(author)}` : ''}`),
  post: (id) => request(`/posts/${id}`),
  createPost: ({ body, replyTo, image }) => {
    const form = new FormData()
    form.append('body', body || '')
    if (replyTo) form.append('replyTo', String(replyTo))
    if (image) form.append('image', image)
    return request('/posts', { method: 'POST', body: form })
  },
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  users: () => request('/users'),
  user: (handle) => request(`/users/${encodeURIComponent(handle)}`),
}
