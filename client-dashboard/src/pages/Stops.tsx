import { useEffect, useState } from 'react'
import { Button, Spinner, makeStyles, tokens, Select, Field, Input, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, MessageBar, MessageBarBody } from '@fluentui/react-components'
import { DeleteRegular, EditRegular, SaveRegular, AddRegular, ArrowSyncRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'
import { showToast } from '../utils/toast'
import StopModal from '../components/StopModal'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' },
  table: { background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '60px 60px 1.5fr 1.3fr 1.3fr 1.3fr 1.2fr 1.2fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '12px', gap: '6px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  field: { marginBottom: '12px' },
  actions: { display: 'flex', gap: '4px' },
})

export default function Stops() {
  const s = useStyles()
  const { t } = useLanguage()
  const [routes, setRoutes] = useState<any[]>([])
  const [routeId, setRouteId] = useState<string>('')
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ stop_name: '', stop_name_mr: '', stop_name_gu: '', stop_name_hi: '', stop_order: 1 })
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/route').then(r => setRoutes(r.data)).catch(() => {})
  }, [])

  const load = () => {
    if (!routeId) { setStops([]); return }
    setLoading(true)
    api.get(`/api/route/${routeId}/stops`).then(r => setStops(r.data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [routeId])

  const openEdit = (st: any) => {
    setEditing(st)
    setForm({
      stop_name: st.stop_name || '',
      stop_name_mr: st.stop_name_mr || '',
      stop_name_gu: st.stop_name_gu || '',
      stop_name_hi: st.stop_name_hi || '',
      stop_order: st.stop_order || 1,
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.stop_name) { setMsg({ type: 'error', text: 'English name required' }); return }
    setSaving(true); setMsg(null)
    try {
      await api.put(`/api/route/${routeId}/stops/${editing.id}`, {
        ...form,
        lat: editing.lat, lng: editing.lng,
      })
      showToast(t('success'), t('saved'))
      setOpen(false); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!confirm(`${t('deleteConfirm')} ${name}`)) return
    try { await api.delete(`/api/route/${routeId}/stops/${id}`); showToast(t('success'), t('deleted')); load() }
    catch { showToast(t('error'), 'Delete failed', 'error') }
  }

  return (
    <Layout title={t('stops')}>
      <div className={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <strong>{t('route')}:</strong>
          <Select value={routeId} onChange={(_, d) => setRouteId(d.value)} style={{ minWidth: '240px' }}>
            <option value="">— {t('selectRouteFirst')} —</option>
            {routes.map((r: any) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button icon={<ArrowSyncRegular />} onClick={load}>{t('refresh')}</Button>
          {routeId && <StopModal routeId={routeId} stopNumber={stops.length + 1} onCreated={load} />}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '520px' }}>
          <DialogBody>
            <DialogTitle>✏️ {t('edit')} Stop</DialogTitle>
            <DialogContent>
              {msg && <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
              <Field label="Stop Name (English)" className={s.field}><Input value={form.stop_name} onChange={(_, d) => setForm({ ...form, stop_name: d.value })} /></Field>
              <Field label="Stop Name (मराठी)" className={s.field}><Input value={form.stop_name_mr} onChange={(_, d) => setForm({ ...form, stop_name_mr: d.value })} /></Field>
              <Field label="Stop Name (ગુજરાતી)" className={s.field}><Input value={form.stop_name_gu} onChange={(_, d) => setForm({ ...form, stop_name_gu: d.value })} /></Field>
              <Field label="Stop Name (हिंदी)" className={s.field}><Input value={form.stop_name_hi} onChange={(_, d) => setForm({ ...form, stop_name_hi: d.value })} /></Field>
              <Field label={t('stopOrder')} className={s.field}><Input type="number" value={String(form.stop_order)} onChange={(_, d) => setForm({ ...form, stop_order: parseInt(d.value) || 1 })} /></Field>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
              <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>{saving ? '...' : t('save')}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {!routeId ? (
        <div style={{ padding: '48px', textAlign: 'center', color: tokens.colorNeutralForeground3, background: 'white', borderRadius: '8px' }}>
          {t('selectRouteFirst')}
        </div>
      ) : loading ? <Spinner /> : stops.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: tokens.colorNeutralForeground3, background: 'white', borderRadius: '8px' }}>
          {t('noStopsYet')}
        </div>
      ) : (
        <div className={s.table}>
          <div className={`${s.row} ${s.hrow}`}><div>ID</div><div>{t('stopOrder')}</div><div>EN</div><div>मराठी</div><div>ગુજરાતી</div><div>हिंदी</div><div>Lat/Lng</div><div>{t('actions')}</div></div>
          {stops.map(st => (
            <div key={st.id} className={s.row}>
              <div>#{st.id}</div>
              <div>{st.stop_order}</div>
              <div><strong>{st.stop_name}</strong></div>
              <div>{st.stop_name_mr || '—'}</div>
              <div>{st.stop_name_gu || '—'}</div>
              <div>{st.stop_name_hi || '—'}</div>
              <div style={{ fontSize: '10px' }}>{parseFloat(st.lat || 0).toFixed(4)}, {parseFloat(st.lng || 0).toFixed(4)}</div>
              <div className={s.actions}>
                <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(st)} />
                <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(st.id, st.stop_name)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
