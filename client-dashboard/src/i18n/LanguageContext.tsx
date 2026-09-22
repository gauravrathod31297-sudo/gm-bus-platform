import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language, TranslationKey } from './translations'

interface Ctx { lang: Language; setLang: (l: Language) => void; t: (key: TranslationKey) => string }
const LanguageContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => translations.en[k] })

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Language>('en')
  useEffect(() => {
    const saved = localStorage.getItem('ui_language') as Language
    if (saved && translations[saved]) setLangState(saved)
  }, [])
  const setLang = (l: Language) => { setLangState(l); localStorage.setItem('ui_language', l) }
  const t = (key: TranslationKey): string => translations[lang]?.[key] || translations.en[key] || key
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}
export const useLanguage = () => useContext(LanguageContext)
