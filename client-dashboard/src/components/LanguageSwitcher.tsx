import { useState } from 'react'
import {
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  makeStyles, tokens,
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
  menuItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '180px',
    justifyContent: 'space-between',
  },
  leftSide: { display: 'flex', alignItems: 'center', gap: '10px' },
})

const LANGS = [
  { code: 'en', flag: '🇬🇧', native: 'English' },
  { code: 'mr', flag: '🇮🇳', native: 'मराठी' },
  { code: 'gu', flag: '🇮🇳', native: 'ગુજરાતી' },
  { code: 'hi', flag: '🇮🇳', native: 'हिंदी' },
]

export default function LanguageSwitcher() {
  const styles = useStyles()
  const { lang, setLang } = useLanguage()
  const [saving, setSaving] = useState(false)

  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  const changeLang = async (code: string) => {
    setSaving(true)
    setLang(code as any)
    try {
      await api.put('/api/auth/language', { language: code })
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
    <Menu>
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
            <MenuItem
              key={l.code}
              onClick={() => changeLang(l.code)}
            >
              <div className={styles.menuItemContent}>
                <span className={styles.leftSide}>
                  <span style={{ fontSize: '18px' }}>{l.flag}</span>
                  <span style={{ fontWeight: lang === l.code ? 700 : 400 }}>{l.native}</span>
                </span>
                {lang === l.code && (
                  <CheckmarkRegular style={{ color: '#16a34a', fontSize: '16px' }} />
                )}
              </div>
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
