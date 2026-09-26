import { useEffect, useMemo, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Avatar, Dialog, DialogSurface,
  DialogBody, DialogTitle, DialogContent, DialogActions, Input,
  Spinner, MessageBar, MessageBarBody,
} from '@fluentui/react-components'
import {
  ShieldRegular, AddRegular, DeleteRegular, EditRegular, ArrowSyncRegular,
} from '@fluentui/react-icons'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import { FormField, FormSection } from '../components/Form'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  card: { background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, overflow: 'hidden' },
  list: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  rowLast: { borderBottom: 'none' },
  name: { fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' },
  email: { fontSize: 12.5, color: '#6b7280', display: 'block' },
  role: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', marginLeft: 'auto' },
  actions: { display: 'flex', gap: 4 },
  dialog: { maxWidth: 500 },
})

export default function Admins() {
  const s = useStyles()
  const toast = useToast()
  const confirm = useConfirm()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [dlg, setDlg] = useState<{ open: boolean; editing?: any; name: string; email: string }>({ open: false, name: '', email: '' })

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const r = await api.get('/api/admin/users')
      setList(r.data || [])
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message
      setErr(msg)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => setDlg({ open: true, name: '', email: '' })
  const openEdit = (u: any) => setDlg({ open: true, editing: u, name: u.name || '', email: u.email || '' })

  const save = async () => {
    if (!dlg.name.trim() || !dlg.email.trim()) {
      toast.error('Name आणि Email आवश्यक')
      return
    }
    setBusy(true)
    try {
      if (dlg.editing) {
        await api.put(`/api/admin/users/${dlg.editing.id}`, { name: dlg.name, email: dlg.email })
        toast.success('Admin updated')
      } else {
        const r = await api.post('/api/admin/users', { name: dlg.name, email: dlg.email })
        toast.success('Admin added', r.data?.temp_password ? `Temp password: ${r.data.temp_password}` : undefined)
      }
      setDlg({ open: false, name: '', email: '' })
      load()
    } catch (e: any) {
      toast.error('Save failed', e.response?.data?.error || e.message)
    } finally { setBusy(false) }
  }

  const remove = async (u: any) => {
    const ok = await confirm({
      title: 'Delete admin?',
      message: `${u.email} चा access कायमचा बंद होईल.`,
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/api/admin/users/${u.id}`)
      toast.success('Admin removed')
      load()
    } catch (e: any) {
      toast.error('Delete failed', e.response?.data?.error || e.message)
    }
  }

  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Admin Users' }]} />
      <div className={s.head}>
        <div>
          <Text className={s.h1}>Admin Users</Text>
          <Text className={s.sub}>Super-admin and staff accounts</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
          <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>Add Admin</Button>
        </div>
      </div>

      {err && <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>}

      {loading ? (
        <div className={s.card} style={{ padding: 60, textAlign: 'center' }}>
          <Spinner label="Loading…" />
        </div>
      ) : list.length === 0 ? (
        <div className={s.card}>
          <EmptyState icon={<ShieldRegular />} title="No admins" description="Add the first admin user." />
        </div>
      ) : (
        <div className={s.card}>
          <div className={s.list}>
            {list.map((u, idx) => (
              <div key={u.id} className={`${s.row} ${idx === list.length - 1 ? s.rowLast : ''}`}>
                <Avatar size={40} name={u.name || u.email} color="brand" icon={<ShieldRegular />} />
                <div>
                  <span className={s.name}>{u.name || 'Admin'}</span>
                  <span className={s.email}>{u.email}</span>
                </div>
                <span className={s.role}>{(u.role || 'admin').toUpperCase()}</span>
                <div className={s.actions}>
                  <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(u)} />
                  <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => remove(u)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dlg.open} onOpenChange={(_, d) => !d.open && setDlg({ open: false, name: '', email: '' })}>
        <DialogSurface className={s.dialog}>
          <DialogBody>
            <DialogTitle>{dlg.editing ? 'Edit Admin' : 'Add Admin'}</DialogTitle>
            <DialogContent>
              <FormSection title="" description="">
                <FormField label="Full name" required value={dlg.name}
                  onChange={(v) => setDlg({ ...dlg, name: v })} placeholder="Gaurav Rathod" />
                <FormField label="Email" type="email" required value={dlg.email}
                  onChange={(v) => setDlg({ ...dlg, email: v })} placeholder="admin@example.com"
                  disabled={!!dlg.editing} />
              </FormSection>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDlg({ open: false, name: '', email: '' })}>Cancel</Button>
              <Button appearance="primary" disabled={busy} onClick={save}>
                {busy ? 'Saving…' : 'Save'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
