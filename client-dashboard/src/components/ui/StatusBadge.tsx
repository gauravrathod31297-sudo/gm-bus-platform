import { makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' },
  dot: { width: '6px', height: '6px', borderRadius: '50%' },
})

type Status = 'active' | 'inactive' | 'live' | 'completed' | 'pending' | 'error' | 'info'

const COLORS: Record<Status, { bg: string; fg: string; dot: string }> = {
  active:    { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  inactive:  { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  live:      { bg: '#dbeafe', fg: '#1e40af', dot: '#3b82f6' },
  completed: { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  pending:   { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  error:     { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  info:      { bg: '#e0e7ff', fg: '#3730a3', dot: '#6366f1' },
}

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  const s = useStyles()
  const c = COLORS[status]
  return (
    <span className={s.badge} style={{ background: c.bg, color: c.fg }}>
      <span className={s.dot} style={{ background: c.dot }}></span>
      {label}
    </span>
  )
}
