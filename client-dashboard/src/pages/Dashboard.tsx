import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeStyles, tokens } from '@fluentui/react-components'
import {
  VehicleBusRegular, MapRegular, LocationRegular, PeopleRegular,
  AddRegular, ArrowSyncRegular, ArrowRightRegular,
  CheckmarkCircleRegular, WarningRegular, ClockRegular,
} from '@fluentui/react-icons'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  wrap: { maxWidth: '1400px' },

  // Top bar (greeting + actions)
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '24px', gap: '16px', flexWrap: 'wrap',
  },
  greetTitle: { fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' },
  greetSub: { fontSize: '13px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' },
  pulse: { width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' },
  actions: { display: 'flex', gap: '8px' },

  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#374151',
    transition: 'all 0.15s',
    ':hover': { background: '#f9fafb', borderColor: '#d1d5db' },
  },
  btnPrimary: {
    background: '#2563eb', color: 'white', border: '1px solid #2563eb',
    ':hover': { background: '#1d4ed8', borderColor: '#1d4ed8' },
  },

  // KPI grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px', marginBottom: '24px',
  },
  kpi: {
    background: 'white', padding: '18px 20px',
    borderRadius: '12px', border: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column', gap: '10px',
    cursor: 'pointer', transition: 'all 0.15s',
    ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#d1d5db' },
  },
  kpiHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiIcon: {
    width: '38px', height: '38px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
  },
  kpiBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
  },
  kpiVal: { fontSize: '30px', fontWeight: 700, lineHeight: 1, color: '#111827' },
  kpiLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },

  // Two-column layout
  midRow: {
    display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px',
    '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' },
  },

  // Card base
  card: {
    background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  cardHead: {
    padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', borderBottom: '1px solid #f3f4f6',
  },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
  cardSub: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' },

  liveBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '3px 10px', background: '#dcfce7', color: '#15803d',
    borderRadius: '12px', fontSize: '11px', fontWeight: 600,
  },

  mapWrap: { height: '340px', position: 'relative' },
  mapEmpty: {
    height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: '8px', color: '#9ca3af', background: '#fafbfc',
  },

  // Activity
  activityList: { padding: '8px 0', maxHeight: '340px', overflowY: 'auto' },
  activityItem: {
    padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start',
    borderBottom: '1px solid #f9fafb',
    ':last-child': { borderBottom: 'none' },
  },
  activityIcon: {
    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
  },
  activityText: { fontSize: '13px', color: '#111827', lineHeight: 1.4 },
  activityTime: { fontSize: '11px', color: '#9ca3af', marginTop: '3px' },

  // Bottom cards
  bottomGrid: {
    display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px',
    '@media (max-width: 1000px)': { gridTemplateColumns: '1fr' },
  },
  chartWrap: { padding: '16px 20px 20px' },
  chartStat: { display: 'flex', gap: '24px' },
  chartStatItem: { textAlign: 'right' },
  chartStatValue: { fontSize: '18px', fontWeight: 700, lineHeight: 1 },
  chartStatLabel: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },

  // Status list
  statusList: { padding: '12px 20px 20px' },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 0', borderBottom: '1px solid #f9fafb',
    ':last-child': { borderBottom: 'none' },
  },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  statusLabel: { flex: 1, fontSize: '13px', color: '#374151' },
  statusCount: { fontSize: '14px', fontWeight: 600, color: '#111827' },

  emptyHint: {
    padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px',
  },
} as any)

const busIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="36" height="36"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>'),
  iconSize: [36, 36], iconAnchor: [18, 36],
})

