import { useEffect, useState } from 'react'
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, MessageBar, MessageBarBody, Spinner, makeStyles, tokens } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, EditRegular, SaveRegular, SearchRegular } from '@fluentui/react-icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'
import { showToast } from '../utils/toast'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' },
  search: { flex: 1, maxWidth: '400px' },
  table: { background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '60px 2fr 1.5fr 1.5fr 1fr 1fr 1.2fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '13px', gap: '8px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  field: { marginBottom: '14px' },
  actions: { display: 'flex', gap: '6px' },
})

export default function RoutesPage() {
  const s = useStyles()
  const { t } = useLanguage()
  const nav = useNavigate()
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ route_name: '', start_point: '', end_point: '' })
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); api.get('/api/route').then(r => setRoutes(r.data)).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ route_name: '', start_point: '', end_point: '' }); setOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setForm({ route_name: r.route_name, start_point: r.start_point || '', end_point: r.end_point || '' }); setOpen(true) }

  const save = async () => {
    if (!form.route_name) { setMsg({ type: 'error', text: 'Route name required' }); return }
    setSaving(true); setMsg(null)
    try {
      if (editing) { await api.put(`/api/route/${editing.id}`, form); showToast(t('success'), t('saved')) }
      else { await api.post('/api/route', form); showToast(t('success'), t('saved')) }
      setOpen(false); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!confirm(`${t('deleteConfirm')} ${name} (stops पण delete होतील)`)) return
    try { await api.delete(`/api/route/${id}`); showToast(t('success'), t('deleted')); load() }
    catch { showToast(t('error'), 'Delete failed', 'error') }
  }

  const filtered = routes.filter(r => !search || (r.route_name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout title={t('routes')}>
      <div className={s.header}>
        <Input className={s.search} placeholder={t('searchAll')} value={search} onChange={(_, d) => setSearch(d.value)} contentBefore={<SearchRegular />} />
        <Button appearance="primary" icon={<AddRegular />} onClick={openAdd}>{t('addRoute')}</Button>
      </div>

      <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '500px' }}>
          <DialogBody>
            <DialogTitle>{editing ? '✏️ ' + t('edit') : '🛣️ ' + t('addRoute')}</DialogTitle>
            <DialogContent>
              {msg && <MessageBar intent={msg.type} style={{ marginBottom: '12px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
              <Field label={t('routeName') + ' *'} className={s.field}><Input value={form.route_name} onChange={(_, d) => setForm({ ...form, route_name: d.value })} /></Field>
              <Field label={t('startPoint')} className={s.field}><Input value={form.start_point} onChange={(_, d) => setForm({ ...form, start_point: d.value })} /></Field>
              <Field label={t('endPoint')} className={s.field}><Input value={form.end_point} onChange={(_, d) => setForm({ ...form, end_point: d.value })} /></Field>
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
          <div className={`${s.row} ${s.hrow}`}><div>ID</div><div>{t('routeName')}</div><div>{t('startPoint')}</div><div>{t('endPoint')}</div><div>{t('stops')}</div><div></div><div>{t('actions')}</div></div>
          {filtered.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>No routes</div> : filtered.map(r => (
            <div key={r.id} className={s.row}>
              <div>#{r.id}</div>
              <div><strong>{r.route_name}</strong></div>
              <div>{r.start_point || '—'}</div>
              <div>{r.end_point || '—'}</div>
              <div><Button size="small" appearance="subtle" onClick={() => nav('/stops?route=' + r.id)}>View</Button></div>
              <div></div>
              <div className={s.actions}>
                <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(r)} />
                <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(r.id, r.route_name)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
