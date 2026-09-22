import { useEffect, useState } from 'react'
import { Button, Card, Dialog, DialogTrigger, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, MessageBar, MessageBarBody, Spinner, makeStyles, tokens, Text, Select } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, EditRegular, SaveRegular, SearchRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'
import { showToast } from '../utils/toast'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' },
  search: { flex: 1, maxWidth: '400px' },
  table: { background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '60px 1.5fr 2fr 1.5fr 1.5fr 1fr 1.2fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '13px', gap: '8px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  field: { marginBottom: '14px' },
  actions: { display: 'flex', gap: '6px' },
})

export default function Buses() {
  const s = useStyles()
  const { t } = useLanguage()
  const [buses, setBuses] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ bus_number: '', driver_name: '', driver_phone: '', route_id: '', capacity: 40 })
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/bus').then(r => setBuses(r.data)).catch(() => {}),
      api.get('/api/route').then(r => setRoutes(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ bus_number: '', driver_name: '', driver_phone: '', route_id: '', capacity: 40 }); setOpen(true) }
  const openEdit = (b: any) => { setEditing(b); setForm({ bus_number: b.bus_number, driver_name: b.driver_name || '', driver_phone: b.driver_phone || '', route_id: b.route_id || '', capacity: b.capacity || 40 }); setOpen(true) }

  const save = async () => {
    if (!form.bus_number) { setMsg({ type: 'error', text: 'Bus number required' }); return }
    setSaving(true); setMsg(null)
    try {
      const payload = { ...form, route_id: form.route_id || null, capacity: parseInt(String(form.capacity)) || 40 }
      if (editing) { await api.put(`/api/bus/${editing.id}`, payload); showToast(t('success'), t('saved'), 'success') }
      else { await api.post('/api/bus', payload); showToast(t('success'), t('saved'), 'success') }
      setOpen(false); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setSaving(false) }
  }

  const del = async (id: number, num: string) => {
    if (!confirm(`${t('deleteConfirm')} ${num}`)) return
    try { await api.delete(`/api/bus/${id}`); showToast(t('success'), t('deleted'), 'success'); load() }
    catch { showToast(t('error'), 'Delete failed', 'error') }
  }

  const filtered = buses.filter(b => {
    const q = search.toLowerCase()
    return !q || (b.bus_number || '').toLowerCase().includes(q) || (b.driver_name || '').toLowerCase().includes(q)
  })

  return (
    <Layout title={t('buses')}>
      <div className={s.header}>
        <Input className={s.search} placeholder={t('searchAll')} value={search} onChange={(_, d) => setSearch(d.value)} contentBefore={<SearchRegular />} />
        <Button appearance="primary" icon={<AddRegular />} onClick={openAdd}>{t('addBus')}</Button>
      </div>

      <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '500px' }}>
          <DialogBody>
            <DialogTitle>{editing ? '✏️ ' + t('edit') : '🚌 ' + t('addBus')}</DialogTitle>
            <DialogContent>
              {msg && <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
              <Field label={t('busNumber') + ' *'} className={s.field}><Input value={form.bus_number} onChange={(_, d) => setForm({ ...form, bus_number: d.value })} placeholder="MH12-1234" /></Field>
              <Field label={t('driverName')} className={s.field}><Input value={form.driver_name} onChange={(_, d) => setForm({ ...form, driver_name: d.value })} /></Field>
              <Field label={t('driverPhone')} className={s.field}><Input value={form.driver_phone} onChange={(_, d) => setForm({ ...form, driver_phone: d.value })} /></Field>
              <Field label={t('route')} className={s.field}>
                <Select value={String(form.route_id)} onChange={(_, d) => setForm({ ...form, route_id: d.value })}>
                  <option value="">—</option>
                  {routes.map((r: any) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                </Select>
              </Field>
              <Field label={t('capacity')} className={s.field}><Input type="number" value={String(form.capacity)} onChange={(_, d) => setForm({ ...form, capacity: parseInt(d.value) || 40 })} /></Field>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
              <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>{saving ? '...' : t('save')}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {loading ? <Spinner /> : (
        <div className={s.table}>
          <div className={`${s.row} ${s.hrow}`}><div>ID</div><div>{t('busNumber')}</div><div>{t('driverName')}</div><div>{t('driverPhone')}</div><div>{t('route')}</div><div>{t('capacity')}</div><div>{t('actions')}</div></div>
          {filtered.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>No buses</div> : filtered.map(b => (
            <div key={b.id} className={s.row}>
              <div>#{b.id}</div>
              <div><strong>{b.bus_number}</strong></div>
              <div>{b.driver_name || '—'}</div>
              <div>{b.driver_phone || '—'}</div>
              <div>{routes.find(r => r.id === b.route_id)?.route_name || '—'}</div>
              <div>{b.capacity}</div>
              <div className={s.actions}>
                <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(b)} />
                <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(b.id, b.bus_number)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
