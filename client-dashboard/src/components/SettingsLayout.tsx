import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { makeStyles, tokens, Text } from '@fluentui/react-components'
import {
  PersonRegular, MailRegular, Speaker2Regular, BuildingRegular,
  ShieldRegular, InfoRegular,
} from '@fluentui/react-icons'
import Layout from './Layout'
import { Breadcrumbs } from './ui/Breadcrumbs'

const useStyles = makeStyles({
  root: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'flex-start' },
  sidebar: {
    background: 'white', borderRadius: '12px', padding: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    position: 'sticky', top: '20px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
    padding: '11px 14px', marginBottom: '2px', border: 'none', background: 'transparent',
    cursor: 'pointer', borderRadius: '8px', fontSize: '14px', textAlign: 'left',
    color: tokens.colorNeutralForeground1, transition: 'all 0.15s',
    ':hover': { background: tokens.colorNeutralBackground2 },
  },
  navItemActive: {
    background: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: '0.5px', color: tokens.colorNeutralForeground3,
    padding: '12px 14px 6px', display: 'block',
  },
  content: { minWidth: 0 },
  icon: { fontSize: '18px' },
})

interface Props { children: ReactNode; title?: string }

export default function SettingsLayout({ children }: Props) {
  const s = useStyles()
  const nav = useNavigate()
  const loc = useLocation()

  const items = [
    { section: 'Account', links: [
      { path: '/settings', label: 'Profile', icon: <PersonRegular /> },
      { path: '/settings/security', label: 'Security', icon: <ShieldRegular /> },
    ]},
    { section: 'Organization', links: [
      { path: '/settings/company', label: 'Company', icon: <BuildingRegular /> },
      { path: '/settings/users', label: 'Users & Roles', icon: <PersonRegular /> },
    ]},
    { section: 'System', links: [
      { path: '/settings/voice', label: 'Voice & Announcements', icon: <Speaker2Regular /> },
      { path: '/settings/smtp', label: 'Email (SMTP)', icon: <MailRegular /> },
      { path: '/settings/about', label: 'About', icon: <InfoRegular /> },
    ]},
  ]

  return (
    <Layout title="Settings">
      <Breadcrumbs />
      <div style={{ marginBottom: '20px' }}>
        <Text style={{ fontSize: '26px', fontWeight: 700 }}>⚙️ Settings</Text>
        <Text style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: tokens.colorNeutralForeground3 }}>
          Manage your account, team, and system preferences
        </Text>
      </div>

      <div className={s.root}>
        <aside className={s.sidebar}>
          {items.map((group, gi) => (
            <div key={gi}>
              <span className={s.sectionLabel}>{group.section}</span>
              {group.links.map(link => (
                <button
                  key={link.path}
                  className={`${s.navItem} ${loc.pathname === link.path ? s.navItemActive : ''}`}
                  onClick={() => nav(link.path)}
                >
                  <span className={s.icon}>{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>
        <div className={s.content}>{children}</div>
      </div>
    </Layout>
  )
}
