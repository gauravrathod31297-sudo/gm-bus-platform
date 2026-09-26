import { useEffect } from 'react'

export function useKeyboardShortcut(key: string, ctrl: boolean, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase() && (!ctrl || e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, ctrl, callback])
}
