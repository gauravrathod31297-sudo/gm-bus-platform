
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Field, Input, Text, MessageBar, MessageBarBody, Spinner,
  Tab, TabList, makeStyles,
} from '@fluentui/react-components'
import {
  MailRegular, LockClosedRegular, ArrowLeftRegular,
  EyeRegular, EyeOffRegular, PersonRegular, BuildingRegular, PhoneRegular,
  LocationRegular, ShieldCheckmarkRegular, VehicleBusRegular,
  PeopleTeamRegular, ChartMultipleRegular, CheckmarkCircleRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.05fr 1fr',
    '@media (max-width: 960px)': { gridTemplateColumns: '1fr' },
  },
  left: {
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    color: 'white',
    padding: '56px 64px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    '@media (max-width: 960px)': { display: 'none' },
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px',
  },
  brandName: { fontSize: '18px', fontWeight: 700 },
  hero: { marginTop: 'auto', marginBottom: 'auto', paddingTop: '24px', paddingBottom: '24px' },
  heroTitle: {
    fontSize: '38px', fontWeight: 700, lineHeight: 1.15, marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  heroSub: { fontSize: '16px', opacity: 0.85, lineHeight: 1.6, maxWidth: '440px', marginBottom: '36px' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  feature: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14.5px' },
  featureIcon: {
    width: '32px', height: '32px', borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  footerNote: { fontSize: '12px', opacity: 0.65, marginTop: '24px' },
  right: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 40px', background: 'white',
    '@media (max-width: 960px)': { padding: '24px 20px' },
  },
  card: { width: '100%', maxWidth: '440px' },
  tabs: { marginBottom: '24px' },
  title: { fontSize: '26px', fontWeight: 700, color: '#111827', marginBottom: '6px', display: 'block' },
  subtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '24px', display: 'block', lineHeight: 1.5 },
  field: { marginBottom: '14px' },
  email: { fontWeight: 600, color: '#2563eb' },
  otpRow: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  otpBox: {
    width: '46px', height: '56px', fontSize: '22px', fontWeight: 700, textAlign: 'center',
    border: '2px solid #e5e7eb', borderRadius: '10px', background: '#f9fafb',
    outline: 'none', fontFamily: 'monospace', transition: 'all 0.15s',
    ':focus': { border: '2px solid #2563eb', backgroundColor: 'white' },
  },
  otpFilled: { border: '2px solid #2563eb', backgroundColor: 'white' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent',
    border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer',
    padding: '4px 0', marginBottom: '12px',
  },
  resendRow: { textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '12px' },
  link: { color: '#2563eb', fontWeight: 600, cursor: 'pointer' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  submitBtn: { width: '100%', height: '42px', fontSize: '14.5px', marginTop: '6px' },
  successWrap: { textAlign: 'center', padding: '24px 0' },
  successIcon: { fontSize: '56px', marginBottom: '12px' },
  hint: { fontSize: '12.5px', color: '#9ca3af', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 },
})

type Mode = 'signin-email' | 'signin-otp' | 'signup' | 'signup-done'

