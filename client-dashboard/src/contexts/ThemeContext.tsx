import { createContext, useContext, useState, useEffect } from 'react'
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components'

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => { localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark])
  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <FluentProvider theme={dark ? webDarkTheme : webLightTheme}>{children}</FluentProvider>
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
