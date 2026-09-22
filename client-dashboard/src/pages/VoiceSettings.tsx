import { useEffect, useState } from 'react'
import { Button, Card, Spinner, Field, Input, MessageBar, MessageBarBody,
  makeStyles, Text, Switch, Divider, Checkbox } from '@fluentui/react-components'
import { SaveRegular, Speaker2Regular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px', maxWidth: '700px', marginBottom: '16px' },
  field: { marginBottom: '20px' },
  checkboxGroup: { display: 'flex', gap: '24px', marginTop: '12px' },
})

export default function VoiceSettings() {
  const styles = useStyles()
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [languages, setLanguages] = useState({ mr: true, gu: true, en: true, hi: false })
  const [timer, setTimer] = useState(15)
  const [speed, setSpeed] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api.get('/api/settings/voice')
      .then((r: any) => {
        const data = r.data
        if (data.voice_language) {
          const langs = data.voice_language.split(',')
          setLanguages({
            mr: langs.includes('mr'),
            gu: langs.includes('gu'),
            en: langs.includes('en'),
            hi: langs.includes('hi'),
          })
          // Detect auto mode (all 3 enabled)
          const count = ['mr', 'gu', 'en'].filter(l => langs.includes(l)).length
          setMode(count === 3 ? 'auto' : 'manual')
        }
        if (data.announcement_timer) setTimer(data.announcement_timer)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const selected = Object.entries(languages).filter(([_, v]) => v).map(([k]) => k)
      if (selected.length === 0) {
        setMsg({ type: 'error', text: 'कमीत कमी एक भाषा select करा' })
        setSaving(false)
        return
      }
      await api.put('/api/settings/voice', {
        voice_mode: mode,
        voice_languages: selected.join(','),
        announcement_timer: timer,
        voice_speed: speed,
      })
      setMsg({ type: 'success', text: '✅ Voice settings saved!' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    } finally { setSaving(false) }
  }

  const testVoice = () => {
    const selected = Object.entries(languages).filter(([_, v]) => v).map(([k]) => k)
    const stopNames: Record<string, string> = {
      mr: 'शिवाजी नगर',
      gu: 'શિવાજી નગર',
      en: 'Shivaji Nagar',
      hi: 'शिवाजी नगर',
    }
    selected.forEach((lang, i) => {
      setTimeout(() => {
        const text = stopNames[lang] || 'Test Stop'
        const utterance = new SpeechSynthesisUtterance(`Next stop ${text}`)
        utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
        speechSynthesis.speak(utterance)
      }, i * 3000)
    })
  }

  if (loading) return <Layout title="Voice Settings"><div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div></Layout>

  return (
    <Layout title="Voice Settings">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <Text size={500} weight="semibold">🔊 Announcement Mode</Text>
        <Divider style={{ margin: '16px 0' }} />
        
        <Field className={styles.field}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Switch 
              checked={mode === 'auto'} 
              onChange={(_, d) => setMode(d.checked ? 'auto' : 'manual')}
              label={mode === 'auto' ? '🤖 Auto Mode (सर्व भाषा)' : '✋ Manual Mode (select करा)'}
            />
          </div>
          <Text size={200} style={{ marginTop: '8px', color: '#666' }}>
            {mode === 'auto' 
              ? 'प्रत्येक stop वर Marathi → Gujarati → English announcements एकत्र play होतील'
              : 'खाली निवडलेल्या भाषांमध्येच announcement play होईल'}
          </Text>
        </Field>

        <Divider style={{ margin: '16px 0' }} />

        <Field label="भाषा निवडा (Languages)">
          <div className={styles.checkboxGroup}>
            <Checkbox 
              checked={languages.mr} 
              onChange={(_, d) => setLanguages({ ...languages, mr: !!d.checked })}
              label="मराठी (Marathi)"
            />
            <Checkbox 
              checked={languages.gu} 
              onChange={(_, d) => setLanguages({ ...languages, gu: !!d.checked })}
              label="ગુજરાતી (Gujarati)"
            />
            <Checkbox 
              checked={languages.en} 
              onChange={(_, d) => setLanguages({ ...languages, en: !!d.checked })}
              label="English"
            />
            <Checkbox 
              checked={languages.hi} 
              onChange={(_, d) => setLanguages({ ...languages, hi: !!d.checked })}
              label="हिंदी (Hindi)"
            />
          </div>
        </Field>

        <Divider style={{ margin: '16px 0' }} />

        <Field label="⏱️ Announcement Timer (seconds before stop)" className={styles.field}>
          <Input 
            type="number" 
            value={String(timer)} 
            onChange={(_, d) => setTimer(parseInt(d.value) || 15)}
            contentBefore={<Text>15 sec before →</Text>}
          />
          <Text size={200} style={{ marginTop: '8px', color: '#666' }}>
            बस stop पासून किती सेकंद आधी announcement play करायचा
          </Text>
        </Field>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button appearance="secondary" icon={<Speaker2Regular />} onClick={testVoice}>
            🔊 Test Voice
          </Button>
        </div>
      </Card>

      <Card className={styles.card}>
        <Text size={500} weight="semibold">📋 Preview</Text>
        <Divider style={{ margin: '16px 0' }} />
        <Text style={{ lineHeight: '1.8' }}>
          <b>Mode:</b> {mode === 'auto' ? '🤖 Auto (सर्व भाषा)' : '✋ Manual'}<br/>
          <b>Languages:</b> {Object.entries(languages).filter(([_, v]) => v).map(([k]) => k).join(', ').toUpperCase()}<br/>
          <b>Timer:</b> {timer} seconds before stop<br/>
          <b>Announcement sequence:</b><br/>
          {mode === 'auto' && languages.mr && <span>1. 🗣️ मराठी → "पुढील थांबा ... कृपया तयार राहा."<br/></span>}
          {mode === 'auto' && languages.gu && <span>2. 🗣️ ગુજરાતી → "આગળનું સ્ટોપ ..."<br/></span>}
          {mode === 'auto' && languages.en && <span>3. 🗣️ English → "Next stop ... Please be ready."<br/></span>}
          {mode === 'manual' && Object.entries(languages).filter(([_, v]) => v).map(([k], i) => (
            <span key={k}>{i + 1}. 🗣️ {k.toUpperCase()} announcement<br/></span>
          ))}
        </Text>
      </Card>
    </Layout>
  )
}
