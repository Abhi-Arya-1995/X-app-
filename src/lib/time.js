export function relativeTime(value) {
  const then = new Date(value).getTime()
  const seconds = Math.max(1, Math.round((Date.now() - then) / 1000))

  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`

  const days = Math.round(seconds / 86400)
  if (days < 7) return `${days}d`

  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function joinedDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