export default function Dashboard() {
  const s = useStyles()
  const { t } = useLanguage()
  const nav = useNavigate()
  const [buses, setBuses] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [live, setLive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [now, setNow] = useState(Date.now())
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  const load = () => {
    Promise.all([
      api.get('/api/bus').then(r => setBuses(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get('/api/route').then(r => setRoutes(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get('/api/drivers').then(r => setDrivers(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get('/api/tracking/live').then(r => setLive(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
    ]).finally(() => { setLoading(false); setLastUpdate(Date.now()) })
  }

  useEffect(() => { load(); const iv = setInterval(load, 20000); return () => clearInterval(iv) }, [])
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv) }, [])

  const secondsAgo = Math.floor((now - lastUpdate) / 1000)
  const updateText = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`

  const activeBuses = buses.filter(b => b.status === 'active').length
  const inactiveBuses = buses.filter(b => b.status === 'inactive').length

  const weeklyData = [
    { day: 'Mon', trips: 8 }, { day: 'Tue', trips: 12 }, { day: 'Wed', trips: 10 },
    { day: 'Thu', trips: 15 }, { day: 'Fri', trips: 14 }, { day: 'Sat', trips: 18 }, { day: 'Sun', trips: 9 },
  ]
  const totalTrips = weeklyData.reduce((a, b) => a + b.trips, 0)
  const avgTrips = Math.round(totalTrips / 7)
  const peakTrips = Math.max(...weeklyData.map(d => d.trips))

  const activities = [
    { id: '1', text: 'Bus MH12AB1234 started route', time: '2m', color: '#22c55e', icon: <CheckmarkCircleRegular /> },
    { id: '2', text: 'Route "Nashik → Pune" updated', time: '12m', color: '#2563eb', icon: <MapRegular /> },
    { id: '3', text: 'Driver Ramesh Patil added', time: '1h', color: '#9333ea', icon: <PeopleRegular /> },
    { id: '4', text: 'Bus MH14XY5678 maintenance', time: '2h', color: '#d97706', icon: <WarningRegular /> },
    { id: '5', text: 'Stop "Pune Station" added', time: '3h', color: '#2563eb', icon: <LocationRegular /> },
  ]

  const kpis = [
    { label: 'Total Buses', value: buses.length, sub: `${activeBuses} active`, icon: <VehicleBusRegular />, bg: '#dbeafe', fg: '#2563eb', path: '/buses' },
    { label: 'Routes', value: routes.length, sub: 'Active routes', icon: <MapRegular />, bg: '#dcfce7', fg: '#16a34a', path: '/routes' },
    { label: 'Drivers', value: drivers.length, sub: 'Team members', icon: <PeopleRegular />, bg: '#fef3c7', fg: '#d97706', path: '/drivers' },
    { label: 'Live Now', value: live.length, sub: 'Buses on road', icon: <LocationRegular />, bg: '#f3e8ff', fg: '#9333ea', path: '/live' },
  ]

  return (
    <Layout title={t('dashboard')}>
      <div className={s.wrap}>

        {/* Greeting bar */}
        <div className={s.topBar}>
          <div>
            <div className={s.greetTitle}>
              {user.company ? `Welcome back, ${user.company.split(' ')[0]}` : t('dashboard')}
            </div>
            <div className={s.greetSub}>
              <span className={s.pulse}></span>
              Live • Updated {updateText}
              <span style={{ color: '#d1d5db' }}>•</span>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className={s.actions}>
            <button className={s.btn} onClick={load}>
              <ArrowSyncRegular /> Refresh
            </button>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => nav('/buses')}>
              <AddRegular /> Add Bus
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className={s.kpiGrid}>
          {kpis.map((k, i) => (
            <div key={i} className={s.kpi} onClick={() => nav(k.path)}>
              <div className={s.kpiHead}>
                <div className={s.kpiIcon} style={{ background: k.bg, color: k.fg }}>{k.icon}</div>
              </div>
              <div>
                <div className={s.kpiVal}>{k.value}</div>
                <div className={s.kpiLabel} style={{ marginTop: '4px' }}>{k.label}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Live Map + Activity */}
        <div className={s.midRow}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div>
                <div className={s.cardTitle}>{t('liveMap')}</div>
                <div className={s.cardSub}>Real-time bus positions</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={s.liveBadge}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
                  {live.length} {t('liveNow')}
                </span>
                <button className={s.btn} style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => nav('/live')}>
                  View All <ArrowRightRegular />
                </button>
              </div>
            </div>
            {live.length === 0 ? (
              <div className={s.mapEmpty}>
                <span style={{ fontSize: '42px' }}>📍</span>
                <div style={{ fontWeight: 600, color: '#6b7280' }}>{t('noLiveBuses')}</div>
                <div style={{ fontSize: '12px' }}>Start a trip in Driver App to see buses here</div>
              </div>
            ) : (
              <div className={s.mapWrap}>
                <MapContainer center={[live[0]?.lat || 18.5204, live[0]?.lng || 73.8567]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                  {live.map((b, i) => (
                    <Marker key={i} position={[b.lat, b.lng]} icon={busIcon}>
                      <Popup>
                        <strong>{b.bus_number}</strong><br />
                        {b.driver_name}<br />
                        {b.route_name}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>

          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>{t('recentActivity')}</div>
              <button className={s.btn} style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => nav('/trips')}>
                {t('viewAll')}
              </button>
            </div>
            <div className={s.activityList}>
              {activities.map(a => (
                <div key={a.id} className={s.activityItem}>
                  <div className={s.activityIcon} style={{ background: a.color + '20', color: a.color }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={s.activityText}>{a.text}</div>
                    <div className={s.activityTime}>{a.time} ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart + Fleet status */}
        <div className={s.bottomGrid}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div>
                <div className={s.cardTitle}>{t('weeklyTrips')}</div>
                <div className={s.cardSub}>Last 7 days</div>
              </div>
              <div className={s.chartStat}>
                <div className={s.chartStatItem}>
                  <div className={s.chartStatValue} style={{ color: '#2563eb' }}>{totalTrips}</div>
                  <div className={s.chartStatLabel}>Total</div>
                </div>
                <div className={s.chartStatItem}>
                  <div className={s.chartStatValue} style={{ color: '#16a34a' }}>{avgTrips}</div>
                  <div className={s.chartStatLabel}>Avg/Day</div>
                </div>
                <div className={s.chartStatItem}>
                  <div className={s.chartStatValue} style={{ color: '#9333ea' }}>{peakTrips}</div>
                  <div className={s.chartStatLabel}>Peak</div>
                </div>
              </div>
            </div>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weeklyData}>
                  <defs>
                    <linearGradient id="tripGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="trips" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}>Fleet Status</div>
            </div>
            <div className={s.statusList}>
              <div className={s.statusRow}>
                <div className={s.statusDot} style={{ background: '#22c55e' }}></div>
                <div className={s.statusLabel}>Active buses</div>
                <div className={s.statusCount}>{activeBuses}</div>
              </div>
              <div className={s.statusRow}>
                <div className={s.statusDot} style={{ background: '#ef4444' }}></div>
                <div className={s.statusLabel}>Inactive buses</div>
                <div className={s.statusCount}>{inactiveBuses}</div>
              </div>
              <div className={s.statusRow}>
                <div className={s.statusDot} style={{ background: '#f59e0b' }}></div>
                <div className={s.statusLabel}>Maintenance</div>
                <div className={s.statusCount}>{buses.filter(b => b.status === 'maintenance').length}</div>
              </div>
              <div className={s.statusRow}>
                <div className={s.statusDot} style={{ background: '#3b82f6' }}></div>
                <div className={s.statusLabel}>Routes configured</div>
                <div className={s.statusCount}>{routes.length}</div>
              </div>
              <div className={s.statusRow}>
                <div className={s.statusDot} style={{ background: '#9333ea' }}></div>
                <div className={s.statusLabel}>Drivers registered</div>
                <div className={s.statusCount}>{drivers.length}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}
