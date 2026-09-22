import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Spinner, makeStyles, tokens, Text, Button } from '@fluentui/react-components'
import {
  VehicleBusRegular, MapRegular, LocationRegular, AddRegular,
  ArrowTrendingRegular, BoardRegular, Speaker2Regular,
} from '@fluentui/react-icons'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { padding: '20px', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
    ':hover': { transform: 'translateY(-2px)', boxShadow: tokens.shadow8 } },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  iconBox: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
  bigNum: { fontSize: '32px', fontWeight: '700', lineHeight: '1' },
  trend: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', marginTop: '6px' },
  midRow: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' },
  mapCard: { padding: '0', overflow: 'hidden', height: '360px' },
  mapHeader: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mapWrap: { height: '300px', width: '100%' },
  activityCard: { padding: '20px', height: '360px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  activityList: { flex: 1, overflowY: 'auto', marginTop: '12px' },
  activityItem: { padding: '10px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', gap: '10px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0 },
  chartCard: { padding: '20px' },
  actionsRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' },
  actionBtn: { flex: '1 1 auto', minWidth: '160px', height: '52px', justifyContent: 'flex-start', gap: '10px' },
  empty: { padding: '48px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '12px' },
  liveBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
    background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  pulse: { width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' },
})

const busIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="36" height="36"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>'),
  iconSize: [36, 36], iconAnchor: [18, 36],
})

interface Activity { id: string; type: string; text: string; time: string; color: string }

export default function Dashboard() {
  const styles = useStyles()
  const { t, lang } = useLanguage()
  const nav = useNavigate()
  const [buses, setBuses] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [live, setLive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [now, setNow] = useState(Date.now())
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  const load = () => {
    Promise.all([
      api.get('/api/bus').then((r: any) => setBuses(r.data)).catch(() => {}),
      api.get('/api/route').then((r: any) => setRoutes(r.data)).catch(() => {}),
      api.get('/api/tracking/live').then((r: any) => setLive(r.data)).catch(() => {}),
    ]).finally(() => { setLoading(false); setLastUpdate(Date.now()) })
  }

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv) }, [])
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv) }, [])

  const secondsAgo = Math.floor((now - lastUpdate) / 1000)
  const updateText = secondsAgo < 60 ? `${secondsAgo} ${t('secondsAgo')}` : `${Math.floor(secondsAgo/60)} ${t('minutesAgo')}`

  const cards = [
    { label: t('totalBuses'), value: buses.length, icon: <VehicleBusRegular />, bg: '#dbeafe', fg: '#2563eb', trend: '+2', path: '/buses' },
    { label: t('activeRoutes'), value: routes.length, icon: <MapRegular />, bg: '#dcfce7', fg: '#16a34a', trend: '+1', path: '/routes' },
    { label: t('liveNow'), value: live.length, icon: <LocationRegular />, bg: '#fef3c7', fg: '#d97706', trend: '', path: '/live' },
    { label: t('trips'), value: 47, icon: <ArrowTrendingRegular />, bg: '#f3e8ff', fg: '#9333ea', trend: '+12%', path: '/live' },
  ]

  const activities: Activity[] = [
    { id: '1', type: 'start', text: `Bus MH12-1234 started route`, time: '2m', color: '#22c55e' },
    { id: '2', type: 'stop', text: `Bus MH12-5678 reached Shivaji Nagar`, time: '8m', color: '#2563eb' },
    { id: '3', type: 'ann', text: `Announcement played in Gujarati`, time: '12m', color: '#d97706' },
    { id: '4', type: 'end', text: `Bus MH12-1234 completed route`, time: '1h', color: '#94a3b8' },
    { id: '5', type: 'start', text: `Bus MH12-9012 started route`, time: '2h', color: '#22c55e' },
  ]

  const weeklyData = [
    { day: 'Mon', trips: 8 }, { day: 'Tue', trips: 12 }, { day: 'Wed', trips: 10 },
    { day: 'Thu', trips: 15 }, { day: 'Fri', trips: 14 }, { day: 'Sat', trips: 18 }, { day: 'Sun', trips: 9 },
  ]

  if (loading) return <Layout title={t('dashboard')}><div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div></Layout>

  return (
    <Layout title={t('dashboard')}>
      {/* Update indicator */}
      <div style={{ marginBottom: '16px', fontSize: '12px', color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={styles.pulse}></span>
        {t('updated')} {updateText}
      </div>

      {/* Empty state */}
      {buses.length === 0 && routes.length === 0 ? (
        <Card className={styles.empty}>
          <div className={styles.emptyIcon}>🚌</div>
          <Text size={600} weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>{t('addFirstBus')}</Text>
          <Text style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>{t('addFirstBusDesc')}</Text>
          <Button appearance="primary" size="large" icon={<AddRegular />} onClick={() => nav('/buses')}>
            {t('addBus')}
          </Button>
        </Card>
      ) : (
        <>
          {/* Quick Actions */}
          <div className={styles.actionsRow}>
            <Button className={styles.actionBtn} appearance="primary" icon={<AddRegular />} onClick={() => nav('/buses')}>{t('addBus')}</Button>
            <Button className={styles.actionBtn} appearance="outline" icon={<MapRegular />} onClick={() => nav('/routes')}>{t('addRoute')}</Button>
            <Button className={styles.actionBtn} appearance="outline" icon={<Speaker2Regular />} onClick={() => nav('/voice')}>{t('voiceSettings')}</Button>
          </div>

          {/* KPI Cards */}
          <div className={styles.grid}>
            {cards.map((c, i) => (
              <Card key={i} className={styles.card} onClick={() => nav(c.path)}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconBox} style={{ background: c.bg, color: c.fg }}>{c.icon}</div>
                  {c.trend && (
                    <div className={styles.trend} style={{ color: '#16a34a' }}>
                      ↑ {c.trend}
                    </div>
                  )}
                </div>
                <div className={styles.bigNum} style={{ color: c.fg }}>{c.value}</div>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px', display: 'block' }}>{c.label}</Text>
              </Card>
            ))}
          </div>

          {/* Map + Activity */}
          <div className={styles.midRow}>
            <Card className={styles.mapCard}>
              <div className={styles.mapHeader}>
                <Text weight="semibold">{t('liveMap')}</Text>
                <span className={styles.liveBadge}>
                  <span className={styles.pulse}></span>
                  {live.length} {t('liveNow')}
                </span>
              </div>
              {live.length === 0 ? (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colorNeutralForeground3 }}>
                  {t('noLiveBuses')}
                </div>
              ) : (
                <div className={styles.mapWrap}>
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
            </Card>

            <Card className={styles.activityCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text weight="semibold">{t('recentActivity')}</Text>
                <Button size="small" appearance="subtle" onClick={() => nav('/live')}>{t('viewAll')}</Button>
              </div>
              <div className={styles.activityList}>
                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }}>{t('noActivity')}</div>
                ) : activities.map(a => (
                  <div key={a.id} className={styles.activityItem}>
                    <div className={styles.dot} style={{ background: a.color }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px' }}>{a.text}</div>
                      <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>{a.time} ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card className={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Text weight="semibold">{t('weeklyTrips')}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>47 {t('thisWeek')}</Text>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="trips" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </Layout>
  )
}
