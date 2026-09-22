import { useEffect, useState } from 'react'
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, Select, Spinner, makeStyles, tokens, Text } from '@fluentui/react-components'
import { EditRegular, SaveRegular } from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  table: { width: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '60px 2fr 1.2fr 1.5fr 1.5fr 1fr 1fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '13px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  badge: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-block' },
  field: { marginBottom: '14px' },
})

const PLAN_COLORS: any = {
  free: { bg: '#f3f4f6', fg: '#6b7280', label: 'Free Trial' },
  basic: { bg: '#dbeafe', fg: '#2563eb', label: 'Basic' },
  premium: { bg: '#fef3c7', fg: '#d97706', label: 'Premium' },
  enterprise: { bg: '#f3e8ff', fg: '#9333ea', label: 'Enterprise' },
}

const fmt = (d: any) => d ? new Date(d).toLocaleDateString() : '—'

export default function Subscriptions() {
  const s = useStyles()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ plan: 'basic', months: 1 })
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); api.get('/api/billing/subscriptions').then(r => setClients(r.data)).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const openEdit = (c: any) => { setEditing(c); setForm({ plan: c.plan || 'basic', months: 1 }); setOpen(true) }

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/api/billing/subscriptions/${editing.id}`, form)
      setOpen(false); load()
    } catch (e: any) { alert(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <>
      <Text size={700} weight="bold" style={{ display: 'block', marginBottom: '24px' }}>💳 Subscriptions</Text>
      {loading ? <Spinner /> : (
        <div className={s.table}>
          <div className={`${s.row} ${s.hrow}`}><div>ID</div><div>Company</div><div>Plan</div><div>Expires</div><div>Trial Ends</div><div>Status</div><div>Actions</div></div>
          {clients.map(c => (
            <div key={c.id} className={s.row}>
              <div>#{c.id}</div>
              <div><strong>{c.company_name}</strong></div>
              <div>
                <span className={s.badge} style={{ background: PLAN_COLORS[c.plan]?.bg || '#eee', color: PLAN_COLORS[c.plan]?.fg || '#333' }}>
                  {PLAN_COLORS[c.plan]?.label || c.plan}
                </span>
              </div>
              <div style={{ fontSize: '12px' }}>{fmt(c.plan_expires_at)}</div>
              <div style={{ fontSize: '12px' }}>{fmt(c.trial_ends_at)}</div>
              <div>
                <span className={s.badge} style={{ background: c.is_active ? '#dcfce7' : '#fee2e2', color: c.is_active ? '#16a34a' : '#dc2626' }}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div><Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(c)} /></div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '450px' }}>
          <DialogBody>
            <DialogTitle>✏️ Update Subscription</DialogTitle>
            <DialogContent>
              <Text style={{ display: 'block', marginBottom: '16px', fontWeight: 600 }}>{editing?.company_name}</Text>
              <Field label="Plan" className={s.field}>
                <Select value={form.plan} onChange={(_, d) => setForm({ ...form, plan: d.value })}>
                  <option value="free">Free Trial — ₹0</option>
                  <option value="basic">Basic — ₹499/month</option>
                  <option value="premium">Premium — ₹1,499/month</option>
                  <option value="enterprise">Enterprise — ₹4,999/month</option>
                </Select>
              </Field>
              <Field label="Duration (months)" className={s.field}>
                <Input type="number" value={String(form.months)} onChange={(_, d) => setForm({ ...form, months: parseInt(d.value) || 1 })} />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>{saving ? '...' : 'Update'}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  )
}
