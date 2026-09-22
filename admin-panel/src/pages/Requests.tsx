import { useEffect, useState } from 'react'
import {
  Button, Card, Spinner, MessageBar, MessageBarBody,
  MessageBarTitle, makeStyles, tokens, Table, TableHeader,
  TableRow, TableHeaderCell, TableBody, TableCell
} from '@fluentui/react-components'
import { CheckmarkRegular, DismissRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px', marginBottom: '16px' },
  actions: { display: 'flex', gap: '8px' },
  empty: { padding: '48px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
})

export default function Requests() {
  const styles = useStyles()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/requests')
      setRequests(res.data)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const approve = async (id: number) => {
    setActionLoading(id)
    setMessage(null)
    try {
      await api.post(`/api/admin/requests/${id}/approve`)
      setMessage({ type: 'success', text: '✅ Client approved! Database created.' })
      load()
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Approve failed' })
    } finally {
      setActionLoading(null)
    }
  }

  const reject = async (id: number) => {
    if (!confirm('Reject this request?')) return
    setActionLoading(id)
    setMessage(null)
    try {
      await api.post(`/api/admin/requests/${id}/reject`)
      setMessage({ type: 'success', text: 'Request rejected' })
      load()
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Reject failed' })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Layout title="Signup Requests">
      {message && (
        <MessageBar intent={message.type === 'success' ? 'success' : 'error'} style={{ marginBottom: '16px' }}>
          <MessageBarBody>
            <MessageBarTitle>{message.type === 'success' ? 'Success' : 'Error'}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <Card className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Text weight="semibold">Pending Requests ({requests.length})</Text>
          <Button icon={<ArrowSyncRegular />} onClick={load} disabled={loading}>Refresh</Button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div>
        ) : requests.length === 0 ? (
          <div className={styles.empty}>No pending requests 🎉</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>City</TableHeaderCell>
                <TableHeaderCell>Buses</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.company_name}</TableCell>
                  <TableCell>{r.owner_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.city || '—'}</TableCell>
                  <TableCell>{r.bus_count || '—'}</TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button
                        appearance="primary"
                        size="small"
                        icon={<CheckmarkRegular />}
                        onClick={() => approve(r.id)}
                        disabled={actionLoading === r.id}
                      >
                        {actionLoading === r.id ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        onClick={() => reject(r.id)}
                        disabled={actionLoading === r.id}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  )
}
