import { useEffect, useState } from 'react'
import { Button, Card, Field, Input, Switch, Spinner, MessageBar, MessageBarBody, makeStyles, tokens, Text, Divider, Badge } from '@fluentui/react-components'
import { SaveRegular, MailRegular, SendRegular, CheckmarkCircleRegular } from '@fluentui/react-icons'
import api from '../../services/api'
import SettingsLayout from '../../components/SettingsLayout'
import { useLanguage } from '../../i18n/LanguageContext'
import { showToast } from '../../utils/toast'

const useStyles = makeStyles({
  card: { padding: '24px', maxWidth: '720px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}` },
  field: { marginBottom: '16px' },
  row2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' },
  helpBox: { background: '#eff6ff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#1e40af', marginTop: '8px', border: '1px solid #bfdbfe' },
})

export default function SmtpSettings() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('')
  const [form, setForm] = useState({
    host: '', port: 587, secure: false, username: '', password: '',
    from_name: '', from_email: '',
  })

  useEffect(() => {
    api.get('/api/smtp').then(r => {
      if (r.data) setForm({
        host: r.data.host || '', port: r.data.port || 587, secure: r.data.secure || false,
        username: r.data.username || '', password: r.data.password || '',
        from_name: r.data.from_name || '', from_email: r.data.from_email || '',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      await api.put('/api/smtp', form)
      showToast('Success', 'SMTP saved')
      setMsg({ type: 'success', text: '✅ SMTP settings saved' })
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setSaving(false) }
  }

  const test = async () => {
    setTesting(true); setMsg(null)
    try {
      const r = await api.post('/api/smtp/test')
      showToast('Success', r.data.message || 'Email sent')
      setMsg({ type: 'success', text: '✅ ' + (r.data.message || 'Test email sent') })
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'SMTP test failed' }) }
    finally { setTesting(false) }
  }

  const sendTest = async () => {
    if (!testEmail) { setMsg({ type: 'error', text: 'Email required' }); return }
    setTesting(true); setMsg(null)
    try {
      await api.post('/api/smtp/test-send', { to: testEmail })
      showToast('Success', 'Email sent to ' + testEmail)
      setMsg({ type: 'success', text: '✅ Email sent to ' + testEmail })
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setTesting(false) }
  }

  if (loading) return <SettingsLayout><Spinner /></SettingsLayout>

  return (
    <SettingsLayout>
      <Text size={600} weight="bold" style={{ display: 'block', marginBottom: '20px' }}>📧 Email Settings (SMTP)</Text>

      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px', maxWidth: '720px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MailRegular />
          <Text weight="semibold" size={400}>Outgoing Email Server</Text>
        </div>
        <div className={s.helpBox}>
          <strong>💡 Popular SMTP servers:</strong>
          <ul style={{ marginTop: '6px', paddingLeft: '20px', fontSize: '12px' }}>
            <li><strong>Gmail:</strong> smtp.gmail.com : 587 (App Password)</li>
            <li><strong>Outlook:</strong> smtp-mail.outlook.com : 587</li>
            <li><strong>Zoho:</strong> smtp.zoho.in : 587</li>
            <li><strong>SendGrid:</strong> smtp.sendgrid.net : 587</li>
          </ul>
        </div>
        <Divider style={{ margin: '16px 0' }} />

        <div className={s.row2}>
          <Field label="SMTP Host *" className={s.field}>
            <Input value={form.host} onChange={(_, d) => setForm({ ...form, host: d.value })} placeholder="smtp.gmail.com" />
          </Field>
          <Field label="Port *" className={s.field}>
            <Input type="number" value={String(form.port)} onChange={(_, d) => setForm({ ...form, port: parseInt(d.value) || 587 })} />
          </Field>
        </div>

        <Field label="Username (Email) *" className={s.field}>
          <Input value={form.username} onChange={(_, d) => setForm({ ...form, username: d.value })} placeholder="your@email.com" />
        </Field>

        <Field label="Password / App Password *" className={s.field}>
          <Input type="password" value={form.password} onChange={(_, d) => setForm({ ...form, password: d.value })} placeholder="••••••••" />
        </Field>

        <Field label="Use SSL/TLS" className={s.field}>
          <Switch checked={form.secure} onChange={(_, d) => setForm({ ...form, secure: d.checked })} label={form.secure ? 'SSL (port 465)' : 'STARTTLS (port 587)'} />
        </Field>

        <Divider style={{ margin: '16px 0' }} />
        <Text weight="semibold" size={300} style={{ display: 'block', marginBottom: '12px' }}>From Address</Text>

        <div className={s.row2}>
          <Field label="From Name" className={s.field}>
            <Input value={form.from_name} onChange={(_, d) => setForm({ ...form, from_name: d.value })} placeholder="Gaurav Bus Service" />
          </Field>
          <Field label="From Email" className={s.field}>
            <Input value={form.from_email} onChange={(_, d) => setForm({ ...form, from_email: d.value })} placeholder="noreply@yourdomain.com" />
          </Field>
        </div>
      </Card>

      <Card className={s.card}>
        <Text weight="semibold" size={400} style={{ display: 'block', marginBottom: '16px' }}>🧪 Test Email</Text>
        <Field label="Send Test Email To" className={s.field}>
          <Input value={testEmail} onChange={(_, d) => setTestEmail(d.value)} placeholder="test@example.com" />
        </Field>
        <Button appearance="primary" icon={<SendRegular />} onClick={sendTest} disabled={testing}>
          {testing ? 'Sending...' : 'Send Test Email'}
        </Button>
      </Card>

      <div style={{ maxWidth: '720px', display: 'flex', gap: '12px' }}>
        <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Saving...' : 'Save SMTP Settings'}
        </Button>
        <Button appearance="outline" icon={<CheckmarkCircleRegular />} onClick={test} disabled={testing}>
          {testing ? 'Verifying...' : 'Verify SMTP'}
        </Button>
      </div>
    </SettingsLayout>
  )
}
