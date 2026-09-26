import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { FluentProvider, webLightTheme, webDarkTheme, Theme } from '@fluentui/react-components'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
})

export const useThemeMode = () => useContext(ThemeContext)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('gm_admin_theme')
    return (saved === 'dark' || saved === 'light') ? saved : 'light'
  })

  useEffect(() => {
    localStorage.setItem('gm_admin_theme', mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const toggle = () => setMode(m => m === 'light' ? 'dark' : 'light')
  const theme: Theme = mode === 'dark' ? webDarkTheme : webLightTheme

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <FluentProvider theme={theme}>{children}</FluentProvider>
    </ThemeContext.Provider>
  )
}
