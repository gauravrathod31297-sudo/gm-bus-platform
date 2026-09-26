import { useEffect, useState } from 'react'
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, Select, Switch, Spinner, MessageBar, MessageBarBody, makeStyles, tokens, Text, Badge } from '@fluentui/react-components'
import { AddRegular, DeleteRegular, EditRegular, SaveRegular, KeyRegular, PersonRegular } from '@fluentui/react-icons'
import api from '../../services/api'
import SettingsLayout from '../../components/SettingsLayout'
import { useLanguage } from '../../i18n/LanguageContext'
import { showToast } from '../../utils/toast'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'

const useStyles = makeStyles({
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' },
  title: { fontSize: '24px', fontWeight: 700 },
  table: { background: 'white', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${tokens.colorNeutralStroke2}` },
  row: { display: 'grid', gridTemplateColumns: '50px 1.5fr 2fr 1.2fr 1fr 1fr 1.2fr', padding: '14px 16px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, alignItems: 'center', fontSize: '13px', gap: '8px' },
  hrow: { background: '#f9fafb', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' as const, color: tokens.colorNeutralForeground3 },
  field: { marginBottom: '14px' },
  actions: { display: 'flex', gap: '4px' },
  permGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' },
})

const ROLES = [
  { id: 'owner', name: 'Owner', color: '#9333ea' },
  { id: 'admin', name: 'Admin', color: '#2563eb' },
  { id: 'manager', name: 'Manager', color: '#16a34a' },
  { id: 'operator', name: 'Operator', color: '#d97706' },
  { id: 'viewer', name: 'Viewer', color: '#6b7280' },
]

const PERMISSIONS = [
  'users.create', 'users.edit', 'users.delete',
  'buses.edit', 'routes.edit', 'stops.edit',
  'voice.edit', 'trips.view', 'reports.download',
]

export default function Users() {
  const s = useStyles()
  const { t } = useLanguage()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [pwOpen, setPwOpen] = useState(false)
  const [pwUser, setPwUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'viewer', permissions: {} as any, is_active: true })

  const load = () => {
    setLoading(true)
    api.get('/api/users').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', password: '', role: 'viewer', permissions: {}, is_active: true })
    setOpen(true)
  }

  const openEdit = (u: any) => {
    setEditing(u)
    setForm({
      name: u.name, email: u.email, phone: u.phone || '',
      password: '', role: u.role, permissions: u.permissions || {}, is_active: u.is_active,
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.name || !form.email) { showToast('Error', 'Name + email required', 'error'); return }
    if (!editing && !form.password) { showToast('Error', 'Password required', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/api/users/${editing.id}`, {
          name: form.name, phone: form.phone, role: form.role,
          permissions: form.permissions, is_active: form.is_active,
        })
        showToast('Success', 'User updated')
      } else {
        await api.post('/api/users', form)
        showToast('Success', 'User created')
      }
      setOpen(false); load()
    } catch (e: any) { showToast('Error', e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return
    try { await api.delete(`/api/users/${id}`); showToast('Success', 'Deleted'); load() }
    catch (e: any) { showToast('Error', e.response?.data?.error || 'Failed', 'error') }
  }

  const resetPw = async () => {
    if (!newPassword || newPassword.length < 6) { showToast('Error', 'Min 6 chars', 'error'); return }
    try {
      await api.post(`/api/users/${pwUser.id}/reset-password`, { password: newPassword })
      showToast('Success', 'Password reset')
      setPwOpen(false); setNewPassword('')
    } catch (e: any) { showToast('Error', e.response?.data?.error || 'Failed', 'error') }
  }

  return (
    <SettingsLayout>
      <div className={s.header}>
        <Text className={s.title}>👥 Team Members</Text>
        <Button appearance="primary" icon={<AddRegular />} onClick={openAdd}>Add User</Button>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <EmptyState icon="👥" title="No users yet" description="Add team members to collaborate" action={openAdd} actionLabel="Add First User" />
      ) : (
        <div className={s.table}>
          <div className={`${s.row} ${s.hrow}`}>
            <div></div><div>Name</div><div>Email</div><div>Role</div><div>Status</div><div>Created</div><div>Actions</div>
          </div>
          {users.map(u => (
            <div key={u.id} className={s.row}>
              <div style={{ fontSize: '24px' }}>👤</div>
              <div><strong>{u.name}</strong><div style={{ fontSize: '11px', color: '#9ca3af' }}>{u.phone || '—'}</div></div>
              <div>{u.email}</div>
              <div>
                <Badge appearance="filled" style={{ background: ROLES.find(r => r.id === u.role)?.color || '#6b7280', color: 'white' }}>
                  {ROLES.find(r => r.id === u.role)?.name || u.role}
                </Badge>
              </div>
              <div><StatusBadge status={u.is_active ? 'active' : 'inactive'} label={u.is_active ? 'Active' : 'Disabled'} /></div>
              <div style={{ fontSize: '11px' }}>{new Date(u.created_at).toLocaleDateString()}</div>
              <div className={s.actions}>
                <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(u)} title="Edit" />
                <Button size="small" appearance="subtle" icon={<KeyRegular />} onClick={() => { setPwUser(u); setPwOpen(true) }} title="Reset password" />
                {u.role !== 'owner' && (
                  <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(u.id, u.name)} title="Delete" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '600px', width: '95vw' }}>
          <DialogBody>
            <DialogTitle>{editing ? '✏️ Edit User' : '👥 Add User'}</DialogTitle>
            <DialogContent>
              <Field label="Name *" className={s.field}><Input value={form.name} onChange={(_, d) => setForm({ ...form, name: d.value })} /></Field>
              <Field label="Email *" className={s.field}><Input type="email" value={form.email} onChange={(_, d) => setForm({ ...form, email: d.value })} disabled={!!editing} /></Field>
              <Field label="Phone" className={s.field}><Input value={form.phone} onChange={(_, d) => setForm({ ...form, phone: d.value })} /></Field>
              {!editing && (
                <Field label="Password *" className={s.field}><Input type="password" value={form.password} onChange={(_, d) => setForm({ ...form, password: d.value })} /></Field>
              )}
              <Field label="Role *" className={s.field}>
                <Select value={form.role} onChange={(_, d) => setForm({ ...form, role: d.value })}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>
              {editing && (
                <Field label="Active" className={s.field}>
                  <Switch checked={form.is_active} onChange={(_, d) => setForm({ ...form, is_active: d.checked })} />
                </Field>
              )}
              <Text weight="semibold" style={{ display: 'block', marginTop: '16px', marginBottom: '8px' }}>Custom Permissions (optional)</Text>
              <div className={s.permGrid}>
                {PERMISSIONS.map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form.permissions[p]} onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [p]: e.target.checked } })} />
                    <code>{p}</code>
                  </label>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>{saving ? '...' : 'Save'}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={(_, d) => setPwOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '400px' }}>
          <DialogBody>
            <DialogTitle>🔑 Reset Password</DialogTitle>
            <DialogContent>
              <Text style={{ display: 'block', marginBottom: '12px' }}>User: <strong>{pwUser?.name}</strong></Text>
              <Field label="New Password *"><Input type="password" value={newPassword} onChange={(_, d) => setNewPassword(d.value)} /></Field>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPwOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={resetPw}>Reset</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </SettingsLayout>
  )
}
