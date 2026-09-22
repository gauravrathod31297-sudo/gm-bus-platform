import { useEffect, useState } from 'react'
import { Card, makeStyles, tokens, Text, Spinner } from '@fluentui/react-components'
import api from '../services/api'
const useStyles = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' },
  card: { padding: '24px' },
  num: { fontSize: '36px', fontWeight: 700, marginTop: '8px' },
})
export default function Dashboard() {
  const s = useStyles()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/api/admin/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <Spinner />
  const cards = [
    { label: 'Total Clients', value: stats?.total_clients || 0, color: '#2563eb' },
    { label: 'Active Clients', value: stats?.active_clients || 0, color: '#16a34a' },
    { label: 'Total Buses', value: stats?.total_buses || 0, color: '#d97706' },
    { label: 'Total Routes', value: stats?.total_routes || 0, color: '#9333ea' },
  ]
  return (
    <>
      <Text size={700} weight="bold" style={{ display: 'block', marginBottom: '24px' }}>📊 Dashboard</Text>
      <div className={s.grid}>
        {cards.map((c, i) => (
          <Card key={i} className={s.card}>
            <Text style={{ color: tokens.colorNeutralForeground3 }}>{c.label}</Text>
            <div className={s.num} style={{ color: c.color }}>{c.value}</div>
          </Card>
        ))}
      </div>
    </>
  )
}
