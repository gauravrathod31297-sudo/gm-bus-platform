
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  makeStyles, tokens, Text, Button, Spinner, MessageBar, MessageBarBody,
  Avatar, Tab, TabList, Field, Input, Switch, Divider,
} from '@fluentui/react-components'
import {
  ArrowLeftRegular, KeyRegular, MailRegular,
  BuildingRegular, LocationRegular, PhoneRegular, CalendarRegular,
  VehicleBusRegular, PersonRegular, PeopleTeamRegular, SendRegular,
} from '@fluentui/react-icons'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import Breadcrumbs from '../components/Breadcrumbs'
import { FormField, FormSection, SaveBar } from '../components/Form'
import { useForm, type FormErrors } from '../hooks/useForm'
import { relativeTime } from '../utils/time'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 96 },
  back: { justifyContent: 'flex-start', paddingLeft: 0, marginBottom: 4 },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: 12, padding: 20, flexWrap: 'wrap', gap: 16,
  },
  headLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  name: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  mail: { fontSize: 13, color: '#6b7280', display: 'block' },
  metaRow: { display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' },
  meta: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#6b7280' },
  pill: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10 },
  pillSuccess: { background: '#dcfce7', color: '#15803d' },
  pillDanger: { background: '#fee2e2', color: '#b91c1c' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  switchRow: { display: 'flex', alignItems: 'center', gap: 10, height: 32 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#111827', display: 'block' },
  sectionSub: { fontSize: 12.5, color: '#9ca3af', display: 'block', marginBottom: 4 },
})

type ClientForm = {
  company_name: string
  owner_name: string
  email: string
  phone: string
  city: string
  is_active: boolean
  license_type: string
  license_expires_at: string
  max_buses: number | null
  max_drivers: number | null
  max_users: number | null
  tenant_db_name: string
}

type SmtpForm = {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
}

const emptyClient: ClientForm = {
  company_name: '', owner_name: '', email: '', phone: '', city: '',
  is_active: true, license_type: 'basic', license_expires_at: '',
  max_buses: null, max_drivers: null, max_users: null, tenant_db_name: '',
}

const emptySmtp: SmtpForm = {
  smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '',
  smtp_from_email: '', smtp_from_name: '', smtp_secure: false,
}

const toClientForm = (c: any): ClientForm => ({
  company_name: c.company_name || '',
  owner_name: c.owner_name || c.name || '',
  email: c.email || '',
  phone: c.phone || '',
  city: c.city || '',
  is_active: !!c.is_active,
  license_type: c.license_type || 'basic',
  license_expires_at: c.license_expires_at ? String(c.license_expires_at).slice(0, 10) : '',
  max_buses: c.max_buses ?? null,
  max_drivers: c.max_drivers ?? null,
  max_users: c.max_users ?? null,
  tenant_db_name: c.tenant_db_name || '',
})

const toSmtpForm = (s: any): SmtpForm => ({
  smtp_host: s.smtp_host || '',
  smtp_port: Number(s.smtp_port) || 587,
  smtp_user: s.smtp_user || '',
  smtp_pass: s.smtp_pass || '',
  smtp_from_email: s.smtp_from_email || '',
  smtp_from_name: s.smtp_from_name || '',
  smtp_secure: !!s.smtp_secure,
})

const validateClient = (v: ClientForm): FormErrors<ClientForm> => {
  const e: FormErrors<ClientForm> = {}
  if (!v.company_name.trim()) e.company_name = 'Company name आवश्यक आहे'
  if (v.phone && !/^[+\d][\d\s\-()]{5,}$/.test(v.phone)) e.phone = 'Phone number invalid'
  const nonNegInt = (n: number | null): string | undefined => {
    if (n == null) return undefined
    if (!Number.isFinite(n) || n < 0) return '0 किंवा जास्त हवं'
    if (!Number.isInteger(n)) return 'पूर्णांक हवा'
    return undefined
  }
  const eb = nonNegInt(v.max_buses); if (eb) e.max_buses = eb
  const ed = nonNegInt(v.max_drivers); if (ed) e.max_drivers = ed
  const eu = nonNegInt(v.max_users); if (eu) e.max_users = eu
  return e
}

