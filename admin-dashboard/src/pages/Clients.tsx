
import { useEffect, useMemo, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Input, MessageBar, MessageBarBody,
  Avatar, Dropdown, Option, Dialog, DialogSurface, DialogBody, DialogTitle,
  DialogContent, DialogActions,
} from '@fluentui/react-components'
import {
  SearchRegular, ArrowSyncRegular, EyeRegular, KeyRegular, ProhibitedRegular,
  CheckmarkCircleRegular, PeopleRegular, DismissRegular,
} from '@fluentui/react-icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useDebounce } from '../hooks/useDebounce'
import { TableSkeleton } from '../components/Skeletons'
import EmptyState from '../components/EmptyState'
import Breadcrumbs from '../components/Breadcrumbs'
import { DataTable, type Column } from '../components/DataTable'
import { relativeTime } from '../utils/time'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  toolbar: {
    display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
    background: 'white', border: '1px solid ' + tokens.colorNeutralStroke2,
    borderRadius: 12, padding: '12px 14px',
  },
  search: { flex: 1, minWidth: 220 },
  card: { background: 'white', border: '1px solid ' + tokens.colorNeutralStroke2, borderRadius: 12, overflow: 'hidden' },
  companyCell: { display: 'flex', alignItems: 'center', gap: 10 },
  name: { fontWeight: 600, color: '#111827', display: 'block' },
  mail: { fontSize: 12, color: '#9ca3af', display: 'block' },
  pill: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10 },
  pillSuccess: { background: '#dcfce7', color: '#15803d' },
  pillDanger: { background: '#fee2e2', color: '#b91c1c' },
  pillNeutral: { background: '#f3f4f6', color: '#4b5563' },
  actions: { display: 'flex', gap: 4, justifyContent: 'flex-end' },
  dialog: { maxWidth: 560 },
  otp: {
    background: '#f3f4f6', padding: 14, borderRadius: 8,
    fontFamily: 'monospace', fontSize: 15, textAlign: 'center', letterSpacing: 1,
  },
  bulkBar: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 10, padding: '10px 14px',
  },
  bulkText: { fontSize: 13, fontWeight: 600, color: '#1e40af', flex: 1, minWidth: 120 },
})

