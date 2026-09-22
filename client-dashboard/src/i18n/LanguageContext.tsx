import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language, TranslationKey } from './translations'

interface Ctx {
  lang: Language
  setLang: (l: Language) => void
  t: (key: TranslationKey) => string
  primaryLang: Language
}
const LanguageContext = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => translations.en[k],
  primaryLang: 'en',
})

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    // Priority 1: User's preferred_language
    const userStr = localStorage.getItem('client_user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.preferred_language && translations[user.preferred_language]) {
          setLangState(user.preferred_language)
          localStorage.setItem('ui_language', user.preferred_language)
          return
        }
      } catch {}
    }
    // Priority 2: saved ui_language
    const saved = localStorage.getItem('ui_language') as Language
    if (saved && translations[saved]) setLangState(saved)
  }, [])

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem('ui_language', l)
  }

  const t = (key: TranslationKey): string => {
    return translations[lang]?.[key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, primaryLang: lang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
