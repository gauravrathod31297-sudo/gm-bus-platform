import { useEffect, useState } from 'react'
import { Button, Card, Spinner, Dialog, DialogTrigger, DialogSurface,
  DialogTitle, DialogBody, DialogActions, DialogContent, Field, Input, MessageBar,
  MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell,
  TableBody, TableCell, makeStyles, tokens, Text } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  dialog: { maxWidth: '500px', width: '90vw' },
  field: { marginBottom: '16px', width: '100%' },
})

export default function RoutesPage() {
  const styles = useStyles()
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ route_name: '', start_point: '', end_point: '' })
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/api/route'); setRoutes(r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    try {
      await api.post('/api/route', form)
      setOpen(false); setForm({ route_name: '', start_point: '', end_point: '' })
      setMsg({ type: 'success', text: 'Route created!' })
      load()
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete route?')) return
    try { await api.delete(`/api/route/${id}`); load() } catch (e) { console.error(e) }
  }

  return (
    <Layout title="Routes">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <div className={styles.header}>
          <Text weight="semibold">All Routes ({routes.length})</Text>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
            <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="primary" icon={<AddRegular />}>Add Route</Button>
              </DialogTrigger>
              <DialogSurface className={styles.dialog}>
                <DialogBody>
                  <DialogTitle>Create New Route</DialogTitle>
                  <DialogContent>
                    <Field label="Route Name" required className={styles.field}>
                      <Input 
                        value={form.route_name} 
                        onChange={(_, d) => setForm({ ...form, route_name: d.value })} 
                        placeholder="Route 1 - City Center"
                        style={{ width: '100%' }}
                      />
                    </Field>
                    <Field label="Start Point" className={styles.field}>
                      <Input 
                        value={form.start_point} 
                        onChange={(_, d) => setForm({ ...form, start_point: d.value })} 
                        style={{ width: '100%' }}
                      />
                    </Field>
                    <Field label="End Point" className={styles.field}>
                      <Input 
                        value={form.end_point} 
                        onChange={(_, d) => setForm({ ...form, end_point: d.value })} 
                        style={{ width: '100%' }}
                      />
                    </Field>
                  </DialogContent>
                  <DialogActions>
                    <Button appearance="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button appearance="primary" onClick={create}>Save</Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </div>
        </div>

        {loading ? <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Start</TableHeaderCell>
              <TableHeaderCell>End</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {routes.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell><b>{r.route_name}</b></TableCell>
                  <TableCell>{r.start_point || '—'}</TableCell>
                  <TableCell>{r.end_point || '—'}</TableCell>
                  <TableCell>
                    <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => remove(r.id)} />
                  </TableCell>
                </TableRow>
              ))}
              {routes.length === 0 && <TableRow><TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>No routes yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  )
}
