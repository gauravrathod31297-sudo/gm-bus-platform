import { useState } from 'react'
import { Button, Card, Field, Input, Textarea, MessageBar, MessageBarBody, makeStyles, tokens, Text } from '@fluentui/react-components'
import api from '../services/api'

const useStyles = makeStyles({
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg,#eff6ff,#e0f2fe)' },
  card: { padding: '32px', borderRadius: '16px', maxWidth: '540px', width: '100%' },
  title: { display: 'block', marginBottom: '4px', fontWeight: 700 },
  sub: { display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3, fontSize: '14px' },
  field: { marginBottom: '14px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  submit: { width: '100%', height: '44px', marginTop: '8px', fontSize: '15px' },
})

export default function SignUp() {
  const s = useStyles()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success'|'error'; text: string } | null>(null)
  const [form, setForm] = useState({ name:'', email:'', phone:'', company_name:'', address:'', city:'', pincode:'', gstin:'', message:'' })

  const submit = async () => {
    if (!form.name || !form.email) { setMsg({type:'error', text:'Name आणि Email आवश्यक'}); return }
    setLoading(true); setMsg(null)
    try {
      const r = await api.post('/api/signup/request', form)
      setSuccess(true)
      setMsg({type:'success', text: r.data.message || 'Signup request यशस्वी!'})
    } catch (e:any) {
      setMsg({type:'error', text: e.response?.data?.error || e.message})
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className={s.wrap}>
      <Card className={s.card}>
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <div style={{ fontSize:'64px', marginBottom:'16px' }}>✅</div>
          <Text size={600} weight="bold" style={{ display:'block', marginBottom:'12px' }}>Signup Request मिळाला!</Text>
          <Text style={{ display:'block', color:tokens.colorNeutralForeground3, lineHeight:1.6, marginBottom:'20px' }}>
            आमचा team 24-48 तासांत review करेल. Approve झाल्यावर तुमच्या email वर login details येतील.
          </Text>
          <Button appearance="primary" onClick={() => location.href='/login'}>Login page वर जा</Button>
        </div>
      </Card>
    </div>
  )

  return (
    <div className={s.wrap}>
      <Card className={s.card}>
        <Text size={600} className={s.title}>Create Account</Text>
        <Text className={s.sub}>GM Bus Service मध्ये नवीन account तयार करा</Text>

        {msg && <MessageBar intent={msg.type} style={{ marginBottom:'16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

        <Field label="Full Name *" className={s.field}><Input value={form.name} onChange={(_,d)=>setForm({...form,name:d.value})} placeholder="Gaurav Rathod" /></Field>
        <Field label="Email *" className={s.field}><Input type="email" value={form.email} onChange={(_,d)=>setForm({...form,email:d.value})} placeholder="you@example.com" /></Field>
        <Field label="Phone" className={s.field}><Input value={form.phone} onChange={(_,d)=>setForm({...form,phone:d.value})} placeholder="+91 9876543210" /></Field>
        <Field label="Company / Bus Service" className={s.field}><Input value={form.company_name} onChange={(_,d)=>setForm({...form,company_name:d.value})} placeholder="GM Bus Service" /></Field>
        <div className={s.row2} style={{ marginBottom:'14px' }}>
          <Field label="City"><Input value={form.city} onChange={(_,d)=>setForm({...form,city:d.value})} /></Field>
          <Field label="Pincode"><Input value={form.pincode} onChange={(_,d)=>setForm({...form,pincode:d.value})} /></Field>
        </div>
        <Field label="Address" className={s.field}><Textarea value={form.address} onChange={(_,d)=>setForm({...form,address:d.value})} rows={2} /></Field>
        <Field label="GSTIN (optional)" className={s.field}><Input value={form.gstin} onChange={(_,d)=>setForm({...form,gstin:d.value})} placeholder="27AABCU9603R1ZM" /></Field>
        <Field label="Message (optional)" className={s.field}><Textarea value={form.message} onChange={(_,d)=>setForm({...form,message:d.value})} rows={2} /></Field>

        <Button appearance="primary" className={s.submit} onClick={submit} disabled={loading}>
          {loading ? 'Sending...' : 'Signup Request पाठवा'}
        </Button>

        <div style={{ textAlign:'center', marginTop:'16px' }}>
          <a href="/login" style={{ color: tokens.colorBrandForeground1, fontSize: '14px' }}>आधीच account आहे? Login करा</a>
        </div>
      </Card>
    </div>
  )
}
