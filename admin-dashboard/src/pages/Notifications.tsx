
import { useEffect, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Spinner, MessageBar, MessageBarBody,
  Tab, TabList, Avatar,
} from '@fluentui/react-components'
import { AlertRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { relativeTime } from '../utils/time'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  card: { background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, overflow: 'hidden' },
  row: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer', ':hover': { background: '#f9fafb' },
  },
  rowTitle: { fontSize: 13.5, fontWeight: 600, color: '#111827', display: 'block' },
  rowSub: { fontSize: 12.5, color: '#6b7280', display: 'block', marginTop: 2 },
  rowTime: { fontSize: 11.5, color: '#9ca3af', marginLeft: 'auto', whiteSpace: 'nowrap' },
  empty: { padding: 60, textAlign: 'center', color: '#6b7280' },
})

export default function Notifications() {
  const s = useStyles()
  const nav = useNavigate()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'all' | 'signup'>('all')

  const load = () => {
    setLoading(true); setErr('')
    api.get('/api/admin/activity')
      .then(r => setList(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = tab === 'signup' ? list.filter(x => x.type === 'client_signup') : list


  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Notifications' }]} />

      <div className={s.head}>
        <div>
          <Text className={s.h1}>Notifications</Text>
          <Text className={s.sub}>Recent platform activity</Text>
        </div>
        <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
      </div>

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as any)}>
        <Tab value="all">All activity</Tab>
        <Tab value="signup">Client signups</Tab>
      </TabList>

      {err && <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>}

      <div className={s.card}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><Spinner label="Loading…" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No activity yet" description="Platform events इथे दिसतील." />
        ) : (
          filtered.map(n => (
            <div key={n.type + n.id} className={s.row} onClick={() => nav(`/clients/${n.id}`)}>
              <Avatar size={32} icon={<AlertRegular />} color="brand" />
              <div style={{ flex: 1 }}>
                <span className={s.rowTitle}>{n.title || n.company_name || 'New client'}</span>
                <span className={s.rowSub}>{n.subtitle || n.email}</span>
              </div>
              <span className={s.rowTime}>{relativeTime(n.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
