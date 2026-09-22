import { useState } from 'react'
import {
  Button, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  MenuItemRadio, makeStyles, tokens,
} from '@fluentui/react-components'
import { GlobeRegular, CheckmarkRegular } from '@fluentui/react-icons'
import { useLanguage } from '../i18n/LanguageContext'
import api from '../services/api'

const useStyles = makeStyles({
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    background: 'white',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    ':hover': { background: tokens.colorNeutralBackground2 },
  },
  flag: { fontSize: '16px' },
  menuItem: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' },
})

const LANGS = [
  { code: 'en', flag: '🇬🇧', name: 'English', native: 'English' },
  { code: 'mr', flag: '🇮🇳', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', flag: '🇮🇳', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'hi', flag: '🇮🇳', name: 'Hindi', native: 'हिंदी' },
]

export default function LanguageSwitcher() {
  const styles = useStyles()
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  const changeLang = async (code: string) => {
    setSaving(true)
    setLang(code as any) // Instant UI change
    setOpen(false)
    try {
      // Save to backend
      await api.put('/api/auth/language', { language: code })
      // Update user in localStorage
      const userStr = localStorage.getItem('client_user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.preferred_language = code
        localStorage.setItem('client_user', JSON.stringify(user))
      }
    } catch (e) {
      console.error('Failed to save language', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Menu open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <MenuTrigger disableButtonEnhancement>
        <button className={styles.btn} disabled={saving}>
          <GlobeRegular />
          <span className={styles.flag}>{current.flag}</span>
          <span>{current.native}</span>
        </button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {LANGS.map(l => (
            <MenuItemRadio
              key={l.code}
              name="language"
              value={l.code}
              checked={lang === l.code}
              onClick={() => changeLang(l.code)}
            >
              <span className={styles.menuItem}>
                <span style={{ fontSize: '18px' }}>{l.flag}</span>
                <span style={{ fontWeight: lang === l.code ? 700 : 400 }}>{l.native}</span>
                {lang === l.code && <CheckmarkRegular style={{ marginLeft: 'auto', color: '#16a34a' }} />}
              </span>
            </MenuItemRadio>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
