import { makeStyles, tokens } from '@fluentui/react-components'
import { ChevronRightRegular } from '@fluentui/react-icons'
import { Link } from 'react-router-dom'

const useStyles = makeStyles({
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    color: tokens.colorNeutralForeground3,
    marginBottom: 12,
  },
  link: {
    color: tokens.colorNeutralForeground3,
    textDecoration: 'none',
    ':hover': { color: tokens.colorBrandForeground1, textDecoration: 'underline' },
  },
  current: { color: tokens.colorNeutralForeground1, fontWeight: 600 },
  icon: { fontSize: 10, opacity: 0.5, display: 'flex', alignItems: 'center' },
})

type Crumb = { label: string; to?: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const s = useStyles()
  return (
    <nav className={s.wrap} aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span className={s.icon}><ChevronRightRegular /></span>}
          {c.to && i < items.length - 1
            ? <Link to={c.to} className={s.link}>{c.label}</Link>
            : <span className={i === items.length - 1 ? s.current : ''}>{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
