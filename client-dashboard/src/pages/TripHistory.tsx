import { useEffect, useState } from 'react'
import { Button, Spinner, makeStyles, tokens, Field, Input, Select } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
  filters: { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },
  table: { background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '60px 1.2fr 1.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '13px', gap: '8px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  badge: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-block' },
})

const fmt = (d: any) => d ? new Date(d).toLocaleString() : '—'

export default function TripHistory() {
  const s = useStyles()
  const { t } = useLanguage()
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const load = () => {
    setLoading(true)
    const q = []
    if (start) q.push(`start=${start}`)
    if (end) q.push(`end=${end}`)
    api.get('/api/trips' + (q.length ? '?' + q.join('&') : ''))
      .then(r => setTrips(r.data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const downloadCSV = () => {
    const token = localStorage.getItem('client_token')
    window.open(`/api/trips/export/csv?token=${token}`, '_blank')
  }

  return (
    <Layout title={t('tripHistory')}>
      <div className={s.header}>
        <div className={s.filters}>
          <Field label={t('startDate')}><Input type="date" value={start} onChange={(_, d) => setStart(d.value)} /></Field>
          <Field label={t('endDate')}><Input type="date" value={end} onChange={(_, d) => setEnd(d.value)} /></Field>
          <Button appearance="primary" icon={<ArrowSyncRegular />} onClick={load}>{t('search')}</Button>
        </div>
        <Button icon={<ArrowDownloadRegular />} onClick={downloadCSV}>{t('downloadCSV')}</Button>
      </div>

      {loading ? <Spinner /> : trips.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: tokens.colorNeutralForeground3, background: 'white', borderRadius: '8px' }}>
          No trips in this period
        </div>
      ) : (
        <div className={s.table}>
          <div className={`${s.row} ${s.hrow}`}>
            <div>ID</div><div>{t('busNumber')}</div><div>{t('driverName')}</div><div>{t('route')}</div>
            <div>{t('startDate')}</div><div>{t('endDate')}</div><div>{t('distance')}</div><div>{t('status')}</div>
          </div>
          {trips.map(tr => (
            <div key={tr.id} className={s.row}>
              <div>#{tr.id}</div>
              <div><strong>{tr.bus_number || '—'}</strong></div>
              <div>{tr.driver_name || '—'}</div>
              <div>{tr.route_name || '—'}</div>
              <div style={{ fontSize: '11px' }}>{fmt(tr.started_at)}</div>
              <div style={{ fontSize: '11px' }}>{fmt(tr.ended_at)}</div>
              <div>{tr.distance_km || 0} km</div>
              <div>
                <span className={s.badge} style={{ background: tr.status === 'completed' ? '#dcfce7' : '#fef3c7', color: tr.status === 'completed' ? '#16a34a' : '#d97706' }}>
                  {tr.status === 'completed' ? '✓ ' + t('completed') : '◉ ' + t('inProgress')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
