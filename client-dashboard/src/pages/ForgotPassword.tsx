import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Input, makeStyles, Text, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components'
import { MailRegular, ArrowLeftRegular, KeyRegular, CheckmarkCircleRegular, ArrowSyncRegular, LockClosedRegular } from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  root: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', padding: '20px', position: 'relative', overflow: 'hidden' },
  card: { width: '100%', maxWidth: '460px', background: 'white', borderRadius: '24px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.24)', padding: '40px 32px', position: 'relative', zIndex: 1 },
  logo: { width: '72px', height: '72px', borderRadius: '20px',
    backgroundImage: 'linear-gradient(135deg, #d97706, #dc2626)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '36px', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(217,119,6,0.32)' },
  title: { fontSize: '24px', fontWeight: '700', textAlign: 'center', color: '#111827', marginBottom: '6px' },
  subtitle: { fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '24px', lineHeight: 1.5 },
  email: { fontWeight: '600', color: '#2563eb' },
  field: { marginBottom: '16px' },
  otpRow: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' },
  otpBox: { width: '52px', height: '64px', fontSize: '24px', fontWeight: '700', textAlign: 'center',
    border: '2px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb',
    outline: 'none', fontFamily: 'monospace' },
  otpBoxFilled: { border: '2px solid #d97706', backgroundColor: '#fffbeb' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none',
    border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer',
    padding: '4px 8px', borderRadius: '6px', marginBottom: '12px' },
  stepIndicator: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  step: { width: '32px', height: '4px', borderRadius: '2px', background: '#e5e7eb', transition: 'all 0.3s' },
  stepActive: { background: '#d97706', width: '48px' },
  tempPwBox: { backgroundImage: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '2px dashed #f59e0b',
    borderRadius: '12px', padding: '24px', textAlign: 'center', margin: '20px 0' },
  tempPw: { fontSize: '28px', fontWeight: '700', letterSpacing: '4px',
    color: '#d97706', fontFamily: 'monospace' },
  infoBox: { background: '#fef2f2', borderLeft: '4px solid #dc2626',
    padding: '12px 16px', borderRadius: '6px', margin: '16px 0', fontSize: '13px', color: '#991b1b' },
  timerBadge: { display: 'inline-block', padding: '2px 10px', background: '#fef3c7',
    color: '#92400e', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginLeft: '4px' },
  resendRow: { textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '16px' },
  resendLink: { color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginLeft: '6px' },
})

type Step = 'email' | 'otp' | 'temp-password' | 'new-password'

