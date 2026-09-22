import { useEffect, useState } from 'react'
import { Button, Card, Spinner, Dialog, DialogTrigger, DialogSurface,
  DialogTitle, DialogBody, DialogActions, Field, Input, MessageBar,
  MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell,
  TableBody, TableCell, makeStyles, tokens, Text } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
})

export default function Buses() {
  const styles = useStyles()
  const [buses, setBuses] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ bus_number: '', driver_name: '', driver_phone: '', route_id: '', capacity: 40 })
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [b, r] = await Promise.all([api.get('/api/bus'), api.get('/api/route')])
      setBuses(b.data); setRoutes(r.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    try {
      await api.post('/api/bus', { ...form, route_id: form.route_id ? parseInt(form.route_id) : null })
      setOpen(false)
      setForm({ bus_number: '', driver_name: '', driver_phone: '', route_id: '', capacity: 40 })
      setMsg({ type: 'success', text: 'Bus added!' })
      load()
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this bus?')) return
    try { await api.delete(`/api/bus/${id}`); load() } catch (e) { console.error(e) }
  }

  return (
    <Layout title="Buses">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <div className={styles.header}>
          <Text weight="semibold">All Buses ({buses.length})</Text>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
            <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="primary" icon={<AddRegular />}>Add Bus</Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogTitle>Add New Bus</DialogTitle>
                <DialogBody>
                  <Field label="Bus Number" required>
                    <Input value={form.bus_number} onChange={(_, d) => setForm({ ...form, bus_number: d.value })} placeholder="MH-12-AB-1234" />
                  </Field>
                  <Field label="Driver Name">
                    <Input value={form.driver_name} onChange={(_, d) => setForm({ ...form, driver_name: d.value })} />
                  </Field>
                  <Field label="Driver Phone">
                    <Input value={form.driver_phone} onChange={(_, d) => setForm({ ...form, driver_phone: d.value })} />
                  </Field>
                  <Field label="Route">
                    <select value={form.route_id} onChange={e => setForm({ ...form, route_id: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                      <option value="">-- Select --</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                    </select>
                  </Field>
                  <Field label="Capacity">
                    <Input type="number" value={String(form.capacity)} onChange={(_, d) => setForm({ ...form, capacity: parseInt(d.value) || 40 })} />
                  </Field>
                </DialogBody>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button appearance="primary" onClick={create}>Save</Button>
                </DialogActions>
              </DialogSurface>
            </Dialog>
          </div>
        </div>

        {loading ? <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHeaderCell>Bus No.</TableHeaderCell>
              <TableHeaderCell>Driver</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Route</TableHeaderCell>
              <TableHeaderCell>Capacity</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {buses.map(b => (
                <TableRow key={b.id}>
                  <TableCell><b>{b.bus_number}</b></TableCell>
                  <TableCell>{b.driver_name || '—'}</TableCell>
                  <TableCell>{b.driver_phone || '—'}</TableCell>
                  <TableCell>{b.route_name || '—'}</TableCell>
                  <TableCell>{b.capacity}</TableCell>
                  <TableCell>
                    <Button size="small" appearance="subtle" icon={<DeleteRegular />}
                      onClick={() => remove(b.id)} />
                  </TableCell>
                </TableRow>
              ))}
              {buses.length === 0 && <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>No buses yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  )
}
