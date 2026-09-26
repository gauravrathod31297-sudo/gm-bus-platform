import { useEffect, useState } from 'react'
import {
  makeStyles, tokens, Text, Button, Avatar, MessageBar, MessageBarBody,
  Spinner, Divider, Tab, TabList,
} from '@fluentui/react-components'
import { SaveRegular } from '@fluentui/react-icons'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { FormField, FormSection, SaveBar } from '../components/Form'
import { useForm } from '../hooks/useForm'

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 },
  h1: { fontSize: 22, fontWeight: 700, color: '#111827', display: 'block' },
  sub: { fontSize: 13, color: '#6b7280', display: 'block' },
  card: { background: 'white', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: 12, padding: 24 },
  head: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  name: { fontSize: 18, fontWeight: 700, color: '#111827', display: 'block' },
  email: { fontSize: 13, color: '#6b7280', display: 'block' },
})

type ProfileForm = { name: string; email: string }
type PwForm = { current_password: string; new_password: string; confirm: string }

export default function Profile() {
  const s = useStyles()
  const toast = useToast()
  const [tab, setTab] = useState<'profile' | 'password'>('profile')
  const [loading, setLoading] = useState(true)
  const [savingP, setSavingP] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const profileForm = useForm<ProfileForm>({
    initialValues: { name: '', email: '' },
    validate: (v) => {
      const e: any = {}
      if (!v.name.trim()) e.name = 'Name आवश्यक'
      return e
    },
  })

  const pwForm = useForm<PwForm>({
    initialValues: { current_password: '', new_password: '', confirm: '' },
    validate: (v) => {
      const e: any = {}
      if (!v.current_password) e.current_password = 'Current password आवश्यक'
      if (v.new_password.length < 6) e.new_password = '6+ characters'
      if (v.new_password !== v.confirm) e.confirm = 'Passwords जुळत नाहीत'
      return e
    },
  })

  useEffect(() => {
    api.get('/api/admin/me')
      .then(r => profileForm.reset({ name: r.data.name || '', email: r.data.email || '' }))
      .catch(e => toast.error('Failed to load profile', e.message))
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    profileForm.markAllTouched()
    if (!profileForm.validate()) return
    setSavingP(true)
    try {
      await api.put('/api/admin/me', { name: profileForm.values.name })
      toast.success('Profile updated')
      profileForm.reset(profileForm.values)
      const stored = JSON.parse(localStorage.getItem('admin_user') || '{}')
      localStorage.setItem('admin_user', JSON.stringify({ ...stored, name: profileForm.values.name }))
    } catch (e: any) {
      toast.error('Save failed', e.response?.data?.error || e.message)
    } finally { setSavingP(false) }
  }

  const savePassword = async () => {
    pwForm.markAllTouched()
    if (!pwForm.validate()) return
    setSavingPw(true)
    try {
      await api.put('/api/admin/me/password', {
        current_password: pwForm.values.current_password,
        new_password: pwForm.values.new_password,
      })
      toast.success('Password changed')
      pwForm.reset()
    } catch (e: any) {
      toast.error('Change failed', e.response?.data?.error || e.message)
    } finally { setSavingPw(false) }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner label="Loading…" /></div>

  return (
    <div className={s.wrap}>
      <div>
        <Text className={s.h1}>Profile</Text>
        <Text className={s.sub}>Your admin account</Text>
      </div>

      <div className={s.card}>
        <div className={s.head}>
          <Avatar size={64} name={profileForm.values.name || 'Admin'} color="brand" />
          <div>
            <Text className={s.name}>{profileForm.values.name || 'Admin'}</Text>
            <Text className={s.email}>{profileForm.values.email}</Text>
          </div>
        </div>

        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as any)}>
          <Tab value="profile">Profile</Tab>
          <Tab value="password">Change password</Tab>
        </TabList>

        {tab === 'profile' && (
          <FormSection title="Basic information">
            <FormField
              label="Full name" required
              value={profileForm.values.name}
              onChange={(v) => profileForm.setValue('name', v)}
              error={profileForm.touched.name ? profileForm.errors.name : undefined}
            />
            <FormField
              label="Email" value={profileForm.values.email}
              onChange={() => {}} disabled
              hint="Email बदलण्यासाठी support ला संपर्क करा"
            />
          </FormSection>
        )}

        {tab === 'password' && (
          <FormSection title="Change password">
            <FormField
              label="Current password" type="password" required
              value={pwForm.values.current_password}
              onChange={(v) => pwForm.setValue('current_password', v)}
              error={pwForm.touched.current_password ? pwForm.errors.current_password : undefined}
            />
            <FormField
              label="New password" type="password" required
              value={pwForm.values.new_password}
              onChange={(v) => pwForm.setValue('new_password', v)}
              error={pwForm.touched.new_password ? pwForm.errors.new_password : undefined}
              hint="किमान 6 characters"
            />
            <FormField
              label="Confirm new password" type="password" required
              value={pwForm.values.confirm}
              onChange={(v) => pwForm.setValue('confirm', v)}
              error={pwForm.touched.confirm ? pwForm.errors.confirm : undefined}
            />
          </FormSection>
        )}

        {tab === 'profile' && (
          <SaveBar isDirty={profileForm.isDirty} onSave={saveProfile} onReset={() => profileForm.reset()}
            saving={savingP} saveLabel="Save profile" />
        )}
        {tab === 'password' && (
          <SaveBar isDirty={pwForm.isDirty} onSave={savePassword} onReset={() => pwForm.reset()}
            saving={savingPw} saveLabel="Change password" />
        )}
      </div>
    </div>
  )
}
