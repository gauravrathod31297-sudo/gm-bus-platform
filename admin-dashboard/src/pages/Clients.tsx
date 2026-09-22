import { useEffect, useState } from 'react'
import { Button, Card, Dialog, DialogTrigger, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, Select, MessageBar, MessageBarBody, Spinner, makeStyles, tokens, Text } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, SaveRegular } from '@fluentui/react-icons'
import api from '../services/api'
const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  table: { width: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '60px 2fr 2fr 1.5fr 1.2fr 1fr 1fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '13px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  badge: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-block' },
  field: { marginBottom: '16px' },
})
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'hi', label: 'हिंदी' },
]
export default function Clients() {
  const s = useStyles()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ company_name: '', email: '', phone: '', password: '', preferred_language: 'gu' })
  const load = () => { setLoading(true); api.get('/api/admin/clients').then(r => setClients(r.data)).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])
  const save = async () => {
    if (!form.company_name || !form.email || !form.password) { setMsg({ type: 'error', text: 'सगळे required fields भरा' }); return }
    setSaving(true); setMsg(null)
    try {
      await api.post('/api/admin/clients', form)
      setMsg({ type: 'success', text: '✅ Client + DB तयार!' })
      setTimeout(() => { setOpen(false); resetForm(); load() }, 1500)
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setSaving(false) }
  }
  const resetForm = () => { setForm({ company_name: '', email: '', phone: '', password: '', preferred_language: 'gu' }); setMsg(null) }
  const toggleActive = async (id: number) => { await api.put(`/api/admin/clients/${id}/toggle`); load() }
  const del = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? DB पण delete होईल!`)) return
    await api.delete(`/api/admin/clients/${id}`); load()
  }
  const changeLang = async (id: number, lang: string) => { await api.put(`/api/admin/clients/${id}/language`, { language: lang }); load() }
  return (
    <>
      <div className={s.header}>
        <Text size={700} weight="bold">🏢 Clients</Text>
        <Dialog open={open} onOpenChange={(_, d) => { setOpen(d.open); if (!d.open) resetForm() }}>
          <DialogTrigger disableButtonEnhancement><Button appearance="primary" icon={<AddRegular />}>Add New Client</Button></DialogTrigger>
          <DialogSurface style={{ maxWidth: '600px', width: '95vw' }}>
            <DialogBody>
              <DialogTitle>🏢 Add New Client</DialogTitle>
              <DialogContent>
                {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
                <Field label="Company Name *" className={s.field}><Input value={form.company_name} onChange={(_, d) => setForm({ ...form, company_name: d.value })} placeholder="Gaurav Bus Service" /></Field>
                <Field label="Email *" className={s.field}><Input value={form.email} onChange={(_, d) => setForm({ ...form, email: d.value })} placeholder="owner@company.com" /></Field>
                <Field label="Phone" className={s.field}><Input value={form.phone} onChange={(_, d) => setForm({ ...form, phone: d.value })} placeholder="+91 9876543210" /></Field>
                <Field label="Password *" className={s.field}><Input type="password" value={form.password} onChange={(_, d) => setForm({ ...form, password: d.value })} /></Field>
                <Field label="Primary Language *" className={s.field}>
                  <Select value={form.preferred_language} onChange={(_, d) => setForm({ ...form, preferred_language: d.value })}>
                    {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </Select>
                </Field>
                <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>⚠️ नवीन PostgreSQL DB आपोआप तयार होईल</div>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setOpen(false); resetForm() }}>Cancel</Button>
                <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>{saving ? '...' : 'Create'}</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
      {loading ? <Spinner /> : (
        <div className={s.table}>
          <div className={`${s.row} ${s.hrow}`}><div>ID</div><div>Company</div><div>Email</div><div>DB Name</div><div>Language</div><div>Status</div><div>Actions</div></div>
          {clients.length === 0 ? (<div style={{ padding: '32px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>No clients yet.</div>) : clients.map(c => (
            <div key={c.id} className={s.row}>
              <div>#{c.id}</div>
              <div><strong>{c.company_name}</strong></div>
              <div style={{ fontSize: '12px' }}>{c.email}</div>
              <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>{c.db_name}</div>
              <div>
                <Select size="small" value={c.preferred_language} onChange={(_, d) => changeLang(c.id, d.value)} style={{ fontSize: '12px' }}>
                  {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </Select>
              </div>
              <div>
                <span className={s.badge} style={{ background: c.is_active ? '#dcfce7' : '#fee2e2', color: c.is_active ? '#16a34a' : '#dc2626', cursor: 'pointer' }} onClick={() => toggleActive(c.id)}>
                  {c.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
              <div><Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(c.id, c.company_name)} /></div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
