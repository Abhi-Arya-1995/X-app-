const PALETTES = [
  'linear-gradient(140deg, #1d9bf0, #0a4b78)',
  'linear-gradient(140deg, #f91880, #7d0b40)',
  'linear-gradient(140deg, #00ba7c, #04583c)',
  'linear-gradient(140deg, #ffd400, #8a6d00)',
  'linear-gradient(140deg, #7856ff, #2f1d7a)',
]

export default function Avatar({ name = '?', size = 44 }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % PALETTES.length

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: PALETTES[hash] }}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  )
}
