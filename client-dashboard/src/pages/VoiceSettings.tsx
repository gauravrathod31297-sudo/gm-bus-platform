import { useEffect, useState, useRef } from 'react'
import { Button, Card, Spinner, Field, Select, MessageBar, MessageBarBody, Switch, Divider, makeStyles, tokens, Text, Slider, Badge } from '@fluentui/react-components'
import { SaveRegular, Speaker2Regular, PlayRegular, PauseRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'
import { useLanguage } from '../i18n/LanguageContext'
import { showToast } from '../utils/toast'

const useStyles = makeStyles({
  card: { padding: '24px', maxWidth: '720px', marginBottom: '16px' },
  field: { marginBottom: '20px' },
  player: { background: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', border: `1px solid ${tokens.colorNeutralStroke2}` },
  playerText: { flex: 1, fontSize: '13px' },
  playBtn: { width: '40px', height: '40px', minWidth: '40px', borderRadius: '50%' },
  ruleBox: { background: '#eff6ff', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#1e40af', marginTop: '8px', border: '1px solid #bfdbfe' },
})

const LANG_ORDER: Record<string, string[]> = {
  en: ['en'],
  hi: ['hi', 'en'],
  gu: ['gu', 'hi', 'en'],
  mr: ['mr', 'hi', 'en'],
}

const LANG_NAMES: Record<string, string> = {
  en: '🇬🇧 English',
  hi: '🇮🇳 हिंदी',
  gu: '🇮🇳 ગુજરાતી',
  mr: '🇮🇳 मराठी',
}

const LANG_TTS: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN', mr: 'mr-IN',
}

const SAMPLE_STOPS: Record<string, string> = {
  en: 'Shivaji Nagar',
  hi: 'शिवाजी नगर',
  gu: 'શિવાજી નગર',
  mr: 'शिवाजी नगर',
}

export default function VoiceSettings() {
  const s = useStyles()
  const { t } = useLanguage()
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [timer, setTimer] = useState(15)
  const [speed, setSpeed] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')
  const primaryLang = (user.preferred_language || 'en') as 'en' | 'mr' | 'gu' | 'hi'
  const langOrder = LANG_ORDER[primaryLang] || ['en']

  useEffect(() => {
    api.get('/api/settings/voice').then(r => {
      const d = r.data
      if (d.voice_mode) setMode(d.voice_mode)
      if (d.announcement_timer) setTimer(d.announcement_timer)
      if (d.voice_speed) setSpeed(parseFloat(d.voice_speed))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      await api.put('/api/settings/voice', {
        voice_mode: mode,
        voice_languages: langOrder.join(','),
        announcement_timer: timer,
        voice_speed: speed,
      })
      showToast(t('success'), t('saved'))
      setMsg({ type: 'success', text: '✅ ' + t('saved') })
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setSaving(false) }
  }

  const testVoice = async () => {
    setTesting(true)
    // Speech Synthesis API (browser TTS)
    for (const lang of langOrder) {
      const text = lang === 'en' ? `Next stop ${SAMPLE_STOPS.en}. Please be ready.`
        : lang === 'hi' ? `अगला स्टॉप ${SAMPLE_STOPS.hi}. कृपया तैयार रहें.`
        : lang === 'gu' ? `આગળનું સ્ટોપ ${SAMPLE_STOPS.gu}. કૃપા કરીને તૈયાર રહો.`
        : `पुढील थांबा ${SAMPLE_STOPS.mr}. कृपया तयार राहा.`
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = LANG_TTS[lang]
        u.rate = speed
        u.onend = () => resolve()
        u.onerror = () => resolve()
        window.speechSynthesis.speak(u)
      })
      // Small pause between languages
      await new Promise(r => setTimeout(r, 500))
    }
    setTesting(false)
  }

  if (loading) return <Layout title={t('voiceSettings')}><Spinner /></Layout>

  return (
    <Layout title={t('voiceSettings')}>
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px', maxWidth: '720px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        <Text size={500} weight="semibold">🔊 {t('announcementMode')}</Text>
        <Divider style={{ margin: '16px 0' }} />

        <Field label="Mode" className={s.field}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Switch checked={mode === 'auto'} onChange={(_, d) => setMode(d.checked ? 'auto' : 'manual')} label={mode === 'auto' ? '🤖 Auto (15s before stop)' : '✋ Manual'} />
          </div>
        </Field>

        <Field label={t('selectLanguages')} className={s.field}>
          <div className={s.ruleBox}>
            <strong>🌐 Rule based on client language: {LANG_NAMES[primaryLang]}</strong>
            <div style={{ marginTop: '8px' }}>
              Announcements will play in: {langOrder.map(l => LANG_NAMES[l]).join(' → ')}
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.7 }}>
              (Admin ने तुमची भाषा DB मध्ये सेट केली आहे)
            </div>
          </div>
        </Field>

        <Field label={t('announcementTimer')} className={s.field}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Slider min={5} max={60} step={5} value={timer} onChange={(_, d) => setTimer(d.value)} style={{ flex: 1 }} />
            <Badge appearance="filled" color="brand">{timer}s</Badge>
          </div>
          <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
            Stop पासून {timer} सेकंद आधी announcement
          </div>
        </Field>

        <Field label="Voice Speed" className={s.field}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Slider min={0.5} max={2.0} step={0.1} value={speed} onChange={(_, d) => setSpeed(d.value)} style={{ flex: 1 }} />
            <Badge appearance="filled">{speed.toFixed(1)}x</Badge>
          </div>
        </Field>
      </Card>

      <Card className={s.card}>
        <Text size={500} weight="semibold">🎧 Preview Player</Text>
        <Divider style={{ margin: '16px 0' }} />
        <Text style={{ fontSize: '13px', color: tokens.colorNeutralForeground3 }}>
          Sample announcement ऐका (जसा bus मध्ये play होईल)
        </Text>

        <div className={s.player}>
          <Button
            className={s.playBtn}
            appearance="primary"
            icon={testing ? <PauseRegular /> : <PlayRegular />}
            onClick={testVoice}
            disabled={testing}
          />
          <div className={s.playerText}>
            <strong>{testing ? '🔊 Playing...' : t('testVoice')}</strong>
            <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
              Sequence: {langOrder.join(' → ')}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Text weight="semibold" size={300}>Sample text:</Text>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
            {langOrder.map(l => (
              <li key={l} style={{ marginBottom: '4px' }}>
                <strong>{LANG_NAMES[l]}:</strong>{' '}
                {l === 'en' && `Next stop ${SAMPLE_STOPS.en}. Please be ready.`}
                {l === 'hi' && `अगला स्टॉप ${SAMPLE_STOPS.hi}. कृपया तैयार रहें.`}
                {l === 'gu' && `આગળનું સ્ટોપ ${SAMPLE_STOPS.gu}. કૃપા કરીને તૈયાર રહો.`}
                {l === 'mr' && `पुढील थांबा ${SAMPLE_STOPS.mr}. कृपया तयार राहा.`}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div style={{ maxWidth: '720px', display: 'flex', gap: '12px' }}>
        <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Saving...' : t('save')}
        </Button>
        <Button appearance="outline" icon={<Speaker2Regular />} onClick={testVoice} disabled={testing}>
          {t('testVoice')}
        </Button>
      </div>
    </Layout>
  )
}
