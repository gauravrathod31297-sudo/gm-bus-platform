import { useEffect, useState, useRef } from 'react'
import { Button, Card, Field, Input, Spinner, makeStyles, tokens, Text, Divider, Dropdown, Option, MessageBar, MessageBarBody, Badge, RadioGroup, Radio, Switch, TabList, Tab, Slider } from '@fluentui/react-components'
import { Speaker2Regular, SaveRegular, ArrowDownloadRegular, PlayRegular, CheckmarkCircleRegular } from '@fluentui/react-icons'
import api from '../../services/api'
import SettingsLayout from '../../components/SettingsLayout'

const useStyles = makeStyles({
  card: { padding: '24px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, maxWidth: '900px' },
  field: { marginBottom: '16px' },
  helpBox: { background: '#eff6ff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#1e40af', marginTop: '8px', border: '1px solid #bfdbfe' },
  previewBox: { background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', padding: '16px', borderRadius: '10px', border: '1px solid #7dd3fc', marginTop: '12px' },
  proTip: { background: '#f0fdf4', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#166534', border: '1px solid #bbf7d0', marginTop: '8px' },
  typeCard: { padding: '16px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  typeCardActive: { border: '1px solid #2563eb', background: '#f8faff' },
  typeIcon: { fontSize: '24px', width: '40px', textAlign: 'center' as const },
  typeContent: { flex: 1 },
  typeTitle: { fontWeight: 600, fontSize: '14px', marginBottom: '2px' },
  typeDesc: { fontSize: '12px', color: '#6b7280' },
  typePreview: { fontSize: '12px', color: '#0369a1', marginTop: '4px', fontStyle: 'italic' as const },
})

// All announcement types used by professional bus companies
const ANNOUNCEMENT_TYPES = {
  next_stop: {
    icon: '📍',
    label: 'Next Stop (with deboard)',
    desc: 'Trigger before arriving at stop',
    templates: {
      mr: 'पुढील थांबा {stop}. कृपया उतरायची तयारी करा.',
      gu: 'આગળનું સ્ટોપ {stop}. કૃપા કરીને ઉતરવાની તૈયારી કરો.',
      hi: 'अगला स्टॉप {stop}. कृपया उतरने की तैयारी करें.',
      en: 'Next stop {stop}. Please prepare to deboard.',
    },
    delay: 20,
    defaultOn: true,
  },
  at_stop: {
    icon: '🛑',
    label: 'At Stop (arrival)',
    desc: 'Play when bus stops',
    templates: {
      mr: '{stop} आले आहे. कृपया उतरा.',
      gu: '{stop} આવી ગયું છે. કૃપા કરીને ઉતરો.',
      hi: '{stop} आ गया है. कृपया उतरें.',
      en: '{stop} has arrived. Please deboard.',
    },
    delay: 0,
    defaultOn: true,
  },
  welcome: {
    icon: '👋',
    label: 'Welcome (trip start)',
    desc: 'Play when bus starts',
    templates: {
      mr: 'नमस्कार. {company} मध्ये स्वागत आहे. सुखद प्रवास!',
      gu: 'નમસ્તે. {company} માં સ્વાગત છે. સુખદ પ્રવાસ!',
      hi: 'नमस्कार. {company} में स्वागत है. सुखद यात्रा!',
      en: 'Welcome to {company}. Have a pleasant journey!',
    },
    delay: 0,
    defaultOn: false,
  },
  safety: {
    icon: '🦺',
    label: 'Safety Reminder',
    desc: 'Play every 30 mins',
    templates: {
      mr: 'कृपया हँडल पकडून ठेवा. चालत्या बसमधून उतरू नका.',
      gu: 'કૃપા કરીને હેન્ડલ પકડી રાખો. ચાલતી બસમાંથી ન ઉતરો.',
      hi: 'कृपया हैंडल पकड़ें. चलती बस से न उतरें.',
      en: 'Please hold the handle. Do not deboard a moving bus.',
    },
    delay: 0,
    defaultOn: false,
  },
  terminal: {
    icon: '🏁',
    label: 'Terminal Arrival',
    desc: 'Play at final stop',
    templates: {
      mr: 'हे अंतिम थांबा आहे. कृपया उतरा. धन्यवाद!',
      gu: 'આ છેલ્લું સ્ટોપ છે. કૃપા કરીને ઉતરો. આભાર!',
      hi: 'यह अंतिम स्टॉप है. कृपया उतरें. धन्यवाद!',
      en: 'This is the terminal stop. Please deboard. Thank you!',
    },
    delay: 0,
    defaultOn: true,
  },
}

const LANGS = [
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

type TypeKey = keyof typeof ANNOUNCEMENT_TYPES
type LangKey = 'mr' | 'gu' | 'hi' | 'en'

export default function VoiceSettings() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'settings' | 'types' | 'generate' | 'library'>('types')

  // Global settings
  const [settings, setSettings] = useState({
    enabled: true,
    langOrder: ['mr', 'hi', 'gu', 'en'] as LangKey[],
    trigger_seconds: 20,
    repeat_count: 1,
    voice_speed: 1.0,
    voice_volume: 1.0,
    gap_between_langs_ms: 1500,
    company_name: 'GM Bus Service',
  })

  // Per-type toggles
  const [types, setTypes] = useState<Record<TypeKey, boolean>>({
    next_stop: true, at_stop: true, welcome: false, safety: false, terminal: true,
  })

  // Generator state
  const [genType, setGenType] = useState<TypeKey>('next_stop')
  const [genLang, setGenLang] = useState<LangKey>('mr')
  const [stopName, setStopName] = useState('शिवाजी चौक')
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [genMsg, setGenMsg] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    api.get('/api/announcements/settings').then(r => {
      if (r.data) setSettings(prev => ({ ...prev, ...r.data, langOrder: r.data.langOrder || prev.langOrder }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const buildText = (typeKey: TypeKey, lang: LangKey, stop: string) => {
    const tpl = ANNOUNCEMENT_TYPES[typeKey].templates[lang]
    return tpl
      .replace(/\{stop\}/g, stop)
      .replace(/\{company\}/g, settings.company_name)
  }

  const generateMP3 = async () => {
    setGenerating(true); setGenMsg(null); setGeneratedUrl(null)
    try {
      const text = buildText(genType, genLang, stopName)
      const r = await api.post('/api/tts/generate', { text, lang: genLang })
      setGeneratedUrl(r.data.url)
      setGenMsg(`✅ Generated (${genLang}) — ${r.data.cached ? 'cached' : 'new'}`)
      setTimeout(() => { audioRef.current?.play().catch(() => {}) }, 300)
    } catch (e: any) {
      setGenMsg('❌ ' + (e.response?.data?.error || e.message))
    } finally { setGenerating(false) }
  }

  const saveAll = async () => {
    try {
      await api.put('/api/announcements/settings', { ...settings, types })
      setGenMsg('✅ All settings saved')
    } catch (e: any) {
      setGenMsg('❌ ' + (e.response?.data?.error || e.message))
    }
  }

  const moveLang = (code: LangKey, dir: -1 | 1) => {
    setSettings(prev => {
      const arr = [...prev.langOrder]
      const i = arr.indexOf(code)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= arr.length) return prev
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
      return { ...prev, langOrder: arr }
    })
  }

  if (loading) return <SettingsLayout><Spinner /></SettingsLayout>

  return (
    <SettingsLayout>
      {/* Master Toggle */}
      <Card className={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Speaker2Regular style={{ fontSize: '28px' }} />
            <div>
              <Text weight="bold" size={500}>Bus Announcement System</Text>
              <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
                Professional multi-language announcements
              </Text>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={(_, d) => setSettings({ ...settings, enabled: d.checked })}
            label={settings.enabled ? '🟢 Active' : '⚫ Disabled'}
          />
        </div>
      </Card>

      {/* Tabs */}
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, d) => setActiveTab(d.value as any)}
        style={{ marginBottom: '16px', maxWidth: '900px' }}
      >
        <Tab value="types">📢 Announcement Types</Tab>
        <Tab value="settings">⚙️ Global Settings</Tab>
        <Tab value="generate">🎙️ Generate MP3</Tab>
        <Tab value="library">📚 Library</Tab>
      </TabList>

      {/* ── TAB 1: Announcement Types ── */}
      {activeTab === 'types' && (
        <Card className={s.card}>
          <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '4px' }}>
            Announcement Types
          </Text>
          <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
            कोणती announcements bus मध्ये play व्हायची ते select करा
          </Text>

          {(Object.keys(ANNOUNCEMENT_TYPES) as TypeKey[]).map(k => {
            const t = ANNOUNCEMENT_TYPES[k]
            const active = types[k]
            return (
              <div key={k} className={`${s.typeCard} ${active ? s.typeCardActive : ''}`}>
                <div className={s.typeIcon}>{t.icon}</div>
                <div className={s.typeContent}>
                  <div className={s.typeTitle}>{t.label}</div>
                  <div className={s.typeDesc}>{t.desc}</div>
                  <div className={s.typePreview}>
                    "{buildText(k, 'mr', 'शिवाजी चौक')}"
                  </div>
                </div>
                <Switch
                  checked={active}
                  onChange={(_, d) => setTypes({ ...types, [k]: d.checked })}
                />
              </div>
            )
          })}

          <div className={s.proTip}>
            <strong>💡 Professional Setup (Big bus companies):</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
              <li>✅ <strong>Next Stop</strong> — 20 sec आधी (सगळ्यात महत्त्वाचं)</li>
              <li>✅ <strong>At Stop</strong> — थांब्यावर आल्यावर</li>
              <li>✅ <strong>Terminal</strong> — शेवटच्या थांब्यावर</li>
              <li>⚪ Welcome / Safety — optional</li>
            </ul>
          </div>

          <Button
            appearance="primary"
            icon={<SaveRegular />}
            onClick={saveAll}
            style={{ marginTop: '20px', height: '40px' }}
          >
            Save Announcement Types
          </Button>
        </Card>
      )}

      {/* ── TAB 2: Global Settings ── */}
      {activeTab === 'settings' && (
        <>
          <Card className={s.card}>
            <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '20px' }}>
              ⏱️ Timing & Trigger
            </Text>
            <Divider style={{ marginBottom: '16px' }} />

            <Field label="Trigger before stop (seconds)" className={s.field}>
              <Input
                type="number"
                value={String(settings.trigger_seconds)}
                onChange={(_, d) => setSettings({ ...settings, trigger_seconds: parseInt(d.value) || 20 })}
              />
              <Text size={100} style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Recommended: 15-30 seconds for city buses
              </Text>
            </Field>

            <Field label="Repeat count" className={s.field}>
              <Dropdown
                value={String(settings.repeat_count)}
                selectedOptions={[String(settings.repeat_count)]}
                onOptionSelect={(_, d) => setSettings({ ...settings, repeat_count: parseInt(d.optionValue as string) })}
              >
                <Option value="1" text="1x">1 time (recommended)</Option>
                <Option value="2" text="2x">2 times (for crowded buses)</Option>
                <Option value="3" text="3x">3 times (max)</Option>
              </Dropdown>
            </Field>
          </Card>

          <Card className={s.card}>
            <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '20px' }}>
              🌐 Language Sequence
            </Text>
            <Divider style={{ marginBottom: '16px' }} />

            <Text size={200} style={{ display: 'block', marginBottom: '12px', color: tokens.colorNeutralForeground3 }}>
              Bus मध्ये announcements कोणत्या क्रमाने वाजायचे
            </Text>

            {settings.langOrder.map((code, i) => {
              const l = LANGS.find(x => x.code === code)
              if (!l) return null
              return (
                <div key={code} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', border: `1px solid ${tokens.colorNeutralStroke2}`,
                  borderRadius: '8px', marginBottom: '8px'
                }}>
                  <Badge appearance="filled">{i + 1}</Badge>
                  <span style={{ fontSize: '20px' }}>{l.flag}</span>
                  <Text weight="semibold" style={{ flex: 1 }}>{l.label}</Text>
                  <Button size="small" appearance="subtle" onClick={() => moveLang(code, -1)} disabled={i === 0}>↑</Button>
                  <Button size="small" appearance="subtle" onClick={() => moveLang(code, 1)} disabled={i === settings.langOrder.length - 1}>↓</Button>
                </div>
              )
            })}

            <Field label="Gap between languages (ms)" className={s.field} style={{ marginTop: '16px' }}>
              <Input
                type="number"
                value={String(settings.gap_between_langs_ms)}
                onChange={(_, d) => setSettings({ ...settings, gap_between_langs_ms: parseInt(d.value) || 1500 })}
              />
            </Field>
          </Card>

          <Card className={s.card}>
            <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '20px' }}>
              🎚️ Voice Quality
            </Text>
            <Divider style={{ marginBottom: '16px' }} />

            <Field label={`Speed: ${settings.voice_speed}x`} className={s.field}>
              <Slider
                min={0.7} max={1.5} step={0.1}
                value={settings.voice_speed}
                onChange={(_, d) => setSettings({ ...settings, voice_speed: d.value })}
              />
            </Field>

            <Field label={`Volume: ${Math.round(settings.voice_volume * 100)}%`} className={s.field}>
              <Slider
                min={0.3} max={1.0} step={0.1}
                value={settings.voice_volume}
                onChange={(_, d) => setSettings({ ...settings, voice_volume: d.value })}
              />
            </Field>

            <Field label="Company Name (for Welcome message)" className={s.field}>
              <Input
                value={settings.company_name}
                onChange={(_, d) => setSettings({ ...settings, company_name: d.value })}
                placeholder="GM Bus Service"
              />
            </Field>
          </Card>

          <div style={{ maxWidth: '900px' }}>
            <Button appearance="primary" icon={<SaveRegular />} onClick={saveAll} style={{ height: '40px' }}>
              Save All Settings
            </Button>
          </div>
        </>
      )}

      {/* ── TAB 3: Generate MP3 ── */}
      {activeTab === 'generate' && (
        <Card className={s.card}>
          <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '8px' }}>
            🎙️ Generate Announcement MP3
          </Text>
          <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
            Real voice — Google TTS server वापरून
          </Text>
          <Divider style={{ marginBottom: '20px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className={s.field}>
            <Field label="Announcement Type">
              <Dropdown
                value={ANNOUNCEMENT_TYPES[genType].label}
                selectedOptions={[genType]}
                onOptionSelect={(_, d) => setGenType(d.optionValue as TypeKey)}
              >
                {(Object.keys(ANNOUNCEMENT_TYPES) as TypeKey[]).map(k => (
                  <Option key={k} value={k} text={ANNOUNCEMENT_TYPES[k].label}>
                    {ANNOUNCEMENT_TYPES[k].icon} {ANNOUNCEMENT_TYPES[k].label}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Language">
              <Dropdown
                value={LANGS.find(l => l.code === genLang)?.label}
                selectedOptions={[genLang]}
                onOptionSelect={(_, d) => setGenLang(d.optionValue as LangKey)}
              >
                {LANGS.map(l => <Option key={l.code} value={l.code} text={l.label}>{l.flag} {l.label}</Option>)}
              </Dropdown>
            </Field>
          </div>

          <Field label="Stop Name (uses in template)" className={s.field}>
            <Input value={stopName} onChange={(_, d) => setStopName(d.value)} placeholder="शिवाजी चौक" />
          </Field>

          <div className={s.previewBox}>
            <Text size={100} style={{ color: '#0369a1', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📢 Preview ({genLang})
            </Text>
            <Text style={{ color: '#0c4a6e', display: 'block', fontSize: '20px', fontWeight: 600, lineHeight: 1.4 }}>
              {buildText(genType, genLang, stopName)}
            </Text>
          </div>

          <Button
            appearance="primary"
            icon={<Speaker2Regular />}
            onClick={generateMP3}
            disabled={generating}
            style={{ width: '100%', height: '44px', marginTop: '16px', fontSize: '15px' }}
          >
            {generating ? '⏳ Generating...' : '🔊 Generate MP3'}
          </Button>

          {genMsg && (
            <MessageBar intent={genMsg.startsWith('✅') ? 'success' : 'error'} style={{ marginTop: '12px' }}>
              <MessageBarBody>{genMsg}</MessageBarBody>
            </MessageBar>
          )}

          {generatedUrl && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <audio ref={audioRef} controls src={generatedUrl} style={{ width: '100%', marginBottom: '8px' }} />
              <Button as="a" href={generatedUrl} download icon={<ArrowDownloadRegular />} size="small" appearance="outline">
                Download MP3
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 4: Library ── */}
      {activeTab === 'library' && (
        <Card className={s.card}>
          <Text weight="semibold" size={500} style={{ display: 'block', marginBottom: '8px' }}>
            📚 Announcement Library
          </Text>
          <Text size={200} style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3 }}>
            आत्तापर्यंत generate केलेले सगळे MP3 files
          </Text>
          <Divider style={{ marginBottom: '20px' }} />

          <div className={s.proTip}>
            <strong>📋 सध्याची files:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
              <li>प्रत्येक <strong>type × language</strong> combination साठी एक MP3</li>
              <li>Bus app मध्ये <code>/audio/tts_*.mp3</code> URL वापरून play करता येतं</li>
              <li>Same text + lang पुन्हा generate केल्यास <strong>cached</strong> मिळते</li>
            </ul>
          </div>

          <div style={{ marginTop: '16px' }}>
            <Button
              appearance="outline"
              onClick={async () => {
                try {
                  const r = await api.get('/api/tts/list')
                  setGenMsg(`✅ ${r.data.count} MP3 files available`)
                } catch (e: any) { setGenMsg('❌ ' + e.message) }
              }}
            >
              🔄 Refresh Library
            </Button>
          </div>
        </Card>
      )}

      {/* Save button (persistent) */}
      <div style={{ maxWidth: '900px', marginTop: '20px' }}>
        <Button appearance="primary" icon={<SaveRegular />} onClick={saveAll} style={{ height: '40px' }}>
          Save All Settings
        </Button>
      </div>
    </SettingsLayout>
  )
}
