export function relativeTime(input?: string | Date | null): string {
  if (!input) return '—'
  const d = typeof input === 'string' ? new Date(input) : input
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function absoluteDate(input?: string | Date | null): string {
  if (!input) return '—'
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function absoluteDateTime(input?: string | Date | null): string {
  if (!input) return '—'
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function daysBetween(input: string | Date): number {
  const d = typeof input === 'string' ? new Date(input) : input
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
