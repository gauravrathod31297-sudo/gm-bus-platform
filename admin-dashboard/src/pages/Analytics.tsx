
import { useEffect, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Spinner, MessageBar, MessageBarBody,
} from '@fluentui/react-components'
import { ArrowSyncRegular } from '@fluentui/react-icons'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../services/api'
import KpiCard from '../components/KpiCard'
import { KpiSkeleton, CardSkeleton } from '../components/Skeletons'
import {
  PeopleRegular, CheckmarkCircleRegular, ClockRegular, ArrowTrendingRegular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, '@media (max-width: 1080px)': { gridTemplateColumns: '1fr' } },
  card: { background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, padding: 20 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4, display: 'block' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginBottom: 16, display: 'block' },
  empty: { padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 },
})

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#ef4444', '#0ea5e9']

export default function Analytics() {
  const s = useStyles()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true); setErr('')
    api.get('/api/admin/stats')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <CardSkeleton height={280} />
        <CardSkeleton height={280} />
      </div>
    </div>
  )
  if (err) return <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>

  const t = data?.totals || {}
  const signups = (data?.signupsOverTime || []).map((r: any) => ({ label: r.label, count: r.n }))
  const license = (data?.licenseBreakdown || []).map((r: any) => ({ name: r.license_type, value: r.n }))

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <div>
          <Text className={s.h1}>Analytics</Text>
          <Text className={s.sub}>Platform metrics & trends</Text>
        </div>
        <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
      </div>

      <div className={s.kpiGrid}>
        <KpiCard tone="primary" icon={<PeopleRegular />} label="Total Clients" value={t.clients ?? 0} />
        <KpiCard tone="success" icon={<CheckmarkCircleRegular />} label="Active" value={t.active ?? 0} />
        <KpiCard tone="warning" icon={<ClockRegular />} label="Pending" value={t.pending ?? 0} />
        <KpiCard tone="primary" icon={<ArrowTrendingRegular />} label="New (30d)" value={t.newLast30 ?? 0} />
      </div>

      <div className={s.row}>
        <div className={s.card}>
          <Text className={s.cardTitle}>Signups trend</Text>
          <Text className={s.cardSub}>Last 12 weeks</Text>
          {signups.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={signups} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#agrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className={s.empty}>No data</div>}
        </div>

        <div className={s.card}>
          <Text className={s.cardTitle}>Signups by week</Text>
          <Text className={s.cardSub}>Bar view</Text>
          {signups.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signups} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className={s.empty}>No data</div>}
        </div>
      </div>

      <div className={s.card}>
        <Text className={s.cardTitle}>License distribution</Text>
        <Text className={s.cardSub}>Clients per plan type</Text>
        {license.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={license} dataKey="value" nameKey="name" outerRadius={100} label>
                {license.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className={s.empty}>No licenses</div>}
      </div>
    </div>
  )
}