export default function ForgotPassword() {
  const s = useStyles()
  const nav = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
      setMsg({ type: 'error', text: 'Valid email required' }); return
    }
    setLoading(true); setMsg(null)
    try {
      await api.post('/api/password-reset/send-otp', { email: trimmed })
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      setResendIn(30)
      setExpiresIn(300)
      setMsg({ type: 'success', text: 'Reset OTP sent to your email!' })
      setTimeout(() => inputRefs.current[0]?.focus(), 200)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    } finally { setLoading(false) }
  }

  const verifyOtp = async (code?: string) => {
    const otpCode = code || otp.join('')
    if (otpCode.length !== 6) { setMsg({ type: 'error', text: 'Enter all 6 digits' }); return }
    setLoading(true); setMsg(null)
    try {
      const r = await api.post('/api/password-reset/verify', { email, otp: otpCode })
      setTempPassword(r.data.temp_password || '')
      setStep('temp-password')
      setMsg({ type: 'success', text: 'OTP verified! Temp password generated.' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Invalid OTP' })
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } finally { setLoading(false) }
  }

  const changePassword = async () => {
    if (newPassword.length < 8) { setMsg({ type: 'error', text: 'Password must be 8+ characters' }); return }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setMsg({ type: 'error', text: 'Password needs uppercase + number' }); return
    }
    if (newPassword !== confirmPassword) { setMsg({ type: 'error', text: "Passwords don't match" }); return }
    setLoading(true); setMsg(null)
    try {
      await api.post('/api/password-reset/change', {
        email, oldPassword: tempPassword, newPassword
      })
      setMsg({ type: 'success', text: '✅ Password changed! Redirecting to login...' })
      setTimeout(() => nav('/login'), 2000)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    } finally { setLoading(false) }
  }

  const handleOtpChange = (idx: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[idx] = v
    setOtp(next)
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (next.every(x => x)) setTimeout(() => verifyOtp(next.join('')), 200)
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      e.preventDefault()
      setOtp(pasted.split(''))
      verifyOtp(pasted)
    }
  }

  const stepNum = step === 'email' ? 1 : step === 'otp' ? 2 : step === 'temp-password' ? 3 : 4

  return (
    <div className={s.root}>
      <div className={s.card}>
        <div className={s.logo}>🔐</div>

        <div className={s.stepIndicator}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`${s.step} ${stepNum >= n ? s.stepActive : ''}`} />
          ))}
        </div>

        {step === 'email' && (
          <>
            <div className={s.title}>Forgot Password?</div>
            <div className={s.subtitle}>Enter your registered email to reset password</div>
            {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
            <Field label="Email address" className={s.field}>
              <Input type="email" size="large" value={email} onChange={(_, d) => setEmail(d.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                placeholder="you@company.com" contentBefore={<MailRegular />} autoFocus />
            </Field>
            <Button appearance="primary" size="large" onClick={sendOtp} disabled={loading}
              style={{ width: '100%', height: '48px', marginTop: '8px' }}>
              {loading ? <Spinner size="tiny" /> : 'Send Reset Code →'}
            </Button>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6b7280' }}>
              Remember password? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '600' }} onClick={() => nav('/login')}>Sign in</span>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <button className={s.backBtn} onClick={() => setStep('email')}>
              <ArrowLeftRegular /> Change email
            </button>
            <div className={s.title}>Verify OTP</div>
            <div className={s.subtitle}>We sent 6-digit code to<br /><span className={s.email}>{email}</span></div>
            {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
            <div className={s.otpRow}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => { inputRefs.current[i] = el }}
                  className={`${s.otpBox} ${digit ? s.otpBoxFilled : ''}`}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={loading} autoComplete="one-time-code" />
              ))}
            </div>
            <Button appearance="primary" size="large" onClick={() => verifyOtp()}
              disabled={loading || otp.some(d => !d)}
              style={{ width: '100%', height: '48px' }}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <div className={s.resendRow}>
              Didn't receive? {resendIn > 0 ? <span className={s.timerBadge}>{resendIn}s</span> :
                <span className={s.resendLink} onClick={sendOtp}><ArrowSyncRegular /> Resend</span>}
            </div>
          </>
        )}

        {step === 'temp-password' && (
          <>
            <div className={s.title}>🎉 Password Reset!</div>
            <div className={s.subtitle}>Your temporary password is ready</div>
            {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
            <div className={s.tempPwBox}>
              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px' }}>TEMPORARY PASSWORD</div>
              <div className={s.tempPw}>{tempPassword}</div>
            </div>
            <div className={s.infoBox}>
              <strong>⚠️ Important:</strong> This password was also sent to your email. Set a new password in the next step.
            </div>
            <Button appearance="primary" size="large" onClick={() => setStep('new-password')}
              icon={<ArrowLeftRegular style={{ transform: 'rotate(180deg)' }} />}
              style={{ width: '100%', height: '48px', marginTop: '8px' }}>
              Continue → Set New Password
            </Button>
          </>
        )}

        {step === 'new-password' && (
          <>
            <div className={s.title}>Set New Password</div>
            <div className={s.subtitle}>Choose a strong new password</div>
            {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
            <Field label="Current (Temporary) Password" className={s.field}>
              <Input type="text" value={tempPassword} disabled contentBefore={<KeyRegular />} />
            </Field>
            <Field label="New Password" className={s.field}>
              <Input type="password" value={newPassword} onChange={(_, d) => setNewPassword(d.value)}
                contentBefore={<LockClosedRegular />} placeholder="Min 8 chars, 1 uppercase, 1 number" />
            </Field>
            <Field label="Confirm New Password" className={s.field}>
              <Input type="password" value={confirmPassword} onChange={(_, d) => setConfirmPassword(d.value)}
                contentBefore={<LockClosedRegular />} />
            </Field>
            <Button appearance="primary" size="large" onClick={changePassword} disabled={loading}
              icon={loading ? undefined : <CheckmarkCircleRegular />}
              style={{ width: '100%', height: '48px', marginTop: '8px' }}>
              {loading ? 'Updating...' : 'Set New Password'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
