import { useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Tooltip, Avatar, Badge,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Divider, Input,
  MenuButton,
} from '@fluentui/react-components'
import {
  HomeRegular, ChartMultipleRegular, PeopleRegular, PaymentRegular,
  VehicleBusRegular, PersonRegular, MapRegular, LocationRegular,
  AlertRegular, SettingsRegular, ShieldRegular, SignOutRegular,
  ChevronLeftRegular, ChevronRightRegular, SearchRegular,
  WeatherMoonRegular, WeatherSunnyRegular, BuildingRegular,
  PhoneRegular,
} from '@fluentui/react-icons'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useThemeMode } from '../contexts/ThemeContext'

const SIDEBAR_W = 260
const SIDEBAR_COLLAPSED_W = 68
const TOPBAR_H = 60

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateRows: `${TOPBAR_H}px 1fr`,
    gridTemplateColumns: 'auto 1fr',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  sidebar: {
    gridRow: '1 / 3',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    height: `${TOPBAR_H}px`,
    boxSizing: 'border-box',
  },
  brandIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: 0,
  },
  brandText: {
    fontWeight: 700,
    fontSize: '15px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  sidebarNav: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: '8px',
    paddingBottom: '8px',
  },
  sectionLabel: {
    padding: '14px 18px 6px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 16px',
    margin: '1px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: tokens.colorNeutralForeground2,
    fontSize: '13.5px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.12s',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      color: tokens.colorNeutralForeground1,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: 600,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
      color: tokens.colorBrandForeground2,
    },
  },
  navIcon: {
    fontSize: '20px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  navText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sidebarFooter: {
    padding: '10px 8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  collapseBtn: {
    width: '100%',
    justifyContent: 'center',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '0 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    gridColumn: '2 / 3',
  },
  searchWrap: {
    flex: 1,
    maxWidth: '420px',
  },
  searchInput: {
    width: '100%',
  },
  topbarRight: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  iconBtn: {
    minWidth: '36px',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px 4px 4px',
    borderRadius: '20px',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  content: {
    overflowY: 'auto',
    padding: '24px 28px',
    gridColumn: '2 / 3',
  },
})

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: <HomeRegular />, label: 'Dashboard' },
      { to: '/analytics', icon: <ChartMultipleRegular />, label: 'Analytics' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/clients', icon: <PeopleRegular />, label: 'Clients' },
      { to: '/subscriptions', icon: <PaymentRegular />, label: 'Subscriptions' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/notifications', icon: <AlertRegular />, label: 'Notifications' },
      { to: '/settings', icon: <SettingsRegular />, label: 'Settings' },
      { to: '/signup-requests', icon: <AlertRegular />, label: 'Signup Requests' },
      { to: '/deployment', icon: <PhoneRegular />, label: 'Deployment' },
      { to: '/admins', icon: <ShieldRegular />, label: 'Admin Users' },
    ],
  },
]

export default function Layout() {
  const s = useStyles()
  const nav = useNavigate()
  const loc = useLocation()
  const { mode, toggle: toggleTheme } = useThemeMode()
  const [collapsed, setCollapsed] = useState(false)

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}') } catch { return {} }
  })()
  const displayName = user.name || user.email || 'Admin'

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    nav('/login')
  }

  const SW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W

  return (
    <div className={s.root} style={{ gridTemplateColumns: `${SW}px 1fr` }}>
      {/* ─── Sidebar ─── */}
      <aside className={s.sidebar} style={{ width: SW }}>
        <div className={s.sidebarHeader}>
          <div className={s.brandIcon}>
            <BuildingRegular style={{ fontSize: 20 }} />
          </div>
          {!collapsed && <Text className={s.brandText}>GM Bus Admin</Text>}
        </div>

        <nav className={s.sidebarNav}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.label}>
              {!collapsed && <div className={s.sectionLabel}>{sec.label}</div>}
              {sec.items.map(item => {
                const active = loc.pathname === item.to ||
                  (item.to !== '/' && loc.pathname.startsWith(item.to))
                const content = (
                  <Link
                    to={item.to}
                    className={`${s.navItem} ${active ? s.navItemActive : ''}`}
                  >
                    <span className={s.navIcon}>{item.icon}</span>
                    {!collapsed && <span className={s.navText}>{item.label}</span>}
                  </Link>
                )
                return collapsed
                  ? <Tooltip key={item.to} content={item.label} relationship="label" positioning="after">{content}</Tooltip>
                  : <div key={item.to}>{content}</div>
              })}
            </div>
          ))}
        </nav>

        <div className={s.sidebarFooter}>
          <Button
            className={s.collapseBtn}
            appearance="subtle"
            size="small"
            icon={collapsed ? <ChevronRightRegular /> : <ChevronLeftRegular />}
            onClick={() => setCollapsed(c => !c)}
          >
            {!collapsed && 'Collapse'}
          </Button>
        </div>
      </aside>

      {/* ─── Top bar ─── */}
      <header className={s.topbar}>
        <div className={s.searchWrap}>
          <Input
            className={s.searchInput}
            contentBefore={<SearchRegular />}
            placeholder="Search clients, buses, routes…"
            appearance="filled-darker"
            size="small"
          />
        </div>

        <div className={s.topbarRight}>
          <Tooltip content={mode === 'dark' ? 'Light mode' : 'Dark mode'} relationship="label">
            <Button
              className={s.iconBtn}
              appearance="subtle"
              icon={mode === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
              onClick={toggleTheme}
            />
          </Tooltip>

          <Tooltip content="Notifications" relationship="label">
            <Button
              className={s.iconBtn}
              appearance="subtle"
              icon={
                <span style={{ position: 'relative' }}>
                  <AlertRegular />
                  <Badge
                    appearance="filled"
                    color="danger"
                    size="tiny"
                    style={{ position: 'absolute', top: -4, right: -6 }}
                  >3</Badge>
                </span>
              }
            />
          </Tooltip>

          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <div className={s.userChip}>
                <Avatar
                  size={28}
                  name={displayName}
                  initials={displayName.charAt(0).toUpperCase()}
                  color="brand"
                />
                <Text size={200} weight="semibold" style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </Text>
              </div>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<PersonRegular />} onClick={() => nav('/profile')}>
                  Profile
                </MenuItem>
                <MenuItem icon={<SettingsRegular />} onClick={() => nav('/settings')}>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem icon={<SignOutRegular />} onClick={logout}>
                  Sign out
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className={s.content}>
        <Outlet />
      </main>
    </div>
  )
}
