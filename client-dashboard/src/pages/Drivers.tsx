import { useEffect, useState } from 'react'
import { Button, Spinner, makeStyles, tokens, Input, Avatar } from '@fluentui/react-components'
import { SearchRegular, VehicleBusRegular, PhoneRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' },
  search: { flex: 1, maxWidth: '400px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: { padding: '20px', background: 'white', borderRadius: '10px', border: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', gap: '14px', alignItems: 'flex-start' },
  avatar: { width: '48px', height: '48px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, fontSize: '18px' },
  info: { flex: 1 },
  name: { fontWeight: 600, fontSize: '15px' },
  phone: { fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' },
  busTag: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '10px', fontSize: '11px', fontWeight: 600, marginTop: '8px' },
})

export default function Drivers() {
  const s = useStyles()
  const { t } = useLanguage()
  const [buses, setBuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/api/bus').then(r => setBuses(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const drivers = buses
    .filter(b => b.driver_name)
    .filter(b => !search || b.driver_name.toLowerCase().includes(search.toLowerCase()) || b.bus_number.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout title={t('driverManagement')}>
      <div className={s.header}>
        <Input className={s.search} placeholder={t('searchAll')} value={search} onChange={(_, d) => setSearch(d.value)} contentBefore={<SearchRegular />} />
      </div>

      {loading ? <Spinner /> : drivers.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: tokens.colorNeutralForeground3, background: 'white', borderRadius: '8px' }}>
          No drivers — add driver name in Bus form
        </div>
      ) : (
        <div className={s.grid}>
          {drivers.map(b => (
            <div key={b.id} className={s.card}>
              <div className={s.avatar}>{(b.driver_name || 'D').charAt(0).toUpperCase()}</div>
              <div className={s.info}>
                <div className={s.name}>{b.driver_name}</div>
                <div className={s.phone}><PhoneRegular /> {b.driver_phone || '—'}</div>
                <div className={s.busTag}><VehicleBusRegular /> {b.bus_number}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
