import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Field, Input, makeStyles, tokens, Text, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components'
import { MailRegular, LockClosedRegular, ArrowLeftRegular, ArrowSyncRegular, CheckmarkCircleRegular, EyeRegular, EyeOffRegular } from '@fluentui/react-icons'
import api from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  root: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    padding: '20px', position: 'relative', overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4,
  },
  card: {
    width: '100%', maxWidth: '440px', background: 'white', borderRadius: '24px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.24)', padding: '40px 32px',
    position: 'relative', zIndex: 1,
  },
  logo: {
    width: '72px', height: '72px', borderRadius: '20px',
    backgroundImage: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '36px', margin: '0 auto 20px',
    boxShadow: '0 8px 24px rgba(37,99,235,0.32)',
  },
  title: { fontSize: '26px', fontWeight: '700', textAlign: 'center', color: '#111827', marginBottom: '6px' },
  subtitle: { fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '28px', lineHeight: 1.5 },
  email: { fontWeight: '600', color: '#2563eb' },
  field: { marginBottom: '16px' },
  otpRow: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' },
  otpBox: {
    width: '52px', height: '64px', fontSize: '24px', fontWeight: '700', textAlign: 'center',
    border: '2px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb',
    transition: 'all 0.15s', outline: 'none', fontFamily: 'monospace',
    ':focus': { border: '2px solid #2563eb', backgroundColor: 'white' },
  },
  otpBoxFilled: { border: '2px solid #2563eb', backgroundColor: 'white' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'transparent',
    border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer',
    padding: '4px 8px', borderRadius: '6px', marginBottom: '12px',
    ':hover': { background: '#f3f4f6', color: '#111827' },
  },
  resendRow: { textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '16px' },
  resendLink: { color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginLeft: '6px' },
  resendDisabled: { color: '#9ca3af', cursor: 'not-allowed' },
  hint: { fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 },
  timerBadge: {
    display: 'inline-block', padding: '2px 10px', background: '#eff6ff', color: '#2563eb',
    borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginLeft: '4px',
  },
})

