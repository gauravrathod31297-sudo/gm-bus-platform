import { useEffect, useMemo, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Input, MessageBar, MessageBarBody,
  Spinner, Dialog, DialogSurface, DialogBody, DialogTitle,
  DialogContent, DialogActions, Dropdown, Option,
} from '@fluentui/react-components'
import {
  SearchRegular, ArrowSyncRegular, AddRegular, DeleteRegular,
  QrCodeRegular, CopyRegular, PhoneRegular, VehicleBusRegular, ArrowDownloadRegular,
} from '@fluentui/react-icons'
import QRCode from 'react-qr-code'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { DataTable, type Column } from '../components/DataTable'
import { useDebounce } from '../hooks/useDebounce'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  toolbar: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, padding: '12px 14px' },
  search: { flex: 1, minWidth: 220 },
  card: { background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, overflow: 'hidden' },
  qrWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 8 },
  qrBox: { background: 'white', padding: 16, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12 },
  token: { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2, background: '#f3f4f6', padding: '8px 14px', borderRadius: 8 },
  meta: { fontSize: 13, color: '#6b7280' },
  hint: { fontSize: 12, color: '#9ca3af', maxWidth: 340, wordBreak: 'break-all' as const },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
})

type Bus = {
  id: number
  bus_number: string
  driver_name?: string
  driver_phone?: string
  capacity?: number
  pairing_token?: string
}

