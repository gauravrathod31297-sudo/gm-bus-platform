import { useEffect, useState } from 'react'
import { Button, Card, Spinner, Dialog, DialogTrigger, DialogSurface,
  DialogTitle, DialogBody, DialogActions, DialogContent, Field, Input, MessageBar,
  MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell,
  TableBody, TableCell, makeStyles, Text, Select } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  dialog: { maxWidth: '500px', width: '90vw' },
  field: { marginBottom: '16px', width: '100%' },
})

export default function Stops() {
  const styles = useStyles()
  const [stops, setStops] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ stop_name: '', stop_name_mr: '', stop_name_gu: '', lat: '', lng: '', stop_order: 1 })
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadRoutes = async () => {
    try { const r = await api.get('/api/route'); setRoutes(r.data) } catch (e) { console.error(e) }
  }

  const loadStops = async (routeId: string) => {
    if (!routeId) return
    setLoading(true)
    try { const r = await api.get(`/api/route/${routeId}/stops`); setStops(r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { loadRoutes() }, [])

  const create = async () => {
    if (!selectedRoute) return
    try {
      await api.post(`/api/route/${selectedRoute}/stops`, { ...form, lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0, stop_order: parseInt(String(form.stop_order)) })
      setOpen(false)
      setForm({ stop_name: '', stop_name_mr: '', stop_name_gu: '', lat: '', lng: '', stop_order: stops.length + 1 })
      setMsg({ type: 'success', text: 'Stop added!' })
      loadStops(selectedRoute)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this stop?')) return
    try { await api.delete(`/api/route/stops/${id}`); loadStops(selectedRoute) } catch (e) { console.error(e) }
  }

  return (
    <Layout title="Stops">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <div className={styles.header}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Text weight="semibold">Select Route:</Text>
            <Select value={selectedRoute} onChange={(_, d) => { setSelectedRoute(d.value); loadStops(d.value) }} style={{ minWidth: '250px' }}>
              <option value="">-- Select --</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<ArrowSyncRegular />} onClick={() => loadStops(selectedRoute)} disabled={!selectedRoute}>Refresh</Button>
            <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="primary" icon={<AddRegular />} disabled={!selectedRoute}>Add Stop</Button>
              </DialogTrigger>
              <DialogSurface className={styles.dialog}>
                <DialogBody>
                  <DialogTitle>Add New Stop</DialogTitle>
                  <DialogContent>
                    <Field label="Stop Name (English)" required className={styles.field}>
                      <Input value={form.stop_name} onChange={(_, d) => setForm({ ...form, stop_name: d.value })} style={{ width: '100%' }} />
                    </Field>
                    <Field label="Stop Name (Marathi)" className={styles.field}>
                      <Input value={form.stop_name_mr} onChange={(_, d) => setForm({ ...form, stop_name_mr: d.value })} style={{ width: '100%' }} />
                    </Field>
                    <Field label="Stop Name (Gujarati)" className={styles.field}>
                      <Input value={form.stop_name_gu} onChange={(_, d) => setForm({ ...form, stop_name_gu: d.value })} style={{ width: '100%' }} />
                    </Field>
                    <Field label="Latitude" className={styles.field}>
                      <Input value={form.lat} onChange={(_, d) => setForm({ ...form, lat: d.value })} placeholder="18.5204" style={{ width: '100%' }} />
                    </Field>
                    <Field label="Longitude" className={styles.field}>
                      <Input value={form.lng} onChange={(_, d) => setForm({ ...form, lng: d.value })} placeholder="73.8567" style={{ width: '100%' }} />
                    </Field>
                    <Field label="Stop Order" className={styles.field}>
                      <Input type="number" value={String(form.stop_order)} onChange={(_, d) => setForm({ ...form, stop_order: parseInt(d.value) || 1 })} style={{ width: '100%' }} />
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
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Marathi</TableHeaderCell>
              <TableHeaderCell>Lat/Lng</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {stops.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.stop_order}</TableCell>
                  <TableCell><b>{s.stop_name}</b></TableCell>
                  <TableCell>{s.stop_name_mr || '—'}</TableCell>
                  <TableCell>{s.lat}, {s.lng}</TableCell>
                  <TableCell><Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => remove(s.id)} /></TableCell>
                </TableRow>
              ))}
              {stops.length === 0 && <TableRow><TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>{selectedRoute ? 'No stops yet' : 'Select a route first'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>
    </Layout>
  )
}
