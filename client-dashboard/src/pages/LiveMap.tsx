import { useEffect, useState } from 'react'
import { Card, Spinner, makeStyles, Text, Badge } from '@fluentui/react-components'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import Layout from '../components/Layout'
import { io, Socket } from 'socket.io-client'

const useStyles = makeStyles({
  card: { padding: '24px' },
  mapWrap: { height: '600px', borderRadius: '8px', overflow: 'hidden' },
  busList: { marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
})

const busIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="40" height="40"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>'),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

export default function LiveMap() {
  const styles = useStyles()
  const [buses, setBuses] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    api.get('/api/tracking/live').then((r: any) => {
      const map: Record<number, any> = {}
      r.data.forEach((b: any) => { map[b.bus_id] = b })
      setBuses(map)
    }).catch(console.error).finally(() => setLoading(false))

    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket.emit('viewer:join', { client_id: user.company_id })
    })

    socket.on('bus:location', (data: any) => {
      setBuses(prev => ({ ...prev, [data.bus_id]: data }))
    })

    return () => { socket.disconnect() }
  }, [])

  const busArray = Object.values(buses)

  return (
    <Layout title="Live Tracking">
      <Card className={styles.card}>
        {loading ? <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div> : (
          <>
            <Text weight="semibold" style={{ marginBottom: '16px', display: 'block' }}>
              🚌 Live Buses ({busArray.length})
            </Text>
            <div className={styles.mapWrap}>
              <MapContainer center={[18.5204, 73.8567]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {busArray.map((b: any) => (
                  <Marker key={b.bus_id} position={[b.lat, b.lng]} icon={busIcon}>
                    <Popup>
                      <b>Bus #{b.bus_id}</b><br />
                      Speed: {b.speed?.toFixed(1) || 0} km/h<br />
                      Lat: {b.lat?.toFixed(4)}, Lng: {b.lng?.toFixed(4)}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className={styles.busList}>
              {busArray.map((b: any) => (
                <Card key={b.bus_id} style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b>Bus #{b.bus_id}</b>
                    <Badge appearance="filled" color="success">Live</Badge>
                  </div>
                  <Text size={200}>Speed: {b.speed?.toFixed(1) || 0} km/h</Text>
                </Card>
              ))}
              {busArray.length === 0 && <Text style={{ padding: '24px' }}>No active buses</Text>}
            </div>
          </>
        )}
      </Card>
    </Layout>
  )
}
