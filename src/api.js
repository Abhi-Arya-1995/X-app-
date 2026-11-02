async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
  createPost: (payload) => request('/posts', { method: 'POST', body: JSON.stringify(payload) }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  users: () => request('/users'),
  user: (handle) => request(`/users/${encodeURIComponent(handle)}`),
}
