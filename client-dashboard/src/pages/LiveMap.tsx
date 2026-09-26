import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, Spinner, makeStyles, tokens, Text, Badge, Button } from '@fluentui/react-components'
import { VehicleBusRegular, LocationRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import { io, Socket } from 'socket.io-client'
import Layout from '../components/Layout'
import api from '../services/api'

// Fix Leaflet marker icons (Vite bundler issue)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const busIcon = new L.DivIcon({
  className: 'bus-marker',
  html: '<div style="background:#2563eb;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white">🚌</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const stopIcon = new L.DivIcon({
  className: 'stop-marker',
  html: '<div style="background:#d97706;color:white;border-radius:50%;width:14px;height:14px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const useStyles = makeStyles({
  root: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', height: 'calc(100vh - 180px)' },
  mapCard: { overflow: 'hidden', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, position: 'relative' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' },
  busCard: { padding: '14px', borderRadius: '10px', border: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: 'white', cursor: 'pointer' },
  busCardActive: { border: '2px solid #2563eb', backgroundColor: '#eff6ff' },
})

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 1 }) }, [center, map])
  return null
}

interface BusLocation {
  bus_id: number; bus_number: string; route_name: string;
  lat: number; lng: number; speed?: number; heading?: number;
  last_update?: string; status?: string;
}

export default function LiveMap() {
  const s = useStyles()
  const [buses, setBuses] = useState<BusLocation[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Initial load
  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, rRes] = await Promise.all([
        api.get('/api/tracking/live').catch(() => ({ data: [] })),
        api.get('/api/route').catch(() => ({ data: [] })),
      ])
      setBuses(bRes.data || [])
      setRoutes(rRes.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])

  // Socket.io connection
  useEffect(() => {
    const socket = io(window.location.origin.replace('5174', '5000'), {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('🔌 Socket connected:', socket.id)
    })
    socket.on('disconnect', () => setConnected(false))

    socket.on('bus:update', (data: any) => {
      setBuses(prev => {
        const idx = prev.findIndex(b => b.bus_id === data.bus_id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...data }
          return next
        }
        return [...prev, data]
      })
    })

    return () => { socket.disconnect() }
  }, [])

  const selectedBus = buses.find(b => b.bus_id === selected)
  const selectedRoute = selectedBus ? routes.find((r: any) => r.name === selectedBus.route_name) : null

  const center: [number, number] = selectedBus
    ? [selectedBus.lat, selectedBus.lng]
    : buses.length > 0
      ? [buses[0].lat, buses[0].lng]
      : [19.0760, 72.8777] // Mumbai default

  if (loading) return <Layout title="Live Tracking"><Spinner /></Layout>

  return (
    <Layout title="Live Tracking">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Text style={{ fontSize: '24px', fontWeight: 700 }}>🗺️ Live Bus Tracking</Text>
          <Text style={{ display: 'block', fontSize: '13px', color: tokens.colorNeutralForeground3 }}>
            Real-time GPS positions
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge appearance="filled" style={{ backgroundColor: connected ? '#16a34a' : '#dc2626', color: 'white' }}>
            {connected ? '🟢 Live' : '🔴 Offline'}
          </Badge>
          <Button icon={<ArrowSyncRegular />} onClick={loadData} size="small" appearance="outline">Refresh</Button>
        </div>
      </div>

      <div className={s.root}>
        <Card className={s.mapCard}>
          <MapContainer
            center={center}
            zoom={13}
            style={{ width: '100%', height: '100%', minHeight: '500px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedBus && <MapFlyTo center={[selectedBus.lat, selectedBus.lng]} />}

            {buses.map(bus => (
              <Marker
                key={bus.bus_id}
                position={[bus.lat, bus.lng]}
                icon={busIcon}
                eventHandlers={{ click: () => setSelected(bus.bus_id) }}
              >
                <Popup>
                  <strong>🚌 {bus.bus_number}</strong><br />
                  Route: {bus.route_name}<br />
                  Speed: {bus.speed ? Math.round(bus.speed) + ' km/h' : '—'}
                </Popup>
              </Marker>
            ))}

            {selectedRoute?.stops?.map((stop: any, i: number) => (
              <Marker key={i} position={[stop.lat, stop.lng]} icon={stopIcon}>
                <Popup>{stop.name}</Popup>
              </Marker>
            ))}

            {selectedRoute?.stops?.length > 1 && (
              <Polyline
                positions={selectedRoute.stops.map((s: any) => [s.lat, s.lng])}
                color="#2563eb"
                weight={3}
                opacity={0.6}
                dashArray="10,6"
              />
            )}
          </MapContainer>
        </Card>

        <aside className={s.sidebar}>
          <Card style={{ padding: '12px' }}>
            <Text weight="semibold" style={{ marginBottom: '8px' }}>🚌 Active Buses ({buses.length})</Text>
            {buses.length === 0 ? (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No active buses</Text>
            ) : buses.map(bus => (
              <div
                key={bus.bus_id}
                className={`${s.busCard} ${selected === bus.bus_id ? s.busCardActive : ''}`}
                onClick={() => setSelected(bus.bus_id)}
                style={{ marginBottom: '8px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <VehicleBusRegular />
                  <strong>{bus.bus_number}</strong>
                </div>
                <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
                  {bus.route_name}
                </Text>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  <LocationRegular style={{ fontSize: '10px' }} /> {bus.lat.toFixed(4)}, {bus.lng.toFixed(4)}
                  {bus.speed ? ` · ${Math.round(bus.speed)} km/h` : ''}
                </div>
              </div>
            ))}
          </Card>

          {selectedBus && (
            <Card style={{ padding: '12px', backgroundColor: '#eff6ff' }}>
              <Text weight="semibold" style={{ marginBottom: '4px' }}>📍 Selected</Text>
              <Text size={200} style={{ display: 'block' }}>{selectedBus.bus_number}</Text>
              <Text size={200} style={{ display: 'block', color: '#6b7280' }}>{selectedBus.route_name}</Text>
              {selectedBus.last_update && (
                <Text size={100} style={{ display: 'block', marginTop: '8px', color: '#9ca3af' }}>
                  Last update: {new Date(selectedBus.last_update).toLocaleTimeString()}
                </Text>
              )}
            </Card>
          )}
        </aside>
      </div>
    </Layout>
  )
}
