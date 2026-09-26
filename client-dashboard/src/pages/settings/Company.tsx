import { useEffect, useState } from 'react'
import { Button, Card, Field, Input, Textarea, Spinner, MessageBar, MessageBarBody, makeStyles, tokens, Text, Divider } from '@fluentui/react-components'
import { BuildingRegular, SaveRegular } from '@fluentui/react-icons'
import api from '../../services/api'
import SettingsLayout from '../../components/SettingsLayout'

const useStyles = makeStyles({
  card: { padding: '28px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, maxWidth: '640px' },
  field: { marginBottom: '18px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
})

export default function Company() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    company: '', phone: '', address: '', city: '', pincode: '', gstin: '',
  })

  useEffect(() => {
    api.get('/api/profile/company').then(r => {
      const d = r.data
      setForm({
        company: d.company_name || '', phone: d.phone || '',
        address: d.address || '', city: d.city || '',
        pincode: d.pincode || '', gstin: d.gstin || '',
      })
    }).catch((e) => {
      setMsg({ type: 'error', text: 'Failed to load: ' + (e.response?.data?.error || e.message) })
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.company) { setMsg({ type: 'error', text: 'Company name required' }); return }
    setSaving(true); setMsg(null)
    try {
      await api.put('/api/profile/company', form)
      setMsg({ type: 'success', text: '✅ Company updated successfully' })
      setTimeout(() => setMsg(null), 3000)
    } catch (e: any) {
      setMsg({ type: 'error', text: '❌ ' + (e.response?.data?.error || e.message) })
    } finally { setSaving(false) }
  }

  if (loading) return <SettingsLayout><Spinner /></SettingsLayout>

  return (
    <SettingsLayout>
      <Card className={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BuildingRegular />
          <Text weight="semibold" size={500}>Company Information</Text>
        </div>
        <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
          This info appears on reports and invoices
        </Text>
        <Divider style={{ marginBottom: '20px' }} />

        {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

        <Field label="Company Name" className={s.field}>
          <Input value={form.company} onChange={(_, d) => setForm({ ...form, company: d.value })} />
        </Field>
        <div className={s.row2}>
          <Field label="Phone" className={s.field}>
            <Input value={form.phone} onChange={(_, d) => setForm({ ...form, phone: d.value })} />
          </Field>
          <Field label="GSTIN (optional)" className={s.field}>
            <Input value={form.gstin} onChange={(_, d) => setForm({ ...form, gstin: d.value })} placeholder="27AABCU9603R1ZM" />
          </Field>
        </div>
        <Field label="Address" className={s.field}>
          <Textarea value={form.address} onChange={(_, d) => setForm({ ...form, address: d.value })} rows={3} placeholder="Street, area..." />
        </Field>
        <div className={s.row2}>
          <Field label="City" className={s.field}>
            <Input value={form.city} onChange={(_, d) => setForm({ ...form, city: d.value })} />
          </Field>
          <Field label="Pincode" className={s.field}>
            <Input value={form.pincode} onChange={(_, d) => setForm({ ...form, pincode: d.value })} />
          </Field>
        </div>

        <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Company'}
        </Button>
      </Card>
    </SettingsLayout>
  )
}
