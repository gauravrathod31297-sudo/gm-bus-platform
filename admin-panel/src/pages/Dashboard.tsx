import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Title1, Subtitle1, makeStyles, tokens
} from '@fluentui/react-components'
import { SignOutRegular } from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  root: { padding: '32px', minHeight: '100vh', backgroundColor: tokens.colorNeutralBackground2 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  card: { padding: '24px' },
})

export default function Dashboard() {
  const styles = useStyles()
  const nav = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')

  useEffect(() => {
    api.get('/api/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    nav('/login')
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title1>🚌 GM Bus Tracking</Title1>
          <Subtitle1>Welcome, {user.username}</Subtitle1>
        </div>
        <Button appearance="subtle" icon={<SignOutRegular />} onClick={logout}>
          Logout
        </Button>
      </div>
      <div className={styles.grid}>
        <Card className={styles.card}>
          <Subtitle1>Total Clients</Subtitle1>
          <Title1>{stats?.clients?.total || 0}</Title1>
        </Card>
        <Card className={styles.card}>
          <Subtitle1>Approved</Subtitle1>
          <Title1>{stats?.clients?.approved || 0}</Title1>
        </Card>
        <Card className={styles.card}>
          <Subtitle1>Pending Requests</Subtitle1>
          <Title1>{stats?.pendingRequests || 0}</Title1>
        </Card>
        <Card className={styles.card}>
          <Subtitle1>Rejected</Subtitle1>
          <Title1>{stats?.clients?.rejected || 0}</Title1>
        </Card>
      </div>
    </div>
  )
}
