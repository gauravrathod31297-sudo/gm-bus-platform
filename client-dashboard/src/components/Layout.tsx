import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, makeStyles, tokens } from '@fluentui/react-components'
import {
  BoardRegular, VehicleBusRegular, MapRegular, LocationRegular,
  SettingsRegular, SignOutRegular, Speaker2Regular
} from '@fluentui/react-icons'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  root: { display: 'flex', minHeight: '100vh', backgroundColor: tokens.colorNeutralBackground2 },
  sidebar: { width: '240px', backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', flexDirection: 'column' },
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
  const { t, lang } = useLanguage()

  const logout = () => {
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    localStorage.removeItem('ui_language')
    window.location.href = '/login'
  }

  const items = [
    { path: '/', label: t('dashboard'), icon: <BoardRegular /> },
    { path: '/buses', label: t('buses'), icon: <VehicleBusRegular /> },
    { path: '/routes', label: t('routes'), icon: <MapRegular /> },
    { path: '/stops', label: t('stops'), icon: <LocationRegular /> },
    { path: '/live', label: t('liveTracking'), icon: <LocationRegular /> },
    { path: '/voice', label: t('voiceSettings'), icon: <Speaker2Regular /> },
    { path: '/settings', label: t('settings'), icon: <SettingsRegular /> },
  ]

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🚌</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{user.company || 'GM Bus'}</div>
            <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
              {lang.toUpperCase()} Dashboard
            </div>
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
            {t('logout')}
          </Button>
        </div>
      </aside>
      <main className={styles.main}>
        <div style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>{title}</div>
        {children}
      </main>
    </div>
  )
}
