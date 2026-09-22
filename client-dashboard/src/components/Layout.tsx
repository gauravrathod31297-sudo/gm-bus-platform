import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, makeStyles, tokens, Text } from '@fluentui/react-components'
import {
  BoardRegular, VehicleBusRegular, MapRegular, LocationRegular,
  SettingsRegular, SignOutRegular, Speaker2Regular
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: { display: 'flex', minHeight: '100vh', backgroundColor: tokens.colorNeutralBackground2 },
  sidebar: {
    width: '240px', backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex', flexDirection: 'column',
  },
  logo: { padding: '20px', display: 'flex', alignItems: 'center', gap: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  logoIcon: { width: '40px', height: '40px', backgroundColor: tokens.colorBrandBackground,
    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: '20px' },
  nav: { padding: '12px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
    padding: '12px 16px', marginBottom: '4px', border: 'none', background: 'transparent',
    cursor: 'pointer', borderRadius: '6px', fontSize: '14px', textAlign: 'left',
    color: tokens.colorNeutralForeground1 },
  navItemActive: { backgroundColor: tokens.colorBrandBackground2, fontWeight: '600' },
  footer: { padding: '12px', borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
  main: { flex: 1, padding: '32px', overflow: 'auto' },
})

interface Props { children: ReactNode; title: string }

export default function Layout({ children, title }: Props) {
  const styles = useStyles()
  const nav = useNavigate()
  const loc = useLocation()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  const logout = () => {
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    nav('/login')
  }

  const items = [
    { path: '/', label: 'Dashboard', icon: <BoardRegular /> },
    { path: '/buses', label: 'Buses', icon: <VehicleBusRegular /> },
    { path: '/routes', label: 'Routes', icon: <MapRegular /> },
    { path: '/stops', label: 'Stops', icon: <LocationRegular /> },
    { path: '/live', label: 'Live Tracking', icon: <LocationRegular /> },
    { path: '/voice', label: 'Voice', icon: <Speaker2Regular /> },
    { path: '/settings', label: 'Settings', icon: <SettingsRegular /> },
  ]

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🚌</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{user.company || 'GM Bus'}</div>
            <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>Dashboard</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {items.map(i => (
            <button key={i.path}
              className={`${styles.navItem} ${loc.pathname === i.path ? styles.navItemActive : ''}`}
              onClick={() => nav(i.path)}>
              {i.icon}{i.label}
            </button>
          ))}
        </nav>
        <div className={styles.footer}>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
            {user.email}
          </div>
          <Button appearance="subtle" icon={<SignOutRegular />} onClick={logout}
            style={{ width: '100%', justifyContent: 'flex-start' }}>
            Logout
          </Button>
        </div>
      </aside>
      <main className={styles.main}>
        <Text size={700} weight="semibold" style={{ display: 'block', marginBottom: '24px' }}>
          {title}
        </Text>
        {children}
      </main>
    </div>
  )
}
