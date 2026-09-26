
import { useEffect, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Spinner, MessageBar, MessageBarBody,
  Avatar,
} from '@fluentui/react-components'
import {
  PeopleRegular, PeopleTeamRegular, ClockRegular, ArrowTrendingRegular,
  ArrowRightRegular, BuildingRegular, WarningRegular, CheckmarkCircleRegular,
  VehicleBusRegular, LocationRegular,
} from '@fluentui/react-icons'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import { KpiSkeleton, CardSkeleton } from '../components/Skeletons'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '12px',
  },
  h1: { fontSize: '22px', fontWeight: 700, color: '#111827', display: 'block' },
  h1sub: { fontSize: '13px', color: '#6b7280', marginTop: '2px', display: 'block' },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '16px',
    '@media (max-width: 1080px)': { gridTemplateColumns: '1fr' },
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '16px',
    '@media (max-width: 1080px)': { gridTemplateColumns: '1fr' },
  },
  card: {
    background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '12px', padding: '20px',
  },
  cardHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
  cardSub: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    textAlign: 'left', padding: '10px 8px', fontSize: '11px', fontWeight: 700,
    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: {
    padding: '12px 8px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle', color: '#374151',
  },
  rowHover: { ':hover': { backgroundColor: '#f9fafb', cursor: 'pointer' } },
  companyCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  companyName: { fontWeight: 600, color: '#111827', display: 'block' },
  companyMail: { fontSize: '12px', color: '#9ca3af', display: 'block' },
  pill: {
    display: 'inline-block', fontSize: '11px', fontWeight: 600,
    padding: '3px 10px', borderRadius: '10px',
  },
  pillSuccess: { background: '#dcfce7', color: '#15803d' },
  pillWarn: { background: '#fef3c7', color: '#b45309' },
  pillDanger: { background: '#fee2e2', color: '#b91c1c' },
  pillNeutral: { background: '#f3f4f6', color: '#4b5563' },
  empty: {
    padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px',
  },
  quickRow: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' },
})

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#ef4444', '#0ea5e9']

export default function Dashboard() {
  const s = useStyles()
  const nav = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <CardSkeleton height={260} />
        <CardSkeleton height={260} />
      </div>
    </div>
  )
  if (err) return <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>

  const t = data?.totals || {}
  const signups = (data?.signupsOverTime || []).map((r: any) => ({ label: r.label, count: r.n }))
  const license = (data?.licenseBreakdown || []).map((r: any) => ({ name: r.license_type, value: r.n }))
  const recent = data?.recentClients || []

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <Text className={s.h1}>Overview</Text>
          <Text className={s.h1sub}>Platform health & recent activity</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button appearance="secondary" icon={<PeopleRegular />} onClick={() => nav('/clients')}>View Clients</Button>
          <Button appearance="primary" icon={<WarningRegular />} onClick={() => nav('/signup-requests')}>
            Pending Requests{t.pending ? ` (${t.pending})` : ''}
          </Button>
        </div>
      </div>

      <div className={s.kpiGrid}>
        <KpiCard tone="primary" icon={<PeopleRegular />} label="Total Clients" value={t.clients ?? 0} sub="all tenants" />
        <KpiCard tone="success" icon={<CheckmarkCircleRegular />} label="Active" value={t.active ?? 0} sub="approved & enabled" delta={t.clients ? Math.round((t.active / t.clients) * 100) : 0} />
        <KpiCard tone="warning" icon={<ClockRegular />} label="Pending Requests" value={t.pending ?? 0} sub="awaiting review" />
        <KpiCard tone="primary" icon={<ArrowTrendingRegular />} label="New (30 days)" value={t.newLast30 ?? 0} sub="signups" />
      </div>

      <div className={s.row}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <div>
              <div className={s.cardTitle}>Signups over time</div>
              <div className={s.cardSub}>Last 12 weeks</div>
            </div>
          </div>
          {signups.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={signups} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#signupGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className={s.empty}>No signup data yet</div>}
        </div>

        <div className={s.card}>
          <div className={s.cardHead}>
            <div>
              <div className={s.cardTitle}>License mix</div>
              <div className={s.cardSub}>By plan type</div>
            </div>
          </div>
          {license.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={license} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {license.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className={s.empty}>No licenses yet</div>}
        </div>
      </div>

      <div className={s.row2}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <div>
              <div className={s.cardTitle}>Recent clients</div>
              <div className={s.cardSub}>Latest signups</div>
            </div>
            <Button appearance="transparent" size="small" icon={<ArrowRightRegular />} iconPosition="after" onClick={() => nav('/clients')}>
              View all
            </Button>
          </div>
          {recent.length ? (
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th}>Company</th>
                  <th className={s.th}>City</th>
                  <th className={s.th}>License</th>
                  <th className={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c: any) => (
                  <tr key={c.id} className={s.rowHover} onClick={() => nav(`/clients/${c.id}`)}>
                    <td className={s.td}>
                      <div className={s.companyCell}>
                        <Avatar size={28} name={c.company_name || c.owner_name || '—'} color="brand" />
                        <div>
                          <span className={s.companyName}>{c.company_name || c.owner_name || '—'}</span>
                          <span className={s.companyMail}>{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={s.td}>{c.city || '—'}</td>
                    <td className={s.td}>
                      <span className={`${s.pill} ${s.pillNeutral}`}>{c.license_type || 'basic'}</span>
                    </td>
                    <td className={s.td}>
                      {c.is_active
                        ? <span className={`${s.pill} ${s.pillSuccess}`}>Active</span>
                        : <span className={`${s.pill} ${s.pillDanger}`}>Disabled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className={s.empty}>No clients yet</div>}
        </div>

        <div className={s.card}>
          <div className={s.cardHead}>
            <div>
              <div className={s.cardTitle}>Quick actions</div>
              <div className={s.cardSub}>Common admin tasks</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button appearance="secondary" icon={<WarningRegular />} onClick={() => nav('/signup-requests')} style={{ justifyContent: 'flex-start' }}>Review signup requests</Button>
            <Button appearance="secondary" icon={<PeopleRegular />} onClick={() => nav('/clients')} style={{ justifyContent: 'flex-start' }}>Manage clients</Button>
            <Button appearance="secondary" icon={<BuildingRegular />} onClick={() => nav('/subscriptions')} style={{ justifyContent: 'flex-start' }}>Subscriptions & billing</Button>
            <Button appearance="secondary" icon={<VehicleBusRegular />} onClick={() => nav('/deployment')} style={{ justifyContent: 'flex-start' }}>All Buses</Button>
            <Button appearance="secondary" icon={<LocationRegular />} onClick={() => nav('/tracking')} style={{ justifyContent: 'flex-start' }}>Live tracking</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
