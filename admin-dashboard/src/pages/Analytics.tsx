import { useEffect, useState } from 'react'
import { Card, Spinner, makeStyles, tokens, Text } from '@fluentui/react-components'
import api from '../services/api'

const useStyles = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' },
  card: { padding: '24px' },
  num: { fontSize: '36px', fontWeight: 700, marginTop: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
})

export default function Analytics() {
  const s = useStyles()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/api/billing/analytics').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <Spinner />

  const cards = [
    { label: 'Total Clients', value: data?.total_clients || 0, color: '#2563eb' },
    { label: 'Active Clients', value: data?.active_clients || 0, color: '#16a34a' },
    { label: 'Total Buses', value: data?.total_buses || 0, color: '#d97706' },
    { label: 'Monthly Revenue', value: '₹' + (data?.monthly_revenue || 0).toLocaleString(), color: '#9333ea' },
  ]

  const plans = ['free', 'basic', 'premium', 'enterprise']

  return (
    <>
      <Text size={700} weight="bold" style={{ display: 'block', marginBottom: '24px' }}>📊 Analytics</Text>

      <div className={s.grid}>
        {cards.map((c, i) => (
          <Card key={i} className={s.card}>
            <Text style={{ color: tokens.colorNeutralForeground3 }}>{c.label}</Text>
            <div className={s.num} style={{ color: c.color }}>{c.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card className={s.card}>
          <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: '16px' }}>📦 Resources</Text>
          <div className={s.row}><span>Total Routes</span><strong>{data?.total_routes || 0}</strong></div>
          <div className={s.row}><span>Total Stops</span><strong>{data?.total_stops || 0}</strong></div>
        </Card>

        <Card className={s.card}>
          <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: '16px' }}>💼 Clients by Plan</Text>
          {plans.map(p => (
            <div key={p} className={s.row}>
              <span style={{ textTransform: 'capitalize' }}>{p}</span>
              <strong>{data?.by_plan?.[p] || 0}</strong>
            </div>
          ))}
        </Card>
      </div>
    </>
  )
}
