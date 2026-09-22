import { useEffect, useState } from 'react'
import {
  Card, Title1, Subtitle1, Spinner, makeStyles, tokens, Text
} from '@fluentui/react-components'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  card: { padding: '24px' },
  bigNum: { fontSize: '36px', fontWeight: '700', lineHeight: '1' },
})

export default function Dashboard() {
  const styles = useStyles()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Clients', value: stats?.clients?.total || 0, color: tokens.colorBrandForeground1 },
    { label: 'Approved', value: stats?.clients?.approved || 0, color: tokens.colorPaletteGreenForeground1 },
    { label: 'Pending Requests', value: stats?.pendingRequests || 0, color: tokens.colorPaletteYellowForeground1 },
    { label: 'Rejected', value: stats?.clients?.rejected || 0, color: tokens.colorPaletteRedForeground1 },
  ]

  return (
    <Layout title="Dashboard">
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div>
      ) : (
        <>
          <div className={styles.grid}>
            {statCards.map((s, i) => (
              <Card key={i} className={styles.card}>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>{s.label}</Text>
                <div className={styles.bigNum} style={{ color: s.color, marginTop: '8px' }}>
                  {s.value}
                </div>
              </Card>
            ))}
          </div>

          <Card className={styles.card}>
            <Subtitle1 style={{ marginBottom: '12px' }}>Welcome to GM Bus Tracking Admin</Subtitle1>
            <Text>
              Use the sidebar to manage requests and clients. All changes are applied in real-time.
            </Text>
          </Card>
        </>
      )}
    </Layout>
  )
}
