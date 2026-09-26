import { makeStyles, tokens } from '@fluentui/react-components'
import { useNavigate, useLocation } from 'react-router-dom'

const useStyles = makeStyles({
  root: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px' },
  link: { color: tokens.colorBrandForeground1, cursor: 'pointer', textDecoration: 'none', ':hover': { textDecoration: 'underline' } },
  current: { color: tokens.colorNeutralForeground3, fontWeight: 600 },
  sep: { color: tokens.colorNeutralForeground3 },
})

const LABELS: Record<string, string> = {
  '': 'Dashboard',
  buses: 'Buses',
  routes: 'Routes',
  stops: 'Stops',
  drivers: 'Drivers',
  trips: 'Trip History',
  voice: 'Voice Settings',
  settings: 'Settings',
  live: 'Live Tracking',
}

export function Breadcrumbs() {
  const s = useStyles()
  const nav = useNavigate()
  const loc = useLocation()
  const parts = loc.pathname.split('/').filter(Boolean)

  return (
    <div className={s.root}>
      <span className={s.link} onClick={() => nav('/')}>🏠 Home</span>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/')
        const label = LABELS[part] || part
        const isLast = i === parts.length - 1
        return (
          <span key={path} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={s.sep}>/</span>
            <span className={isLast ? s.current : s.link} onClick={() => !isLast && nav(path)}>{label}</span>
          </span>
        )
      })}
    </div>
  )
}
