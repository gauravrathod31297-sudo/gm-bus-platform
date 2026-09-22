import { useState } from 'react'
import { Button, Card, Field, Input, makeStyles, tokens, Text } from '@fluentui/react-components'
import api from '../services/api'
const useStyles = makeStyles({
  root: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2563eb,#7c3aed)' },
  card: { padding: '40px', width: '420px' },
  field: { marginBottom: '16px' },
})
export default function Login() {
  const s = useStyles()
  const [email, setEmail] = useState('admin@gmbus.com')
  const [password, setPassword] = useState('Admin@123')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e: any) => {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const r = await api.post('/api/admin/login', { email, password })
      localStorage.setItem('admin_token', r.data.token)
      localStorage.setItem('admin', JSON.stringify(r.data.admin))
      window.location.href = '/'
    } catch (e: any) { setErr(e.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }
  return (
    <div className={s.root}>
      <Card className={s.card}>
        <Text size={700} weight="bold" style={{ display: 'block', marginBottom: '8px' }}>🔐 Admin Panel</Text>
        <Text style={{ display: 'block', marginBottom: '24px', color: tokens.colorNeutralForeground3 }}>GM Bus Platform — Super Admin</Text>
        {err && <div style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>{err}</div>}
        <form onSubmit={submit}>
          <Field label="Email" className={s.field}><Input value={email} onChange={(_, d) => setEmail(d.value)} type="email" /></Field>
          <Field label="Password" className={s.field}><Input value={password} onChange={(_, d) => setPassword(d.value)} type="password" /></Field>
          <Button appearance="primary" type="submit" disabled={loading} style={{ width: '100%', height: '40px' }}>{loading ? 'Logging in...' : 'Login'}</Button>
        </form>
      </Card>
    </div>
  )
}
