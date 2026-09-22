import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { makeStyles, tokens, Button } from '@fluentui/react-components'
import { BoardRegular, PeopleRegular, SignOutRegular, MoneyRegular, DataBarVerticalRegular } from '@fluentui/react-icons'
const useStyles = makeStyles({
  root: { display: 'flex', minHeight: '100vh', background: '#f5f5f5' },
  sidebar: { width: '240px', background: 'white', borderRight: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', flexDirection: 'column' },
  logo: { padding: '20px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, fontWeight: 700, fontSize: '18px' },
  nav: { padding: '12px', flex: 1 },
  item: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', marginBottom: '4px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', textAlign: 'left' },
  active: { background: tokens.colorBrandBackground2, fontWeight: 600 },
  main: { flex: 1, padding: '32px' },
  footer: { padding: '12px', borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
})
export default function Layout() {
  const s = useStyles()
  const nav = useNavigate()
  const loc = useLocation()
  const logout = () => { localStorage.clear(); window.location.href = '/login' }
  const items = [
    { path: '/', label: 'Dashboard', icon: <BoardRegular /> },
    { path: '/clients', label: 'Clients', icon: <PeopleRegular /> },
    { path: '/subscriptions', label: 'Subscriptions', icon: <MoneyRegular /> },
    { path: '/analytics', label: 'Analytics', icon: <DataBarVerticalRegular /> },
  ]
  return (
    <div className={s.root}>
      <aside className={s.sidebar}>
        <div className={s.logo}>🚌 Admin Panel</div>
        <nav className={s.nav}>
          {items.map(i => (
            <button key={i.path} className={`${s.item} ${loc.pathname === i.path ? s.active : ''}`} onClick={() => nav(i.path)}>
              {i.icon}{i.label}
            </button>
          ))}
        </nav>
        <div className={s.footer}>
          <Button appearance="subtle" icon={<SignOutRegular />} onClick={logout} style={{ width: '100%', justifyContent: 'flex-start' }}>Logout</Button>
        </div>
      </aside>
      <main className={s.main}><Outlet /></main>
    </div>
  )
}
