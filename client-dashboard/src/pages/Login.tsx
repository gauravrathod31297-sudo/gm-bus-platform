import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, Input, Title1, Subtitle1, makeStyles, tokens } from '@fluentui/react-components'
import { PersonRegular, LockClosedRegular } from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  root: { minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', backgroundColor: tokens.colorNeutralBackground2 },
  card: { width: '420px', padding: '40px' },
  logo: { width: '64px', height: '64px', backgroundColor: tokens.colorBrandBackground,
    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', color: 'white', fontSize: '32px' },
  field: { marginBottom: '16px' },
  button: { width: '100%', marginTop: '8px' },
})

export default function Login() {
  const styles = useStyles()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('client_token', res.data.token)
      localStorage.setItem('client_user', JSON.stringify(res.data.user))
      nav('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.logo}>🚌</div>
        <Title1 align="center">GM Bus Tracking</Title1>
        <Subtitle1 align="center" style={{ marginBottom: '32px' }}>Client Dashboard</Subtitle1>
        {error && <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={submit}>
          <Field label="Email" className={styles.field}>
            <Input value={email} onChange={(_, d) => setEmail(d.value)}
              contentBefore={<PersonRegular />} placeholder="you@company.com" />
          </Field>
          <Field label="Password" className={styles.field}>
            <Input type="password" value={password} onChange={(_, d) => setPassword(d.value)}
              contentBefore={<LockClosedRegular />} placeholder="••••••••" />
          </Field>
          <Button type="submit" appearance="primary" className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