export default function OTPLogin() {
  const s = useStyles()
  const nav = useNavigate()
  const { setLang } = useLanguage()

  // Accept token from ?token= (cross-port login bridge from admin app)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      if (urlToken) {
        localStorage.setItem('client_token', urlToken)
        // Clean URL and go to dashboard
        window.history.replaceState({}, '', '/login')
        window.location.replace('/')
      }
    } catch (e) { /* ignore */ }
  }, [])
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState(localStorage.getItem('last_email') || '')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown for resend + OTP expiry
  useEffect(() => {
    if (resendIn <= 0 && expiresIn <= 0) return
    const iv = setInterval(() => {
      setResendIn(v => Math.max(0, v - 1))
      setExpiresIn(v => Math.max(0, v - 1))
    }, 1000)
    return () => clearInterval(iv)
  }, [resendIn, expiresIn])

  const sendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^@]+@[^@]+\.[^@]+$/.test(trimmed)) {
      setMsg({ type: 'error', text: 'Please enter a valid email address' })
      return
    }
    if (!password || password.length < 4) {
      setMsg({ type: 'error', text: 'Please enter your password (min 4 characters)' })
      return
    }
    setLoading(true); setMsg(null)
    try {
      const r = await api.post('/api/auth-otp/send', { email: trimmed, password })
      localStorage.setItem('last_email', trimmed)
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      setResendIn(30)
      setExpiresIn(r.data.expiresIn || 300)
      setMsg({ type: 'success', text: 'OTP sent to your email!' })
      setTimeout(() => inputRefs.current[0]?.focus(), 200)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to send OTP' })
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setMsg({ type: 'error', text: 'Please enter all 6 digits' })
      return
    }
    setVerifying(true); setMsg(null)
    try {
      const r = await api.post('/api/auth-otp/verify', { email: email.trim().toLowerCase(), otp: code })
      const { token, user } = r.data

      // Save auth
      localStorage.setItem('client_token', token)
      localStorage.setItem('client_user', JSON.stringify(user))
      if (user.preferred_language) {
        localStorage.setItem('ui_language', user.preferred_language)
        setLang(user.preferred_language)
      }

      // Redirect based on user type
      if (user.type === 'admin') {
        window.location.href = 'http://localhost:5173'
      } else {
        nav('/')
        window.location.reload()
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Invalid OTP' })
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } finally { setVerifying(false) }
  }

  const handleOtpChange = (idx: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = v
    setOtp(next)

    // Auto-focus next
    if (v && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }

    // Auto-verify when all filled
    if (next.every(x => x) && next.join('').length === 6) {
      setTimeout(() => verifyOtpWithCode(next.join('')), 150)
    }
  }

  const verifyOtpWithCode = async (code: string) => {
    setVerifying(true); setMsg(null)
    try {
      const r = await api.post('/api/auth-otp/verify', { email: email.trim().toLowerCase(), otp: code })
      const { token, user } = r.data
      localStorage.setItem('client_token', token)
      localStorage.setItem('client_user', JSON.stringify(user))
      if (user.preferred_language) {
        localStorage.setItem('ui_language', user.preferred_language)
        setLang(user.preferred_language)
      }
      if (user.type === 'admin') {
        window.location.href = 'http://localhost:5173'
      } else {
        nav('/')
        window.location.reload()
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Invalid OTP' })
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } finally { setVerifying(false) }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    } else if (e.key === 'Enter') {
      verifyOtp()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      e.preventDefault()
      setOtp(pasted.split(''))
      verifyOtpWithCode(pasted)
    }
  }

  const changeEmail = () => {
    setStep('email')
    setOtp(['', '', '', '', '', ''])
    setPassword('')
    setMsg(null)
    setResendIn(0)
    setExpiresIn(0)
  }

  return (
    <div className={s.root}>
      {/* Decorative blobs */}
      <div className={s.bgCircle} style={{ width: 300, height: 300, background: '#60a5fa', top: -100, left: -80 }} />
      <div className={s.bgCircle} style={{ width: 400, height: 400, background: '#a78bfa', bottom: -150, right: -100 }} />

      <div className={s.card}>
        <div className={s.logo}>🚌</div>

        {step === 'email' && (
          <>
            <div className={s.title}>Welcome Back</div>
            <div className={s.subtitle}>Sign in with your email to continue</div>

            {msg && (
              <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
                <MessageBarBody>{msg.text}</MessageBarBody>
              </MessageBar>
            )}

            <Field label="Email address" className={s.field}>
              <Input
                type="email"
                size="large"
                value={email}
                onChange={(_, d) => setEmail(d.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                placeholder="you@company.com"
                contentBefore={<MailRegular />}
                autoFocus
              />
            </Field>

            <Field label="Password" className={s.field}>
              <Input
                type={showPwd ? 'text' : 'password'}
                size="large"
                value={password}
                onChange={(_, d) => setPassword(d.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                placeholder="Enter your password"
                contentBefore={<LockClosedRegular />}
                contentAfter={
                  <span
                    onClick={() => setShowPwd(v => !v)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOffRegular /> : <EyeRegular />}
                  </span>
                }
              />
            </Field>

            <Button
              appearance="primary"
              size="large"
              onClick={sendOtp}
              disabled={loading}
              style={{ width: '100%', height: '48px', fontSize: '15px', marginTop: '8px' }}
            >
              {loading ? <Spinner size="tiny" /> : 'Send OTP →'}
            </Button>

            <div className={s.hint}>
              🔒 Enter your email and password. We'll send a 6-digit OTP to your email.
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Forgot password? </span>
              <Link to="/forgot-password" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>Reset →</Link>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <button className={s.backBtn} onClick={changeEmail}>
              <ArrowLeftRegular /> Change email
            </button>

            <div className={s.title}>Check your email</div>
            <div className={s.subtitle}>
              We sent a 6-digit code to<br />
              <span className={s.email}>{email}</span>
            </div>

            {msg && (
              <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
                <MessageBarBody>{msg.text}</MessageBarBody>
              </MessageBar>
            )}

            <div className={s.otpRow}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  className={`${s.otpBox} ${digit ? s.otpBoxFilled : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={verifying}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {verifying && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>
                <Spinner size="tiny" /> Verifying...
              </div>
            )}

            <Button
              appearance="primary"
              size="large"
              onClick={verifyOtp}
              disabled={verifying || otp.some(d => !d)}
              icon={verifying ? undefined : <CheckmarkCircleRegular />}
              style={{ width: '100%', height: '48px', fontSize: '15px' }}
            >
              {verifying ? 'Verifying...' : 'Verify & Sign In'}
            </Button>

            <div className={s.resendRow}>
              Didn't receive it?
              {resendIn > 0 ? (
                <span className={s.resendDisabled}>
                  <span className={s.timerBadge}>{resendIn}s</span>
                </span>
              ) : (
                <span className={s.resendLink} onClick={sendOtp}>
                  <ArrowSyncRegular style={{ fontSize: '12px' }} /> Resend code
                </span>
              )}
            </div>

            {expiresIn > 0 && (
              <div className={s.hint}>
                ⏱️ Code expires in {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
