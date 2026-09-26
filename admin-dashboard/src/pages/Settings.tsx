import { useEffect, useState } from 'react'
import {
  makeStyles, tokens, Text, Spinner, Tab, TabList,
} from '@fluentui/react-components'
import { SettingsRegular, MailRegular, ShieldRegular } from '@fluentui/react-icons'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { FormField, FormSection, SaveBar } from '../components/Form'
import { useForm } from '../hooks/useForm'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
})

type SystemForm = {
  default_license_type: string
  default_license_days: string
  max_buses_default: string
  max_drivers_default: string
  max_users_default: string
}

type EmailForm = {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_from_email: string
  smtp_from_name: string
}

type SecurityForm = {
  session_hours: string
  otp_expiry_minutes: string
}

export default function Settings() {
  const s = useStyles()
  const toast = useToast()
  const [tab, setTab] = useState<'system' | 'email' | 'security'>('system')
  const [loading, setLoading] = useState(true)

  const sys = useForm<SystemForm>({
    initialValues: { default_license_type: 'basic', default_license_days: '30', max_buses_default: '10', max_drivers_default: '20', max_users_default: '5' },
    validate: (v) => {
      const e: any = {}
      if (!v.default_license_type) e.default_license_type = 'Required'
      const n = Number(v.default_license_days); if (!Number.isFinite(n) || n <= 0) e.default_license_days = 'Positive number'
      return e
    },
  })
  const email = useForm<EmailForm>({
    initialValues: { smtp_host: '', smtp_port: '587', smtp_user: '', smtp_from_email: '', smtp_from_name: '' },
    validate: (v) => {
      const e: any = {}
      const p = Number(v.smtp_port); if (v.smtp_port && (p < 1 || p > 65535)) e.smtp_port = '1-65535'
      if (v.smtp_from_email && !/^\S+@\S+\.\S+$/.test(v.smtp_from_email)) e.smtp_from_email = 'Invalid email'
      return e
    },
  })
  const sec = useForm<SecurityForm>({
    initialValues: { session_hours: '24', otp_expiry_minutes: '10' },
    validate: (v) => {
      const e: any = {}
      const sh = Number(v.session_hours); if (!Number.isFinite(sh) || sh <= 0) e.session_hours = 'Positive'
      const otp = Number(v.otp_expiry_minutes); if (!Number.isFinite(otp) || otp <= 0) e.otp_expiry_minutes = 'Positive'
      return e
    },
  })

  useEffect(() => {
    api.get('/api/admin/settings').then(r => {
      const d = r.data || {}
      sys.reset({
        default_license_type: d.default_license_type || 'basic',
        default_license_days: d.default_license_days || '30',
        max_buses_default: d.max_buses_default || '10',
        max_drivers_default: d.max_drivers_default || '20',
        max_users_default: d.max_users_default || '5',
      })
      email.reset({
        smtp_host: d.smtp_host || '', smtp_port: d.smtp_port || '587',
        smtp_user: d.smtp_user || '', smtp_from_email: d.smtp_from_email || '',
        smtp_from_name: d.smtp_from_name || '',
      })
      sec.reset({
        session_hours: d.session_hours || '24',
        otp_expiry_minutes: d.otp_expiry_minutes || '10',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = (form: any, label: string) => async () => {
    form.markAllTouched()
    if (!form.validate()) return
    form.setSubmitting(true)
    try {
      await api.put('/api/admin/settings', form.values)
      toast.success(`${label} settings saved`)
      form.reset(form.values)
    } catch (e: any) {
      toast.error('Save failed', e.response?.data?.error || e.message)
    } finally { form.setSubmitting(false) }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner label="Loading…" /></div>

  return (
    <div className={s.wrap}>
      <div>
        <Text className={s.h1}>Settings</Text>
        <Text className={s.sub}>System-wide configuration</Text>
      </div>

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as any)}>
        <Tab value="system" icon={<SettingsRegular />}>System</Tab>
        <Tab value="email" icon={<MailRegular />}>Email</Tab>
        <Tab value="security" icon={<ShieldRegular />}>Security</Tab>
      </TabList>

      {tab === 'system' && (
        <>
          <FormSection title="Platform defaults" description="Newly approved clients वर लागू होतात">
            <FormField label="Default license type" required value={sys.values.default_license_type}
              onChange={(v) => sys.setValue('default_license_type', v)}
              error={sys.touched.default_license_type ? sys.errors.default_license_type : undefined} />
            <FormField label="Default license duration (days)" type="number" required value={sys.values.default_license_days}
              onChange={(v) => sys.setValue('default_license_days', v)}
              error={sys.touched.default_license_days ? sys.errors.default_license_days : undefined} />
            <FormField label="Default max buses" type="number" value={sys.values.max_buses_default}
              onChange={(v) => sys.setValue('max_buses_default', v)} />
            <FormField label="Default max drivers" type="number" value={sys.values.max_drivers_default}
              onChange={(v) => sys.setValue('max_drivers_default', v)} />
            <FormField label="Default max users" type="number" value={sys.values.max_users_default}
              onChange={(v) => sys.setValue('max_users_default', v)} />
          </FormSection>
          <SaveBar isDirty={sys.isDirty} onSave={save(sys, 'System')} onReset={() => sys.reset()}
            saving={sys.submitting} />
        </>
      )}

      {tab === 'email' && (
        <>
          <FormSection title="Global SMTP" description="Fallback SMTP — clients can override">
            <FormField label="SMTP host" value={email.values.smtp_host}
              onChange={(v) => email.setValue('smtp_host', v)} placeholder="smtp.gmail.com" />
            <FormField label="Port" type="number" value={email.values.smtp_port}
              onChange={(v) => email.setValue('smtp_port', v)}
              error={email.touched.smtp_port ? email.errors.smtp_port : undefined} />
            <FormField label="Username" value={email.values.smtp_user}
              onChange={(v) => email.setValue('smtp_user', v)} />
            <FormField label="From email" type="email" value={email.values.smtp_from_email}
              onChange={(v) => email.setValue('smtp_from_email', v)}
              error={email.touched.smtp_from_email ? email.errors.smtp_from_email : undefined} />
            <FormField label="From name" value={email.values.smtp_from_name}
              onChange={(v) => email.setValue('smtp_from_name', v)} />
          </FormSection>
          <SaveBar isDirty={email.isDirty} onSave={save(email, 'Email')} onReset={() => email.reset()}
            saving={email.submitting} />
        </>
      )}

      {tab === 'security' && (
        <>
          <FormSection title="Security defaults">
            <FormField label="Session duration (hours)" type="number" value={sec.values.session_hours}
              onChange={(v) => sec.setValue('session_hours', v)}
              error={sec.touched.session_hours ? sec.errors.session_hours : undefined}
              hint="Admin/client JWT expiry" />
            <FormField label="OTP expiry (minutes)" type="number" value={sec.values.otp_expiry_minutes}
              onChange={(v) => sec.setValue('otp_expiry_minutes', v)}
              error={sec.touched.otp_expiry_minutes ? sec.errors.otp_expiry_minutes : undefined} />
          </FormSection>
          <SaveBar isDirty={sec.isDirty} onSave={save(sec, 'Security')} onReset={() => sec.reset()}
            saving={sec.submitting} />
        </>
      )}
    </div>
  )
}
