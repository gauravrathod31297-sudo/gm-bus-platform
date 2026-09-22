import { useEffect, useState } from 'react'
import { Card, Spinner, makeStyles, tokens, Text } from '@fluentui/react-components'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  card: { padding: '24px' },
  bigNum: { fontSize: '36px', fontWeight: '700', lineHeight: '1' },
})

export default function Dashboard() {
  const styles = useStyles()
  const [buses, setBuses] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [live, setLive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    Promise.all([
      api.get('/api/bus').then(r => setBuses(r.data)).catch(() => {}),
      api.get('/api/route').then(r => setRoutes(r.data)).catch(() => {}),
      api.get('/api/tracking/live').then(r => setLive(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Buses', value: buses.length, color: tokens.colorBrandForeground1 },
    { label: 'Active Routes', value: routes.length, color: tokens.colorPaletteGreenForeground1 },
    { label: 'Live Now', value: live.length, color: tokens.colorPaletteYellowForeground1 },
    { label: 'Company', value: user.company || 'N/A', color: tokens.colorNeutralForeground1 },
  ]

  return (
    <Layout title="Dashboard">
      {loading ? <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div> : (
        <>
          <div className={styles.grid}>
            {cards.map((c, i) => (
              <Card key={i} className={styles.card}>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>{c.label}</Text>
                <div className={styles.bigNum} style={{ color: c.color, marginTop: '8px' }}>{c.value}</div>
              </Card>
            ))}
          </div>
          <Card className={styles.card}>
            <Text size={500} weight="semibold">Welcome, {user.name}!</Text>
            <Text style={{ display: 'block', marginTop: '8px' }}>
              Use the sidebar to manage your buses, routes, and track live locations.
            </Text>
          </Card>
        </>
      )}
    </Layout>
  )
}
