import { useState } from 'react'
import { Button, Card, Field, Input, MessageBar, MessageBarBody,
  makeStyles, tokens, Text, Divider } from '@fluentui/react-components'
import { SaveRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px', maxWidth: '600px' },
  field: { marginBottom: '16px' },
})

export default function Settings() {
  const styles = useStyles()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const changePass = async () => {
    try {
      await api.post('/api/auth/change-password', { oldPassword: oldPass, newPassword: newPass })
      setMsg({ type: 'success', text: 'Password changed!' })
      setOldPass(''); setNewPass('')
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    }
  }

  return (
    <Layout title="Settings">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <Text size={500} weight="semibold">Account</Text>
        <Divider style={{ margin: '16px 0' }} />
        <Field label="Name"><Input value={user.name || ''} readOnly /></Field>
        <Field label="Email"><Input value={user.email || ''} readOnly /></Field>
        <Field label="Company"><Input value={user.company || ''} readOnly /></Field>
      </Card>

      <Card className={styles.card} style={{ marginTop: '16px' }}>
        <Text size={500} weight="semibold">Change Password</Text>
        <Divider style={{ margin: '16px 0' }} />
        <Field label="Current Password" className={styles.field}>
          <Input type="password" value={oldPass} onChange={(_, d) => setOldPass(d.value)} />
        </Field>
        <Field label="New Password" className={styles.field}>
          <Input type="password" value={newPass} onChange={(_, d) => setNewPass(d.value)} />
        </Field>
        <Button appearance="primary" icon={<SaveRegular />} onClick={changePass}>Update Password</Button>
      </Card>
    </Layout>
  )
}
