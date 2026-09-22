import { useEffect, useState } from 'react'
import {
  Button, Card, Spinner, MessageBar, MessageBarBody,
  MessageBarTitle, makeStyles, tokens, Text, Table, TableHeader,
  TableRow, TableHeaderCell, TableBody, TableCell, Badge
} from '@fluentui/react-components'
import { ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px' },
  empty: { padding: '48px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
})

export default function Clients() {
  const styles = useStyles()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/clients')
      setClients(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statusBadge = (status: string) => {
    const color = status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'danger'
    return <Badge appearance="filled" color={color as any}>{status}</Badge>
  }

  return (
    <Layout title="Clients">
      <Card className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Text weight="semibold">All Clients ({clients.length})</Text>
          <Button icon={<ArrowSyncRegular />} onClick={load} disabled={loading}>Refresh</Button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div>
        ) : clients.length === 0 ? (
          <div className={styles.empty}>No clients yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Database</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell><b>{c.company_name}</b></TableCell>
                  <TableCell>{c.owner_name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>
                    <code style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                      {c.db_name || '—'}
                    </code>
                  </TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  )
}
