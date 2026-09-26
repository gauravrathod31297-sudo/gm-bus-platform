
import { useEffect, useMemo, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Spinner, MessageBar, MessageBarBody,
  Avatar, Tab, TabList, Dialog, DialogSurface, DialogBody, DialogTitle,
  DialogContent, DialogActions, Field, Textarea,
} from '@fluentui/react-components'
import {
  CheckmarkCircleRegular, DismissCircleRegular, MailRegular, PhoneRegular,
  LocationRegular, BuildingRegular, PersonRegular, ArrowSyncRegular,
} from '@fluentui/react-icons'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import EmptyState from '../components/EmptyState'
import Breadcrumbs from '../components/Breadcrumbs'
import { relativeTime } from '../utils/time'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  head: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 },
  card: {
    background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
  },
  row: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: 600, color: '#111827', display: 'block' },
  meta: { fontSize: 12.5, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 },
  metaList: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 },
  actions: { display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 },
  pill: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10 },
  pillWarn: { background: '#fef3c7', color: '#b45309' },
  pillSuccess: { background: '#dcfce7', color: '#15803d' },
  pillDanger: { background: '#fee2e2', color: '#b91c1c' },
  empty: { padding: 60, textAlign: 'center', color: '#6b7280', background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12 },
  dialog: { maxWidth: 520 },
})

type Status = 'pending' | 'approved' | 'rejected'

