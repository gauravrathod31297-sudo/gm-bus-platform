import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Button, Card, makeStyles, tokens, Text
} from '@fluentui/react-components'
import {
  BoardRegular, PeopleRegular, DocumentRegular, SignOutRegular
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: { display: 'flex', minHeight: '100vh', backgroundColor: tokens.colorNeutralBackground2 },
  sidebar: {
    width: '240px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex', flexDirection: 'column',
  },
  logo: {
    padding: '20px',
    display: 'flex', alignItems: 'center', gap: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  logoIcon: {
    width: '40px', height: '40px',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: '20px',
  },
  nav: { padding: '12px', flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    width: '100%', padding: '12px 16px', marginBottom: '4px',
    border: 'none', background: 'transparent', cursor: 'pointer',
    borderRadius: '6px', fontSize: '14px', textAlign: 'left',
    color: tokens.colorNeutralForeground1,
    transition: 'background 0.15s',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: '600',
  },
  footer: {
    padding: '12px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  main: { flex: 1, padding: '32px', overflow: 'auto' },
})

interface Props {
  children: ReactNode
  title: string
}

export default function Layout({ children, title }: Props) {
  const styles = useStyles()
  const nav = useNavigate()
  const loc = useLocation()
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    nav('/login')
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <BoardRegular /> },
    { path: '/requests', label: 'Requests', icon: <DocumentRegular /> },
    { path: '/clients', label: 'Clients', icon: <PeopleRegular /> },
  ]

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🚌</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>GM Bus</div>
            <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
              Admin Panel
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`${styles.navItem} ${loc.pathname === item.path ? styles.navItemActive : ''}`}
              onClick={() => nav(item.path)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.footer}>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
            {user.username}
          </div>
          <Button
            appearance="subtle"
            icon={<SignOutRegular />}
            onClick={logout}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
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
