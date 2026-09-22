import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Field, Input, Title1, Subtitle1, makeStyles, tokens
} from '@fluentui/react-components'
import { PersonRegular, LockClosedRegular } from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: { width: '420px', padding: '40px' },
  logo: {
    width: '64px', height: '64px',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', color: 'white', fontSize: '32px',
  },
  field: { marginBottom: '16px' },
  button: { width: '100%', marginTop: '8px' },
})

export default function Login() {
  const styles = useStyles()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/admin/login', { username, password })
      localStorage.setItem('admin_token', res.data.token)
      localStorage.setItem('admin_user', JSON.stringify(res.data.admin))
      nav('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.logo}>🚌</div>
        <Title1 align="center">GM Bus Tracking</Title1>
        <Subtitle1 align="center" style={{ marginBottom: '32px' }}>
          Admin Panel
        </Subtitle1>
        {error && (
          <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <Field label="Username" className={styles.field}>
            <Input
              value={username}
              onChange={(_, d) => setUsername(d.value)}
              contentBefore={<PersonRegular />}
              placeholder="admin"
            />
          </Field>
          <Field label="Password" className={styles.field}>
            <Input
              type="password"
              value={password}
              onChange={(_, d) => setPassword(d.value)}
              contentBefore={<LockClosedRegular />}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" appearance="primary" className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
