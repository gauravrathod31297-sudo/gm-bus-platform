
import { useEffect, useMemo, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Input, MessageBar, MessageBarBody,
  Avatar, Dropdown, Option,
} from '@fluentui/react-components'
import {
  SearchRegular, ArrowSyncRegular, CalendarClockRegular,
} from '@fluentui/react-icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import EmptyState from '../components/EmptyState'
import Breadcrumbs from '../components/Breadcrumbs'
import { DataTable, type Column } from '../components/DataTable'
import { daysBetween, absoluteDate } from '../utils/time'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  toolbar: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, padding: '12px 14px' },
  search: { flex: 1, minWidth: 220 },
  card: { background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, overflow: 'hidden' },
  companyCell: { display: 'flex', alignItems: 'center', gap: 10 },
  name: { fontWeight: 600, color: '#111827', display: 'block' },
  mail: { fontSize: 12, color: '#9ca3af', display: 'block' },
  pill: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10 },
  pillSuccess: { background: '#dcfce7', color: '#15803d' },
  pillWarn: { background: '#fef3c7', color: '#b45309' },
  pillDanger: { background: '#fee2e2', color: '#b91c1c' },
  pillNeutral: { background: '#f3f4f6', color: '#4b5563' },
  daysStrong: { fontWeight: 600 },
})

export default function Subscriptions() {
  const s = useStyles()
  const nav = useNavigate()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 300)
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired' | 'valid'>('all')

  const load = () => {
    setLoading(true); setErr('')
    api.get('/api/admin/clients')
      .then(r => setList(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const daysLeft = (d: string | null) => d ? daysBetween(d) : null

  const filtered = useMemo(() => {
    return list.filter(c => {
      const dl = daysLeft(c.license_expires_at)
      if (filter === 'expired' && (dl === null || dl >= 0)) return false
      if (filter === 'expiring' && (dl === null || dl < 0 || dl > 30)) return false
      if (filter === 'valid' && (dl === null || dl < 0)) return false
      if (!dq.trim()) return true
      const t = dq.toLowerCase()
      return (c.company_name || '').toLowerCase().includes(t) || (c.email || '').toLowerCase().includes(t)
    })
  }, [list, dq, filter])

  const counts = useMemo(() => ({
    total: list.length,
    expiring: list.filter(c => { const dl = daysLeft(c.license_expires_at); return dl !== null && dl >= 0 && dl <= 30 }).length,
    expired: list.filter(c => { const dl = daysLeft(c.license_expires_at); return dl !== null && dl < 0 }).length,
  }), [list])

  const statusInfo = (dl: number | null) => {
    if (dl === null) return { cls: s.pillNeutral, text: '—', sort: -99999 }
    if (dl < 0) return { cls: s.pillDanger, text: 'Expired', sort: 0 }
    if (dl <= 30) return { cls: s.pillWarn, text: 'Expiring soon', sort: 1 }
    return { cls: s.pillSuccess, text: 'Active', sort: 2 }
  }

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'client',
      label: 'Client',
      sortable: true,
      getValue: (c) => (c.company_name || c.email || '').toLowerCase(),
      render: (c) => (
        <div className={s.companyCell}>
          <Avatar size={28} name={c.company_name || c.email || '—'} color="brand" />
          <div>
            <span className={s.name}>{c.company_name || '—'}</span>
            <span className={s.mail}>{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: true,
      getValue: (c) => (c.license_type || 'basic').toLowerCase(),
      render: (c) => (
        <span className={`${s.pill} ${s.pillNeutral}`}>{c.license_type || 'basic'}</span>
      ),
    },
    {
      key: 'expires',
      label: 'Expires',
      sortable: true,
      getValue: (c) => (c.license_expires_at ? new Date(c.license_expires_at) : null),
      render: (c) => (c.license_expires_at ? absoluteDate(c.license_expires_at) : '—'),
    },
    {
      key: 'daysLeft',
      label: 'Days left',
      sortable: true,
      getValue: (c) => daysLeft(c.license_expires_at),
      render: (c) => {
        const dl = daysLeft(c.license_expires_at)
        return <span className={s.daysStrong}>{dl ?? '—'}</span>
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getValue: (c) => statusInfo(daysLeft(c.license_expires_at)).sort,
      render: (c) => {
        const info = statusInfo(daysLeft(c.license_expires_at))
        return <span className={`${s.pill} ${info.cls}`}>{info.text}</span>
      },
    },
  ], [s])

  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Subscriptions' }]} />

      <div className={s.head}>
        <div>
          <Text className={s.h1}>Subscriptions</Text>
          <Text className={s.sub}>
            {counts.total} clients · {counts.expiring} expiring soon · {counts.expired} expired
          </Text>
        </div>
        <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={load}>
          Refresh
        </Button>
      </div>

      <div className={s.toolbar}>
        <Input
          className={s.search}
          contentBefore={<SearchRegular />}
          placeholder="Search company or email…"
          value={q}
          onChange={(_, d) => setQ(d.value)}
          appearance="filled-darker"
        />
        <Dropdown
          value={filter === 'all' ? 'All' : filter === 'expiring' ? 'Expiring (≤30d)' : filter === 'expired' ? 'Expired' : 'Valid'}
          selectedOptions={[filter]}
          onOptionSelect={(_, d) => setFilter(d.optionValue as any)}
        >
          <Option value="all">All</Option>
          <Option value="valid">Valid</Option>
          <Option value="expiring">Expiring (≤30d)</Option>
          <Option value="expired">Expired</Option>
        </Dropdown>
      </div>

      {err && (
        <MessageBar intent="error">
          <MessageBarBody>{err}</MessageBarBody>
        </MessageBar>
      )}

      {loading ? (
        <div className={s.card} style={{ padding: 60, textAlign: 'center' }}>
          <Text>Loading…</Text>
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.card}>
          <EmptyState
            icon={<CalendarClockRegular />}
            title="No subscriptions match"
            description="Filters बदला किंवा नवीन clients approve करा."
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(c) => String(c.id)}
          onRowClick={(c) => nav(`/clients/${c.id}`)}
          pageSize={25}
          emptyMessage="No subscriptions"
        />
      )}
    </div>
  )
}