const validateSmtp = (v: SmtpForm): FormErrors<SmtpForm> => {
  const e: FormErrors<SmtpForm> = {}
  if (v.smtp_port && (v.smtp_port < 1 || v.smtp_port > 65535)) e.smtp_port = '1-65535 मध्ये हवा'
  if (v.smtp_from_email && !/^\S+@\S+\.\S+$/.test(v.smtp_from_email)) e.smtp_from_email = 'Valid email द्या'
  if (v.smtp_host && !v.smtp_user) e.smtp_user = 'Host दिलाय तर username आवश्यक'
  return e
}

export default function ClientDetail() {
  const s = useStyles()
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'overview' | 'license' | 'smtp'>('overview')
  const [savingClient, setSavingClient] = useState(false)
  const [savingSmtp, setSavingSmtp] = useState(false)
  const [testBusy, setTestBusy] = useState(false)

  const clientForm = useForm<ClientForm>({
    initialValues: emptyClient,
    validate: validateClient,
  })
  const smtpForm = useForm<SmtpForm>({
    initialValues: emptySmtp,
    validate: validateSmtp,
  })

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const r = await api.get('/api/admin/clients')
      const c = (r.data || []).find((x: any) => String(x.id) === String(id))
      if (!c) { setErr('Client सापडला नाही'); return }
      clientForm.reset(toClientForm(c))
      try {
        const sr = await api.get(`/api/admin/clients/${id}/smtp`)
        smtpForm.reset(toSmtpForm(sr.data || {}))
      } catch { /* SMTP optional */ }
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const saveClient = async () => {
    clientForm.markAllTouched()
    if (!clientForm.validate()) {
      toast.error('कृपया errors दुरुस्त करा')
      return
    }
    setSavingClient(true)
    try {
      const v = clientForm.values
      await api.put(`/api/admin/clients/${id}`, {
        company_name: v.company_name,
        owner_name: v.owner_name,
        phone: v.phone,
        city: v.city,
        is_active: v.is_active,
        license_type: v.license_type,
        license_expires_at: v.license_expires_at || null,
        max_buses: v.max_buses,
        max_drivers: v.max_drivers,
        max_users: v.max_users,
      })
      toast.success('Client updated')
      clientForm.reset(v)
    } catch (e: any) {
      toast.error('Save failed', e.response?.data?.error || e.message)
    } finally { setSavingClient(false) }
  }

  const saveSmtp = async () => {
    smtpForm.markAllTouched()
    if (!smtpForm.validate()) {
      toast.error('कृपया errors दुरुस्त करा')
      return
    }
    setSavingSmtp(true)
    try {
      await api.put(`/api/admin/clients/${id}/smtp`, smtpForm.values)
      toast.success('SMTP settings saved')
      smtpForm.reset(smtpForm.values)
    } catch (e: any) {
      toast.error('Save failed', e.response?.data?.error || e.message)
    } finally { setSavingSmtp(false) }
  }

  const testSmtp = async () => {
    setTestBusy(true)
    try {
      const r = await api.post(`/api/admin/clients/${id}/smtp/test`, {})
      toast.success('Test email sent', r.data.message)
    } catch (e: any) {
      toast.error('Test failed', e.response?.data?.error || e.message)
    } finally { setTestBusy(false) }
  }

  const resetPw = async () => {
    const ok = await confirm({
      title: 'Reset password?',
      message: 'Temporary password तयार होईल आणि client ला email जाईल.',
      confirmText: 'Reset password',
      danger: true,
    })
    if (!ok) return
    try {
      const r = await api.post(`/api/admin/clients/${id}/reset-password`)
      toast.success('Password reset', 'Temporary: ' + r.data.temp_password)
    } catch (e: any) {
      toast.error('Reset failed', e.response?.data?.error || e.message)
    }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner label="Loading…" /></div>
  if (err) return <MessageBar intent="error"><MessageBarBody>{err}</MessageBarBody></MessageBar>

  const v = clientForm.values
  const sv = smtpForm.values

  return (
    <div className={s.wrap}>
      <Breadcrumbs items={[{ label: 'Clients', to: '/clients' }, { label: v.company_name || 'Client' }]} />

      <Button className={s.back} appearance="transparent" size="small" icon={<ArrowLeftRegular />} onClick={() => nav('/clients')}>
        Back to Clients
      </Button>

      <div className={s.header}>
        <div className={s.headLeft}>
          <Avatar size={56} name={v.company_name || '—'} color="brand" />
          <div>
            <Text className={s.name}>{v.company_name || '—'}</Text>
            <Text className={s.mail}>{v.email}</Text>
            <div className={s.metaRow}>
              {v.city && <span className={s.meta}><LocationRegular /> {v.city}</span>}
              {v.phone && <span className={s.meta}><PhoneRegular /> {v.phone}</span>}
              {v.license_expires_at && (
                <span className={s.meta}>
                  <CalendarRegular /> Expires {relativeTime(v.license_expires_at)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {v.is_active
            ? <span className={`${s.pill} ${s.pillSuccess}`}>Active</span>
            : <span className={`${s.pill} ${s.pillDanger}`}>Disabled</span>}
          <div className={s.actions}>
            <Button size="small" appearance="secondary" icon={<KeyRegular />} onClick={resetPw}>
              Reset password
            </Button>
          </div>
        </div>
      </div>

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as any)}>
        <Tab value="overview">Overview</Tab>
        <Tab value="license">License & Limits</Tab>
        <Tab value="smtp">SMTP</Tab>
      </TabList>

      {tab === 'overview' && (
        <FormSection title="Company information" description="Basic details & contact">
          <FormField
            label="Company name" required
            value={v.company_name}
            onChange={(x) => clientForm.setValue('company_name', x)}
            error={clientForm.touched.company_name ? clientForm.errors.company_name : undefined}
            contentBefore={<BuildingRegular />}
          />
          <FormField
            label="Owner"
            value={v.owner_name}
            onChange={(x) => clientForm.setValue('owner_name', x)}
            contentBefore={<PersonRegular />}
          />
          <FormField
            label="Email" value={v.email} onChange={() => {}} disabled
            contentBefore={<MailRegular />}
            hint="Email बदलण्यासाठी support ला संपर्क करा"
          />
          <FormField
            label="Phone"
            value={v.phone}
            onChange={(x) => clientForm.setValue('phone', x)}
            error={clientForm.touched.phone ? clientForm.errors.phone : undefined}
            contentBefore={<PhoneRegular />}
            placeholder="+91 98765 43210"
          />
          <FormField
            label="City"
            value={v.city}
            onChange={(x) => clientForm.setValue('city', x)}
            contentBefore={<LocationRegular />}
          />
          <Field label="Status">
            <div className={s.switchRow}>
              <Switch checked={v.is_active} onChange={(_, d) => clientForm.setValue('is_active', d.checked)} />
              <Text size={200}>{v.is_active ? 'Active' : 'Disabled'}</Text>
            </div>
          </Field>
        </FormSection>
      )}

      {tab === 'license' && (
        <FormSection title="License & resource limits" description="Plan, expiry, and per-tenant caps">
          <FormField
            label="License type"
            value={v.license_type}
            onChange={(x) => clientForm.setValue('license_type', x)}
          />
          <FormField
            label="License expires at" type="date"
            value={v.license_expires_at}
            onChange={(x) => clientForm.setValue('license_expires_at', x)}
            contentBefore={<CalendarRegular />}
          />
          <FormField
            label="Max buses" type="number"
            value={v.max_buses ?? ''}
            onChange={(x) => clientForm.setValue('max_buses', x === '' ? null : Number(x))}
            error={clientForm.touched.max_buses ? clientForm.errors.max_buses : undefined}
            contentBefore={<VehicleBusRegular />}
          />
          <FormField
            label="Max drivers" type="number"
            value={v.max_drivers ?? ''}
            onChange={(x) => clientForm.setValue('max_drivers', x === '' ? null : Number(x))}
            error={clientForm.touched.max_drivers ? clientForm.errors.max_drivers : undefined}
            contentBefore={<PersonRegular />}
          />
          <FormField
            label="Max users" type="number"
            value={v.max_users ?? ''}
            onChange={(x) => clientForm.setValue('max_users', x === '' ? null : Number(x))}
            error={clientForm.touched.max_users ? clientForm.errors.max_users : undefined}
            contentBefore={<PeopleTeamRegular />}
          />
          <FormField
            label="Tenant DB" value={v.tenant_db_name} onChange={() => {}} disabled
            hint="Read-only — backend-managed"
          />
        </FormSection>
      )}

      {(tab === 'overview' || tab === 'license') && (
        <SaveBar
          isDirty={clientForm.isDirty}
          onSave={saveClient}
          onReset={() => clientForm.reset()}
          saving={savingClient}
        />
      )}

      {tab === 'smtp' && (
        <>
          <FormSection title="Client SMTP" description="Per-tenant outgoing email server">
            <FormField
              label="SMTP host"
              value={sv.smtp_host}
              onChange={(x) => smtpForm.setValue('smtp_host', x)}
              placeholder="smtp.gmail.com"
            />
            <FormField
              label="Port" type="number"
              value={sv.smtp_port}
              onChange={(x) => smtpForm.setValue('smtp_port', Number(x) || 0)}
              error={smtpForm.touched.smtp_port ? smtpForm.errors.smtp_port : undefined}
              hint="587 (STARTTLS) किंवा 465 (TLS)"
            />
            <FormField
              label="Username"
              value={sv.smtp_user}
              onChange={(x) => smtpForm.setValue('smtp_user', x)}
              error={smtpForm.touched.smtp_user ? smtpForm.errors.smtp_user : undefined}
            />
            <FormField
              label="Password" type="password"
              value={sv.smtp_pass}
              onChange={(x) => smtpForm.setValue('smtp_pass', x)}
              placeholder="रिकामं ठेवलं तर जुनाच राहील"
            />
            <FormField
              label="From email" type="email"
              value={sv.smtp_from_email}
              onChange={(x) => smtpForm.setValue('smtp_from_email', x)}
              error={smtpForm.touched.smtp_from_email ? smtpForm.errors.smtp_from_email : undefined}
              placeholder="noreply@yourdomain.com"
            />
            <FormField
              label="From name"
              value={sv.smtp_from_name}
              onChange={(x) => smtpForm.setValue('smtp_from_name', x)}
              placeholder="GM Bus Tracking"
            />
            <Field label="Secure (TLS)">
              <div className={s.switchRow}>
                <Switch checked={sv.smtp_secure} onChange={(_, d) => smtpForm.setValue('smtp_secure', d.checked)} />
                <Text size={200}>{sv.smtp_secure ? 'TLS on (465)' : 'STARTTLS (587)'}</Text>
              </div>
            </Field>
          </FormSection>

          <Divider />

          <div className={s.actions}>
            <Button
              appearance="secondary" icon={<SendRegular />}
              onClick={testSmtp} disabled={testBusy || savingSmtp}
            >
              {testBusy ? 'Sending…' : 'Send test email'}
            </Button>
          </div>

          <SaveBar
            isDirty={smtpForm.isDirty}
            onSave={saveSmtp}
            onReset={() => smtpForm.reset()}
            saving={savingSmtp}
            saveLabel="Save SMTP"
            savingLabel="Saving SMTP…"
          />
        </>
      )}
    </div>
  )
}