export default function Clients() {
  const s = useStyles()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 300)
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [busy, setBusy] = useState<number | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [resetDlg, setResetDlg] = useState<{ open: boolean; client?: any; temp?: string }>({ open: false })

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const r = await api.get('/api/admin/clients')
      setList(r.data)
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message
      setErr(msg)
      toast.error('Failed to load clients', msg)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => list.filter(c => {
    if (filter === 'active' && !c.is_active) return false
    if (filter === 'disabled' && c.is_active) return false
    if (!dq.trim()) return true
    const t = dq.toLowerCase()
    return (c.company_name || '').toLowerCase().includes(t)
      || (c.owner_name || '').toLowerCase().includes(t)
      || (c.email || '').toLowerCase().includes(t)
      || (c.city || '').toLowerCase().includes(t)
  }), [list, dq, filter])

  const resetPassword = async (client: any) => {
    const ok = await confirm({
      title: 'Reset password?',
      message: `Temporary password तयार होईल आणि ${client.email} ला email जाईल. Client चा जुना password काम करणार नाही.`,
      confirmText: 'Reset password',
      danger: true,
    })
    if (!ok) return
    setBusy(client.id)
    try {
      const r = await api.post(`/api/admin/clients/${client.id}/reset-password`)
      setResetDlg({ open: true, client, temp: r.data.temp_password })
      toast.success('Password reset', 'Temporary password तयार झाला')
    } catch (e: any) {
      toast.error('Reset failed', e.response?.data?.error || e.message)
    } finally { setBusy(null) }
  }

  const toggleActive = async (client: any) => {
    const disabling = client.is_active
    const ok = await confirm({
      title: disabling ? 'Disable this client?' : 'Enable this client?',
      message: disabling
        ? `${client.company_name || client.email} चा access तात्काळ बंद होईल. ते login करू शकणार नाहीत.`
        : `${client.company_name || client.email} पुन्हा platform वापरू शकतील.`,
      confirmText: disabling ? 'Disable' : 'Enable',
      danger: disabling,
    })
    if (!ok) return
    setBusy(client.id)
    try {
      await api.put(`/api/admin/clients/${client.id}`, { is_active: !client.is_active })
      toast.success(disabling ? 'Client disabled' : 'Client enabled')
      load()
    } catch (e: any) {
      toast.error('Update failed', e.response?.data?.error || e.message)
    } finally { setBusy(null) }
  }

  const bulkSetActive = async (active: boolean) => {
    if (selected.length === 0) return
    const ok = await confirm({
      title: active ? `Enable ${selected.length} client(s)?` : `Disable ${selected.length} client(s)?`,
      message: active
        ? 'निवडलेले clients पुन्हा platform वापरू शकतील.'
        : 'निवडलेल्या clients चा access तात्काळ बंद होईल.',
      confirmText: active ? 'Enable all' : 'Disable all',
      danger: !active,
    })
    if (!ok) return
    setBulkBusy(true)
    try {
      await Promise.all(
        selected.map((id) =>
          api.put(`/api/admin/clients/${id}`, { is_active: active })
        )
      )
      toast.success(
        active ? 'Clients enabled' : 'Clients disabled',
        `${selected.length} updated`
      )
      setSelected([])
      load()
    } catch (e: any) {
      toast.error('Bulk update failed', e.response?.data?.error || e.message)
    } finally { setBulkBusy(false) }
  }

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      getValue: (c) => (c.company_name || c.owner_name || '').toLowerCase(),
      render: (c) => (
        <div className={s.companyCell}>
          <Avatar size={32} name={c.company_name || c.owner_name || '—'} color="brand" />
          <div>
            <span className={s.name}>{c.company_name || c.owner_name || '—'}</span>
            <span className={s.mail}>{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
      getValue: (c) => (c.city || '').toLowerCase(),
      render: (c) => c.city || '—',
    },
    {
      key: 'license',
      label: 'License',
      sortable: true,
      getValue: (c) => (c.license_type || 'basic').toLowerCase(),
      render: (c) => (
        <span className={s.pill + ' ' + s.pillNeutral}>{c.license_type || 'basic'}</span>
      ),
    },
    {
      key: 'approved',
      label: 'Approved',
      sortable: true,
      getValue: (c) => (c.approved_at ? new Date(c.approved_at) : null),
      render: (c) =>
        c.approved_at ? (
          <span title={new Date(c.approved_at).toLocaleString()}>
            {relativeTime(c.approved_at)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getValue: (c) => (c.is_active ? 1 : 0),
      render: (c) =>
        c.is_active ? (
          <span className={s.pill + ' ' + s.pillSuccess}>Active</span>
        ) : (
          <span className={s.pill + ' ' + s.pillDanger}>Disabled</span>
        ),
    },
  ], [s])

  const rowActions = (c: any) => (
    <div className={s.actions}>
      <Button
        size="small" appearance="subtle" icon={<EyeRegular />} title="View"
        onClick={() => nav(`/clients/${c.id}`)}
      />
      <Button
        size="small" appearance="subtle" icon={<KeyRegular />} title="Reset password"
        disabled={busy === c.id} onClick={() => resetPassword(c)}
      />
      <Button
        size="small" appearance="subtle"
        icon={c.is_active ? <ProhibitedRegular /> : <CheckmarkCircleRegular />}
        title={c.is_active ? 'Disable' : 'Enable'}
        disabled={busy === c.id} onClick={() => toggleActive(c)}
      />
    </div>
  )

  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Clients' }]} />

      <div className={s.head}>
        <div>
          <Text className={s.h1}>Clients</Text>
          <Text className={s.sub}>
            {list.length} total · {list.filter(c => c.is_active).length} active
          </Text>
        </div>
        <Button
          appearance="secondary" icon={<ArrowSyncRegular />}
          onClick={load} disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className={s.toolbar}>
        <Input
          className={s.search}
          contentBefore={<SearchRegular />}
          placeholder="Search company, owner, email, city…"
          value={q}
          onChange={(_, d) => setQ(d.value)}
          appearance="filled-darker"
        />
        <Dropdown
          value={filter === 'all' ? 'All' : filter === 'active' ? 'Active only' : 'Disabled only'}
          selectedOptions={[filter]}
          onOptionSelect={(_, d) => setFilter(d.optionValue as any)}
        >
          <Option value="all">All</Option>
          <Option value="active">Active only</Option>
          <Option value="disabled">Disabled only</Option>
        </Dropdown>
      </div>

      {err && (
        <MessageBar intent="error">
          <MessageBarBody>{err}</MessageBarBody>
        </MessageBar>
      )}

      {selected.length > 0 && (
        <div className={s.bulkBar}>
          <Text className={s.bulkText}>
            {selected.length} selected
          </Text>
          <Button
            size="small" appearance="secondary"
            icon={<CheckmarkCircleRegular />}
            disabled={bulkBusy}
            onClick={() => bulkSetActive(true)}
          >
            Enable
          </Button>
          <Button
            size="small" appearance="secondary"
            icon={<ProhibitedRegular />}
            disabled={bulkBusy}
            onClick={() => bulkSetActive(false)}
          >
            Disable
          </Button>
          <Button
            size="small" appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </div>
      )}

      {loading ? (
        <div className={s.card}>
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.card}>
          <EmptyState
            icon={<PeopleRegular />}
            title={q ? 'No clients found' : 'No clients yet'}
            description={q ? 'Try a different search or filter.' : 'Approved signup requests will appear here.'}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(c) => String(c.id)}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          pageSize={10}
          rowActions={rowActions}
          emptyMessage="No clients"
        />
      )}

      <Dialog open={resetDlg.open} onOpenChange={(_, d) => !d.open && setResetDlg({ open: false })}>
        <DialogSurface className={s.dialog}>
          <DialogBody>
            <DialogTitle>Password reset</DialogTitle>
            <DialogContent>
              <Text style={{ display: 'block', marginBottom: 12 }}>
                Temporary password तयार केला — {resetDlg.client?.email} ला email पाठवला.
              </Text>
              <div className={s.otp}>{resetDlg.temp}</div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setResetDlg({ open: false })}>
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
