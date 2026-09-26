
import { makeStyles, Text, tokens } from '@fluentui/react-components'
import type { ReactNode } from 'react'

const useStyles = makeStyles({
  card: {
    backgroundColor: 'white',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'box-shadow 0.15s, transform 0.15s',
    ':hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  delta: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
  },
  deltaUp: { color: '#16a34a', background: '#dcfce7' },
  deltaDown: { color: '#dc2626', background: '#fee2e2' },
  deltaFlat: { color: '#6b7280', background: '#f3f4f6' },
  value: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  label: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  sub: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
  },
})

type Props = {
  label: string
  value: string | number
  sub?: string
  delta?: number
  icon: ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

const TONES = {
  primary: { bg: '#eff6ff', fg: '#2563eb' },
  success: { bg: '#dcfce7', fg: '#16a34a' },
  warning: { bg: '#fef3c7', fg: '#d97706' },
  danger:  { bg: '#fee2e2', fg: '#dc2626' },
  neutral: { bg: '#f3f4f6', fg: '#374151' },
}

export default function KpiCard({ label, value, sub, delta, icon, tone = 'primary' }: Props) {
  const s = useStyles()
  const t = TONES[tone]
  const deltaClass = delta == null ? '' : delta > 0 ? s.deltaUp : delta < 0 ? s.deltaDown : s.deltaFlat
  return (
    <div className={s.card}>
      <div className={s.top}>
        <div className={s.icon} style={{ background: t.bg, color: t.fg }}>{icon}</div>
        {delta != null && (
          <span className={`${s.delta} ${deltaClass}`}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '•'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div>
        <div className={s.value}>{value}</div>
        <div className={s.label}>{label}</div>
        {sub && <div className={s.sub}>{sub}</div>}
      </div>
    </div>
  )
}
