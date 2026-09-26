import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, makeStyles, tokens, Avatar, Tooltip } from '@fluentui/react-components'
import {
  BoardRegular, VehicleBusRegular, MapRegular, LocationRegular,
  SettingsRegular, SignOutRegular, Speaker2Regular, PeopleRegular,
  ClockRegular, AlertRegular, WeatherMoonRegular, WeatherSunnyRegular,
  NavigationRegular, ChevronRightRegular,
} from '@fluentui/react-icons'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import { useTheme } from '../contexts/ThemeContext'

const useStyles = makeStyles({
  root: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6f8' },
  sidebar: {
    width: '260px', backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh',
  },
  logo: {
    padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  logoIcon: {
    width: '42px', height: '42px',
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: '22px', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
  },
  logoText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  companyName: {
    fontWeight: 700, fontSize: '14px', color: '#111827',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  companyMeta: { fontSize: '11px', color: '#6b7280', marginTop: '1px' },

  nav: { padding: '12px 8px', flex: 1, overflowY: 'auto' },
  navSection: { marginBottom: '16px' },
  navSectionLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
    color: '#9ca3af', textTransform: 'uppercase',
    padding: '4px 12px 6px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    width: '100%', padding: '9px 12px', marginBottom: '2px',
    border: 'none', background: 'transparent',
    cursor: 'pointer', borderRadius: '8px', fontSize: '13.5px',
    textAlign: 'left', color: '#374151',
    position: 'relative', transition: 'all 0.15s',
    ':hover': { background: '#f3f4f6' },
  },
  navItemActive: {
    background: '#eff6ff', color: '#1d4ed8', fontWeight: 600,
    '::before': {
      content: '""', position: 'absolute', left: '-8px', top: '20%',
      height: '60%', width: '3px', background: '#2563eb', borderRadius: '0 3px 3px 0',
    },
  },
  navIcon: { fontSize: '18px', flexShrink: 0, display: 'flex', alignItems: 'center' },
  navLabel: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  footer: {
    padding: '12px 12px', borderTop: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  footerUser: { flex: 1, minWidth: 0 },
  footerEmail: {
    fontSize: '11px', color: '#6b7280',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  footerRole: { fontSize: '10px', color: '#9ca3af', marginTop: '1px' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: {
    height: '64px', background: '#ffffff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 28px', borderBottom: '1px solid #e5e7eb',
    position: 'sticky', top: 0, zIndex: 10,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  headerTitle: {
    fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em',
  },
  headerCrumb: { fontSize: '12px', color: '#9ca3af' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  iconBtn: {
    width: '36px', height: '36px', minWidth: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', border: 'none', background: 'transparent',
    cursor: 'pointer', color: '#6b7280', fontSize: '18px',
    ':hover': { background: '#f3f4f6', color: '#111827' },
  },
  content: { flex: 1, padding: '24px 28px 40px', overflow: 'auto' },
} as any)

interface Props { children: ReactNode; title: string }

export default function Layout({ children, title }: Props) {
  const styles = useStyles()
  const nav = useNavigate()
  const loc = useLocation()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')
  const { t, lang } = useLanguage()
  const { dark, toggle } = useTheme()

  const logout = () => {
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    localStorage.removeItem('ui_language')
    window.location.href = '/login'
  }

  const sections = [
    {
      label: 'Main',
      items: [
        { path: '/', label: t('dashboard'), icon: <BoardRegular /> },
        { path: '/live', label: t('liveTracking'), icon: <NavigationRegular /> },
      ],
    },
    {
      label: 'Fleet',
      items: [
        { path: '/buses', label: t('buses'), icon: <VehicleBusRegular /> },
        { path: '/drivers', label: t('driverManagement'), icon: <PeopleRegular /> },
        { path: '/routes', label: t('routes'), icon: <MapRegular /> },
        { path: '/stops', label: t('stops'), icon: <LocationRegular /> },
      ],
    },
    {
      label: 'Operations',
      items: [
        { path: '/trips', label: t('tripHistory'), icon: <ClockRegular /> },
      ],
    },
    {
      label: 'System',
      items: [
        { path: '/settings', label: t('settings'), icon: <SettingsRegular /> },
      ],
    },
  ]

  const isActive = (path: string) => {
    if (path === '/') return loc.pathname === '/'
    return loc.pathname === path || loc.pathname.startsWith(path + '/')
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🚌</div>
          <div className={styles.logoText}>
            <div className={styles.companyName}>{user.company || 'GM Bus Tracking'}</div>
            <div className={styles.companyMeta}>{lang.toUpperCase()} • Dashboard</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {sections.map((section, si) => (
            <div key={si} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.label}</div>
              {section.items.map(i => (
                <button key={i.path}
                  className={`${styles.navItem} ${isActive(i.path) ? styles.navItemActive : ''}`}
                  onClick={() => nav(i.path)}>
                  <span className={styles.navIcon}>{i.icon}</span>
                  <span className={styles.navLabel}>{i.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <Avatar name={user.name || user.company || 'User'} size={32}
            style={{ backgroundColor: '#2563eb', color: 'white', flexShrink: 0 }} />
          <div className={styles.footerUser}>
            <div className={styles.footerEmail}>{user.email || 'user@company.com'}</div>
            <div className={styles.footerRole}>Client Admin</div>
          </div>
          <Tooltip content={t('logout')} relationship="label">
            <button className={styles.iconBtn} onClick={logout} style={{ width: '30px', height: '30px' }}>
              <SignOutRegular />
            </button>
          </Tooltip>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>{title}</span>
          </div>
          <div className={styles.headerRight}>
            <Tooltip content="Announcements" relationship="label">
              <button className={styles.iconBtn} onClick={() => nav('/voice')}>
                <Speaker2Regular />
              </button>
            </Tooltip>
            <Tooltip content="Alerts" relationship="label">
              <button className={styles.iconBtn}>
                <AlertRegular />
              </button>
            </Tooltip>
            <Tooltip content={dark ? 'Light mode' : 'Dark mode'} relationship="label">
              <button className={styles.iconBtn} onClick={toggle}>
                {dark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
              </button>
            </Tooltip>
            <LanguageSwitcher />
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
