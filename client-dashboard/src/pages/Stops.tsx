import { useEffect, useState } from 'react'
import { Button, Card, Spinner, MessageBar, MessageBarBody,
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell,
  makeStyles, Text, Select, Badge } from '@fluentui/react-components'
import { DeleteRegular, ArrowSyncRegular, LocationRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'
import StopModal from '../components/StopModal'

const useStyles = makeStyles({
  card: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  empty: { padding: '48px', textAlign: 'center', color: '#999' },
  coords: { fontSize: '11px', color: '#666' },
})

export default function Stops() {
  const styles = useStyles()
  const [stops, setStops] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadRoutes = async () => {
    try { const r = await api.get('/api/route'); setRoutes(r.data) } catch (e) { console.error(e) }
  }

  const loadStops = async (routeId: string) => {
    if (!routeId) { setStops([]); return }
    setLoading(true)
    try { const r = await api.get(`/api/route/${routeId}/stops`); setStops(r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { loadRoutes() }, [])

  const remove = async (id: number) => {
    if (!confirm('Delete this stop?')) return
    try {
      await api.delete(`/api/route/stops/${id}`)
      loadStops(selectedRoute)
      setMsg({ type: 'success', text: 'Stop deleted' })
    } catch (e) { console.error(e) }
  }

  return (
    <Layout title="Stops">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <div className={styles.header}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Text weight="semibold">Route:</Text>
            <Select 
              value={selectedRoute} 
              onChange={(_, d) => { setSelectedRoute(d.value); loadStops(d.value) }} 
              style={{ minWidth: '250px' }}
            >
              <option value="">-- Select Route --</option>
              {routes.map(r => <option key={r.id} value={String(r.id)}>{r.route_name}</option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<ArrowSyncRegular />} onClick={() => loadStops(selectedRoute)} disabled={!selectedRoute}>
              Refresh
            </Button>
            {selectedRoute && (
              <StopModal 
                routeId={selectedRoute} 
                stopNumber={stops.length + 1} 
                onCreated={() => loadStops(selectedRoute)} 
              />
            )}
          </div>
        </div>

        {!selectedRoute ? (
          <div className={styles.empty}>
            <LocationRegular style={{ fontSize: '48px', marginBottom: '12px' }} />
            <Text>वरून Route select करा → Stops दिसतील</Text>
          </div>
        ) : loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div>
        ) : stops.length === 0 ? (
          <div className={styles.empty}>
            <Text>या route साठी अजून stops नाहीत</Text>
            <div style={{ marginTop: '16px' }}>
              <Text size={200}>वर "Add Stop" क्लिक करा</Text>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Stop Name</TableHeaderCell>
                <TableHeaderCell>Marathi</TableHeaderCell>
                <TableHeaderCell>Gujarati</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stops.map(s => (
                <TableRow key={s.id}>
                  <TableCell><Badge appearance="filled" color="brand">{s.stop_order}</Badge></TableCell>
                  <TableCell><b>{s.stop_name}</b></TableCell>
                  <TableCell>{s.stop_name_mr || '—'}</TableCell>
                  <TableCell>{s.stop_name_gu || '—'}</TableCell>
                  <TableCell>
                    <span className={styles.coords}>
                      📍 {s.lat?.toFixed(5)}, {s.lng?.toFixed(5)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => remove(s.id)} />
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
