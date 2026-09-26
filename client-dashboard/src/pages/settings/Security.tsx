import { useState } from 'react'
import { Button, Card, Field, Input, makeStyles, tokens, Text, Divider, MessageBar, MessageBarBody } from '@fluentui/react-components'
import { KeyRegular, ShieldRegular } from '@fluentui/react-icons'
import api from '../../services/api'
import SettingsLayout from '../../components/SettingsLayout'
import { showToast } from '../../utils/toast'

const useStyles = makeStyles({
  card: { padding: '28px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, maxWidth: '640px' },
  field: { marginBottom: '18px' },
  dangerBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginTop: '16px' },
})

export default function Security() {
  const s = useStyles()
  const [form, setForm] = useState({ current: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.current || !form.new) { showToast('Error', 'Please fill all fields', 'error'); return }
    if (form.new !== form.confirm) { showToast('Error', "Passwords don't match", 'error'); return }
    if (form.new.length < 8) { showToast('Error', 'Minimum 8 characters required', 'error'); return }
    setSaving(true)
    try {
      const user = JSON.parse(localStorage.getItem('client_user') || '{}')
      await api.post('/api/password-reset/change', { email: user.email, oldPassword: form.current, newPassword: form.new })
      showToast('Success', 'Password changed')
      setForm({ current: '', new: '', confirm: '' })
    } catch (e: any) { showToast('Error', e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <SettingsLayout>
      <Card className={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <KeyRegular />
          <Text weight="semibold" size={500}>Change Password</Text>
        </div>
        <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
          Use 8+ chars with 1 uppercase + 1 number
        </Text>
        <Divider style={{ marginBottom: '20px' }} />

        <Field label="Current Password" className={s.field}>
          <Input type="password" value={form.current} onChange={(_, d) => setForm({ ...form, current: d.value })} />
        </Field>
        <Field label="New Password" className={s.field}>
          <Input type="password" value={form.new} onChange={(_, d) => setForm({ ...form, new: d.value })} />
        </Field>
        <Field label="Confirm New Password" className={s.field}>
          <Input type="password" value={form.confirm} onChange={(_, d) => setForm({ ...form, confirm: d.value })} />
        </Field>

        <Button appearance="primary" icon={<KeyRegular />} onClick={submit} disabled={saving}>
          {saving ? 'Updating...' : 'Update Password'}
        </Button>
      </Card>

      <Card className={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ShieldRegular />
          <Text weight="semibold" size={500}>Two-Factor Authentication</Text>
        </div>
        <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
          Add an extra layer of security to your account
        </Text>
        <Divider style={{ marginBottom: '20px' }} />

        <div className={s.dangerBox}>
          <Text weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>🚧 Coming Soon</Text>
          <Text size={200}>2FA with SMS/Email OTP will be added in a future update.</Text>
        </div>
      </Card>
    </SettingsLayout>
  )
}