export default function SignupRequests() {
  const s = useStyles()
  const toast = useToast()
  const confirm = useConfirm()
  const [status, setStatus] = useState<Status>('pending')
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [reject, setReject] = useState<{ open: boolean; id?: number; reason: string }>({ open: false, reason: '' })
  const [approveResult, setApproveResult] = useState<{ open: boolean; temp?: string; email?: string }>({ open: false })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)

  const load = () => {
    setLoading(true); setErr('')
    api.get(`/api/admin/signup-requests?status=${status}`)
      .then(r => setList(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { setPage(1); load() }, [status])

  const approve = async (id: number) => {
    setBusy(id)
    try {
      const r = await api.post(`/api/admin/signup-requests/${id}/approve`)
      setApproveResult({ open: true, temp: r.data.temp_password, email: r.data.client?.email })
      toast.success('Client approved', 'Tenant DB तयार झाली + welcome email पाठवला')
      load()
    } catch (e: any) { toast.error('Approve failed', e.response?.data?.error || e.message) }
    finally { setBusy(null) }
  }

  const doReject = async () => {
    if (!reject.id) return
    setBusy(reject.id)
    try {
      await api.post(`/api/admin/signup-requests/${reject.id}/reject`, { reason: reject.reason })
      setReject({ open: false, reason: '' })
      toast.success('Request rejected')
      load()
    } catch (e: any) { toast.error('Reject failed', e.response?.data?.error || e.message) }
    finally { setBusy(null) }
  }

  const count = list.length
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [list, currentPage, pageSize])

  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Signup Requests' }]} />

      <div className={s.head}>
        <div>
          <Text className={s.h1}>Signup Requests</Text>
          <Text className={s.sub}>Review, approve या reject करा — {count} {status}</Text>
        </div>
        <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
      </div>

      <TabList selectedValue={status} onTabSelect={(_, d) => setStatus(d.value as Status)}>
        <Tab value="pending">Pending</Tab>
        <Tab value="approved">Approved</Tab>
        <Tab value="rejected">Rejected</Tab>
      </TabList>

      {err && <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}><Spinner label="Loading…" /></div>
      ) : list.length === 0 ? (
        <EmptyState
          title={status === 'pending' ? 'No pending requests' : `No ${status} requests`}
          description={status === 'pending' ? 'नवीन signups आल्यावर येथे दिसतील.' : 'जुनी requests इथे archive होतात.'}
        />
      ) : (
        <div className={s.list}>
          {pageItems.map(r => (
            <div key={r.id} className={s.card}>
              <div className={s.row}>
                <Avatar size={44} name={r.company_name || r.name || '—'} color="brand" />
                <div style={{ flex: 1 }}>
                  <Text className={s.name}>{r.company_name || r.name || '—'}</Text>
                  <span className={s.meta}><PersonRegular /> {r.name || r.owner_name || '—'} · {relativeTime(r.created_at)}</span>
                </div>
                {status === 'pending' && <span className={`${s.pill} ${s.pillWarn}`}>Pending</span>}
                {status === 'approved' && <span className={`${s.pill} ${s.pillSuccess}`}>Approved</span>}
                {status === 'rejected' && <span className={`${s.pill} ${s.pillDanger}`}>Rejected</span>}
              </div>

              <div className={s.metaList}>
                <span className={s.meta}><MailRegular /> {r.email}</span>
                {r.phone && <span className={s.meta}><PhoneRegular /> {r.phone}</span>}
                {(r.city || r.address) && <span className={s.meta}><LocationRegular /> {[r.address, r.city, r.pincode].filter(Boolean).join(', ')}</span>}
                {r.gstin && <span className={s.meta}><BuildingRegular /> GSTIN {r.gstin}</span>}
              </div>

              {r.message && (
                <div style={{ background: '#f9fafb', padding: 10, borderRadius: 8, fontSize: 12.5, color: '#4b5563' }}>
                  {r.message}
                </div>
              )}

              {status === 'pending' && (
                <div className={s.actions}>
                  <Button appearance="primary" icon={<CheckmarkCircleRegular />} disabled={busy === r.id} onClick={() => approve(r.id)}>Approve</Button>
                  <Button appearance="secondary" icon={<DismissCircleRegular />} disabled={busy === r.id} onClick={() => setReject({ open: true, id: r.id, reason: '' })}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && list.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, color: '#6b7280', marginRight: 'auto' }}>
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, list.length)} of {list.length}
          </span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            style={{
              padding: '4px 8px', borderRadius: 4,
              border: '1px solid #d1d5db', fontSize: 13,
            }}
          >
            <option value={6}>6 / page</option>
            <option value={9}>9 / page</option>
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
          </select>
          <Button
            size="small" appearance="subtle"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </Button>
          <span style={{ fontSize: 13, color: '#111827' }}>
            Page {currentPage} / {totalPages}
          </span>
          <Button
            size="small" appearance="subtle"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </Button>
        </div>
      )}

      <Dialog open={reject.open} onOpenChange={(_, d) => !d.open && setReject({ open: false, reason: '' })}>
        <DialogSurface className={s.dialog}>
          <DialogBody>
            <DialogTitle>Reject signup request</DialogTitle>
            <DialogContent>
              <Text style={{ display: 'block', marginBottom: 12 }}>Optional: कारण द्या — applicant ला email जाईल.</Text>
              <Field label="Reason">
                <Textarea value={reject.reason} onChange={(_, d) => setReject({ ...reject, reason: d.value })} rows={3} placeholder="Incomplete details, duplicate…" />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setReject({ open: false, reason: '' })}>Cancel</Button>
              <Button appearance="primary" disabled={busy === reject.id} onClick={doReject}>Reject</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={approveResult.open} onOpenChange={(_, d) => !d.open && setApproveResult({ open: false })}>
        <DialogSurface className={s.dialog}>
          <DialogBody>
            <DialogTitle>✅ Client approved</DialogTitle>
            <DialogContent>
              <Text style={{ display: 'block', marginBottom: 8 }}>Tenant DB तयार झाली. Welcome email पाठवला → {approveResult.email}</Text>
              <div style={{ background: '#f3f4f6', padding: 14, borderRadius: 8, fontFamily: 'monospace', fontSize: 15, textAlign: 'center', letterSpacing: 1 }}>
                {approveResult.temp}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setApproveResult({ open: false })}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