export default function Deployment() {
  const s = useStyles()
  const toast = useToast()
  const confirm = useConfirm()

  const [clients, setClients] = useState<any[]>([])
  const [clientId, setClientId] = useState<string>('')
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 200)

  const [qrBus, setQrBus] = useState<Bus | null>(null)
  const [addDlg, setAddDlg] = useState(false)
  const [newBus, setNewBus] = useState({ bus_number: '', driver_name: '', driver_phone: '', capacity: 40 })
  const [busy, setBusy] = useState(false)

  const loadClients = async () => {
    try {
      const r = await api.get('/api/admin/clients')
      const valid = (r.data || []).filter((c: any) => c.db_name && c.db_name !== 'null' && c.is_active)
      setClients(valid)
      if (!clientId && valid.length) setClientId(String(valid[0].id))
    } catch (e: any) { setErr(e.response?.data?.error || e.message) }
  }

  const loadBuses = async (cid: string) => {
    if (!cid) { setBuses([]); return }
    setLoading(true); setErr('')
    try {
      const r = await api.get(`/api/admin/clients/${cid}/buses`)
      setBuses(r.data || [])
    } catch (e: any) { setErr(e.response?.data?.error || e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadClients() }, [])
  useEffect(() => { if (clientId) loadBuses(clientId) }, [clientId])

  const addBus = async () => {
    if (!newBus.bus_number.trim()) { toast.error('Bus number आवश्यक'); return }
    setBusy(true)
    try {
      await api.post(`/api/admin/clients/${clientId}/buses`, {
        bus_number: newBus.bus_number.trim(),
        driver_name: newBus.driver_name || null,
        driver_phone: newBus.driver_phone || null,
        capacity: Number(newBus.capacity) || 40,
      })
      toast.success('Bus added')
      setAddDlg(false)
      setNewBus({ bus_number: '', driver_name: '', driver_phone: '', capacity: 40 })
      loadBuses(clientId)
    } catch (e: any) { toast.error('Add failed', e.response?.data?.error || e.message) }
    finally { setBusy(false) }
  }

  const removeBus = async (b: Bus) => {
    const ok = await confirm({
      title: 'Delete bus?',
      message: `${b.bus_number} कायमचा delete होईल.`,
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/api/admin/clients/${clientId}/buses/${b.id}`)
      toast.success('Bus deleted')
      loadBuses(clientId)
    } catch (e: any) { toast.error('Delete failed', e.response?.data?.error || e.message) }
  }

  const pairingUrl = (b: Bus) =>
    `gm-bus://pair?bus_id=${b.id}&bus_number=${encodeURIComponent(b.bus_number)}&token=${b.pairing_token}`

  const copyUrl = async (b: Bus) => {
    try {
      await navigator.clipboard.writeText(pairingUrl(b))
      toast.success('Pairing URL copied')
    } catch { toast.error('Copy failed') }
  }

  const filtered = useMemo(() => {
    if (!dq.trim()) return buses
    const t = dq.toLowerCase()
    return buses.filter(b =>
      (b.bus_number || '').toLowerCase().includes(t) ||
      (b.driver_name || '').toLowerCase().includes(t)
    )
  }, [buses, dq])

  const columns: Column<Bus>[] = useMemo(() => [
    {
      key: 'bus_number',
      label: 'Bus',
      sortable: true,
      getValue: (b) => b.bus_number.toLowerCase(),
      render: (b) => <strong>{b.bus_number}</strong>,
    },
    {
      key: 'driver_name',
      label: 'Driver',
      sortable: true,
      getValue: (b) => (b.driver_name || '').toLowerCase(),
      render: (b) => b.driver_name || '—',
    },
    {
      key: 'driver_phone',
      label: 'Phone',
      render: (b) => b.driver_phone || '—',
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      getValue: (b) => b.capacity ?? 0,
      render: (b) => b.capacity ?? '—',
    },
    {
      key: 'token',
      label: 'Pairing token',
      render: (b) => (
        <span className={s.token}>{b.pairing_token || '—'}</span>
      ),
    },
  ], [s])

  const rowActions = (b: Bus) => (
    <div className={s.actions}>
      <Button
        size="small" appearance="subtle" icon={<QrCodeRegular />}
        title="Show QR" onClick={() => setQrBus(b)}
      />
      <Button
        size="small" appearance="subtle" icon={<CopyRegular />}
        title="Copy pairing URL" onClick={() => copyUrl(b)}
      />
      <Button
        size="small" appearance="subtle" icon={<DeleteRegular />}
        title="Delete" onClick={() => removeBus(b)}
      />
    </div>
  )

  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Deployment' }]} />

      <div className={s.head}>
        <div>
          <Text className={s.h1}>Deployment</Text>
          <Text className={s.sub}>Bus devices · QR pairing · APK</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={() => loadBuses(clientId)}>
            Refresh
          </Button>
          <Button appearance="primary" icon={<AddRegular />} disabled={!clientId} onClick={() => setAddDlg(true)}>
            Add Bus
          </Button>
        </div>
      </div>

      <div className={s.toolbar}>
        <Dropdown
          value={clients.find(c => String(c.id) === clientId)?.company_name || 'Select client'}
          selectedOptions={[clientId]}
          onOptionSelect={(_, d) => setClientId(d.optionValue as string)}
        >
          {clients.map(c => (
            <Option key={c.id} value={String(c.id)}>{c.company_name || c.email}</Option>
          ))}
        </Dropdown>
        <Input
          className={s.search}
          contentBefore={<SearchRegular />}
          placeholder="Search bus or driver…"
          value={q}
          onChange={(_, d) => setQ(d.value)}
          appearance="filled-darker"
        />
      </div>

      {err && <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>}

      {loading ? (
        <div className={s.card} style={{ padding: 60, textAlign: 'center' }}>
          <Spinner label="Loading…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.card}>
          <EmptyState
            icon={<VehicleBusRegular />}
            title={buses.length === 0 ? 'No buses yet' : 'No matches'}
            description={buses.length === 0 ? 'Add a bus to generate its QR + pairing URL.' : 'Search बदला.'}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(b) => String(b.id)}
          pageSize={10}
          rowActions={rowActions}
          emptyMessage="No buses"
        />
      )}

      <div className={s.card} style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <PhoneRegular fontSize={32} style={{ color: '#1d4ed8' }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <Text style={{ fontWeight: 600, display: 'block' }}>Bus Device App (Android APK)</Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>
              GPS device app — यावर QR scan करून pairing करा
            </Text>
          </div>
          <a
            href="/apk/gm-bus-device.apk"
            download
            style={{ textDecoration: 'none' }}
          >
            <Button appearance="primary" icon={<ArrowDownloadRegular />}>
              Download APK (49 MB)
            </Button>
          </a>
        </div>
      </div>

      <Dialog open={!!qrBus} onOpenChange={(_, d) => !d.open && setQrBus(null)}>
        <DialogSurface style={{ maxWidth: 480 }}>
          <DialogBody>
            <DialogTitle>{qrBus?.bus_number} — Pair device</DialogTitle>
            <DialogContent>
              <div className={s.qrWrap}>
                <div className={s.qrBox}>
                  {qrBus && (
                    <QRCode
                      value={pairingUrl(qrBus)}
                      size={220}
                      bgColor="#ffffff"
                      fgColor="#111827"
                    />
                  )}
                </div>
                <div className={s.token}>{qrBus?.pairing_token}</div>
                <div className={s.meta}>
                  Driver app मध्ये हा QR scan करा
                </div>
                <div className={s.hint}>
                  {qrBus && pairingUrl(qrBus)}
                </div>
                <Button
                  appearance="secondary" icon={<CopyRegular />}
                  onClick={() => qrBus && copyUrl(qrBus)}
                >
                  Copy pairing URL
                </Button>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setQrBus(null)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={addDlg} onOpenChange={(_, d) => !d.open && setAddDlg(false)}>
        <DialogSurface style={{ maxWidth: 480 }}>
          <DialogBody>
            <DialogTitle>Add Bus</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input
                  placeholder="Bus number (e.g. MH12-AB-1234)"
                  value={newBus.bus_number}
                  onChange={(_, d) => setNewBus({ ...newBus, bus_number: d.value })}
                />
                <Input
                  placeholder="Driver name (optional)"
                  value={newBus.driver_name}
                  onChange={(_, d) => setNewBus({ ...newBus, driver_name: d.value })}
                />
                <Input
                  placeholder="Driver phone (optional)"
                  value={newBus.driver_phone}
                  onChange={(_, d) => setNewBus({ ...newBus, driver_phone: d.value })}
                />
                <Input
                  type="number"
                  placeholder="Capacity"
                  value={String(newBus.capacity)}
                  onChange={(_, d) => setNewBus({ ...newBus, capacity: Number(d.value) || 40 })}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAddDlg(false)}>Cancel</Button>
              <Button appearance="primary" disabled={busy} onClick={addBus}>
                {busy ? 'Adding…' : 'Add'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
