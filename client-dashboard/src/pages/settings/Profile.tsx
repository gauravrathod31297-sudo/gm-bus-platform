import { useEffect, useState } from 'react'
import { Button, Card, Field, Input, Spinner, MessageBar, MessageBarBody, makeStyles, tokens, Text, Divider } from '@fluentui/react-components'
import { SaveRegular } from '@fluentui/react-icons'
import api from '../../services/api'
import SettingsLayout from '../../components/SettingsLayout'

const useStyles = makeStyles({
  card: { padding: '28px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, maxWidth: '640px' },
  field: { marginBottom: '18px' },
  avatar: {
    width: '72px', height: '72px', borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', fontWeight: '700', marginBottom: '20px',
  },
})

export default function Profile() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })

  useEffect(() => {
    api.get('/api/profile').then(r => {
      const d = r.data
      setForm({
        name: d.name || '', email: d.email || '',
        phone: d.phone || '', company: d.company || '',
      })
      const cached = JSON.parse(localStorage.getItem('client_user') || '{}')
      localStorage.setItem('client_user', JSON.stringify({ ...cached, ...d }))
    }).catch((e) => {
      setMsg({ type: 'error', text: 'Failed to load profile: ' + (e.response?.data?.error || e.message) })
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.name) { setMsg({ type: 'error', text: 'Name required' }); return }
    setSaving(true); setMsg(null)
    try {
      const r = await api.put('/api/profile', { name: form.name, phone: form.phone })
      const cached = JSON.parse(localStorage.getItem('client_user') || '{}')
      localStorage.setItem('client_user', JSON.stringify({ ...cached, name: form.name, phone: form.phone }))
      setMsg({ type: 'success', text: '✅ Profile updated successfully' })
      setTimeout(() => setMsg(null), 3000)
    } catch (e: any) {
      setMsg({ type: 'error', text: '❌ ' + (e.response?.data?.error || e.message) })
    } finally { setSaving(false) }
  }

  if (loading) return <SettingsLayout><Spinner /></SettingsLayout>

  return (
    <SettingsLayout>
      <Card className={s.card}>
        <div className={s.avatar}>{form.name?.charAt(0).toUpperCase() || 'U'}</div>
        <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '4px' }}>Profile Information</Text>
        <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
          Your personal account details
        </Text>
        <Divider style={{ marginBottom: '20px' }} />

        {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

        <Field label="Full Name" className={s.field}>
          <Input value={form.name} onChange={(_, d) => setForm({ ...form, name: d.value })} />
        </Field>
        <Field label="Email Address" className={s.field}>
          <Input type="email" value={form.email} disabled />
        </Field>
        <Field label="Phone Number" className={s.field}>
          <Input value={form.phone} onChange={(_, d) => setForm({ ...form, phone: d.value })} placeholder="+91 9876543210" />
        </Field>
        <Field label="Company" className={s.field}>
          <Input value={form.company} disabled />
        </Field>

        <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving} style={{ marginTop: '8px' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
    </SettingsLayout>
  )
}