export default function Login() {
  const s = useStyles()
  const nav = useNavigate()

  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [mode, setMode] = useState<Mode>('signin-email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [secs, setSecs] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [sentTo, setSentTo] = useState('')

  const [signup, setSignup] = useState({
    name: '', email: '', phone: '', company_name: '',
    city: '', address: '', pincode: '', gstin: '', message: '',
  })

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null)

  useEffect(() => {
    if (secs <= 0) return
    const t = setInterval(() => setSecs(v => v - 1), 1000)
    return () => clearInterval(t)
  }, [secs])

  const sendOtp = async () => {
    setMsg(null)
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMsg({ type: 'error', text: 'Valid email टाका' }); return
    }
    if (!password || password.length < 4) {
      setMsg({ type: 'error', text: 'Password किमान 4 characters' }); return
    }
    setLoading(true)
    try {
      await api.post('/api/auth-otp/send', { email, password })
      setSentTo(email)
      setMode('signin-otp')
      setSecs(60)
      setOtp(['', '', '', '', '', ''])
      setMsg({ type: 'success', text: 'OTP पाठवला → ' + email })
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'OTP पाठवता आला नाही' })
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length !== 6) { setMsg({ type: 'error', text: '6 अंकी OTP टाका' }); return }
    setLoading(true); setMsg(null)
    try {
      const r = await api.post('/api/auth-otp/verify', { email: sentTo, otp: code })
      const { token, user } = r.data

      if (user.type === 'admin') {
        localStorage.setItem('admin_token', token)
        localStorage.setItem('admin_user', JSON.stringify({ name: user.name, email: user.email, role: 'superadmin' }))
        setMsg({ type: 'success', text: 'Admin login यशस्वी! Redirect करत आहे…' })
        setTimeout(() => nav('/'), 400)
      } else {
        // Client — pass token via URL (different port = different localStorage)
        setMsg({ type: 'info', text: 'Client account detected. Client dashboard वर पाठवत आहोत…' })
        const host = window.location.hostname
        const base = window.location.port === '8091'
          ? window.location.protocol + '//' + host + ':8081'
          : window.location.origin
        const clientUrl = base + '/login?token=' + encodeURIComponent(token)
        setTimeout(() => { window.location.href = clientUrl }, 900)
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'OTP चुकीचा' })
    } finally { setLoading(false) }
  }

  const onOtpChange = (i: number, v: string) => {
    v = v.replace(/\D/g, '').slice(0, 1)
    const copy = [...otp]; copy[i] = v; setOtp(copy)
    if (v && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    if (e.key === 'Enter') verifyOtp()
  }
  const onOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length) {
      setOtp(text.split('').concat(Array(6 - text.length).fill('')).slice(0, 6))
      otpRefs.current[Math.min(text.length, 5)]?.focus()
      e.preventDefault()
    }
  }

  const submitSignup = async () => {
    setMsg(null)
    if (!signup.name.trim() || !signup.email.trim()) {
      setMsg({ type: 'error', text: 'Name आणि Email आवश्यक' }); return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(signup.email)) {
      setMsg({ type: 'error', text: 'Valid email टाका' }); return
    }
    setLoading(true)
    try {
      const r = await api.post('/api/signup/request', signup)
      setMode('signup-done')
      setMsg({ type: 'success', text: r.data.message || 'Signup request पाठवला!' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Signup fail' })
    } finally { setLoading(false) }
  }

  const resetSignin = () => { setMode('signin-email'); setOtp(['','','','','','']); setMsg(null) }

  return (
    <div className={s.root}>
      <aside className={s.left}>
        <div className={s.brandRow}>
          <div className={s.brandIcon}><VehicleBusRegular style={{ fontSize: 22 }} /></div>
          <span className={s.brandName}>GM Bus Platform</span>
        </div>

        <div className={s.hero}>
          <div className={s.heroTitle}>Fleet intelligence,<br/>simplified.</div>
          <div className={s.heroSub}>
            Multi-tenant bus tracking, driver management, live GPS, and route analytics — all in one place.
          </div>
          <div className={s.featureList}>
            <div className={s.feature}><div className={s.featureIcon}><VehicleBusRegular /></div><span>Real-time bus tracking &amp; route management</span></div>
            <div className={s.feature}><div className={s.featureIcon}><PeopleTeamRegular /></div><span>Drivers, users &amp; role-based access</span></div>
            <div className={s.feature}><div className={s.featureIcon}><ChartMultipleRegular /></div><span>Trips, utilization &amp; performance reports</span></div>
            <div className={s.feature}><div className={s.featureIcon}><ShieldCheckmarkRegular /></div><span>Tenant isolation, OTP login &amp; audit logs</span></div>
          </div>
        </div>

        <div className={s.footerNote}>© {new Date().getFullYear()} GM Media — Bus Tracking Platform</div>
      </aside>

      <main className={s.right}>
        <div className={s.card}>
          <TabList
            className={s.tabs}
            selectedValue={tab}
            onTabSelect={(_, d) => {
              setTab(d.value as 'signin' | 'signup')
              setMode(d.value === 'signin' ? 'signin-email' : 'signup')
              setMsg(null)
            }}
          >
            <Tab value="signin">Sign In</Tab>
            <Tab value="signup">Create Account</Tab>
          </TabList>

          {tab === 'signin' && mode === 'signin-email' && (
            <>
              <Text className={s.title}>Welcome back</Text>
              <Text className={s.subtitle}>Email &amp; password द्या — 6-अंकी code पाठवू.</Text>
              {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
              <Field label="Email" className={s.field} required>
                <Input value={email} onChange={(_, d) => setEmail(d.value)} placeholder="you@company.com" type="email" contentBefore={<MailRegular />} />
              </Field>
              <Field label="Password" className={s.field} required>
                <Input
                  value={password}
                  onChange={(_, d) => setPassword(d.value)}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  contentBefore={<LockClosedRegular />}
                  contentAfter={<Button appearance="transparent" size="small" icon={showPw ? <EyeOffRegular /> : <EyeRegular />} onClick={() => setShowPw(v => !v)} />}
                  onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                />
              </Field>
              <Button
                appearance="primary" className={s.submitBtn} disabled={loading} onClick={sendOtp}
                icon={loading ? <Spinner size="tiny" /> : <ArrowRightRegular />} iconPosition="after"
              >
                {loading ? 'OTP पाठवत आहे…' : 'Send OTP'}
              </Button>
              <div className={s.hint}>
                पहिल्यांदा? <span className={s.link} onClick={() => { setTab('signup'); setMode('signup') }}>Account तयार करा</span>
              </div>
            </>
          )}

          {tab === 'signin' && mode === 'signin-otp' && (
            <>
              <button className={s.backBtn} onClick={resetSignin}><ArrowLeftRegular /> Back</button>
              <Text className={s.title}>Enter OTP</Text>
              <Text className={s.subtitle}>6-अंकी code पाठवला → <span className={s.email}>{sentTo}</span></Text>
              {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
              <div className={s.otpRow}>
                {otp.map((v, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    className={s.otpBox + ' ' + (v ? s.otpFilled : '')}
                    value={v}
                    onChange={e => onOtpChange(i, e.target.value)}
                    onKeyDown={e => onOtpKey(i, e)}
                    onPaste={onOtpPaste}
                    inputMode="numeric"
                    maxLength={1}
                  />
                ))}
              </div>
              <Button
                appearance="primary" className={s.submitBtn}
                disabled={loading || otp.join('').length !== 6}
                onClick={verifyOtp}
                icon={loading ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
              >
                {loading ? 'Verify करत आहे…' : 'Verify & Sign In'}
              </Button>
              <div className={s.resendRow}>
                Code मिळाला नाही?{' '}
                {secs > 0
                  ? <span style={{ color: '#9ca3af' }}>{secs}s मध्ये पुन्हा</span>
                  : <span className={s.link} onClick={sendOtp}>पुन्हा पाठवा</span>}
              </div>
            </>
          )}

          {tab === 'signup' && mode !== 'signup-done' && (
            <>
              <Text className={s.title}>Create your account</Text>
              <Text className={s.subtitle}>Company details भरा — 24-48 तासांत admin approve करेल.</Text>
              {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}
              <div className={s.row2}>
                <Field label="Full Name *" className={s.field}>
                  <Input value={signup.name} onChange={(_, d) => setSignup({ ...signup, name: d.value })} placeholder="Gaurav Rathod" contentBefore={<PersonRegular />} />
                </Field>
                <Field label="Phone" className={s.field}>
                  <Input value={signup.phone} onChange={(_, d) => setSignup({ ...signup, phone: d.value })} placeholder="98765 43210" contentBefore={<PhoneRegular />} />
                </Field>
              </div>
              <Field label="Email *" className={s.field} required>
                <Input value={signup.email} onChange={(_, d) => setSignup({ ...signup, email: d.value })} placeholder="you@company.com" type="email" contentBefore={<MailRegular />} />
              </Field>
              <Field label="Company / Bus Service" className={s.field}>
                <Input value={signup.company_name} onChange={(_, d) => setSignup({ ...signup, company_name: d.value })} placeholder="GM Bus Service" contentBefore={<BuildingRegular />} />
              </Field>
              <div className={s.row2}>
                <Field label="City" className={s.field}>
                  <Input value={signup.city} onChange={(_, d) => setSignup({ ...signup, city: d.value })} placeholder="Nashik" contentBefore={<LocationRegular />} />
                </Field>
                <Field label="PIN Code" className={s.field}>
                  <Input value={signup.pincode} onChange={(_, d) => setSignup({ ...signup, pincode: d.value })} placeholder="422001" />
                </Field>
              </div>
              <Field label="GSTIN (optional)" className={s.field}>
                <Input value={signup.gstin} onChange={(_, d) => setSignup({ ...signup, gstin: d.value })} placeholder="27AAECG1234A1Z5" />
              </Field>
              <Button
                appearance="primary" className={s.submitBtn} disabled={loading} onClick={submitSignup}
                icon={loading ? <Spinner size="tiny" /> : <ArrowRightRegular />} iconPosition="after"
              >
                {loading ? 'पाठवत आहे…' : 'Submit Request'}
              </Button>
              <div className={s.hint}>
                आधीच account आहे? <span className={s.link} onClick={() => { setTab('signin'); setMode('signin-email') }}>Sign in</span>
              </div>
            </>
          )}

          {mode === 'signup-done' && (
            <div className={s.successWrap}>
              <div className={s.successIcon}>✅</div>
              <Text className={s.title}>Request मिळाला!</Text>
              <Text className={s.subtitle} style={{ marginBottom: 20 }}>
                आमचा team 24-48 तासांत review करेल. Approve झाल्यावर login details email वर येतील.
              </Text>
              <Button appearance="primary" onClick={() => { setTab('signin'); setMode('signin-email'); setMsg(null) }}>
                Sign In वर जा
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
