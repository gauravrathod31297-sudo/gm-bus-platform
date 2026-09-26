import React, { createContext, useCallback, useContext, useState, useEffect } from 'react'
import {
  Toast, ToastTitle, ToastBody, Toaster, useToastController, useId,
  ToastIntent,
} from '@fluentui/react-components'

type ToastFn = (title: string, body?: string) => void
interface ToastApi {
  success: ToastFn
  error: ToastFn
  info: ToastFn
  warning: ToastFn
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasterId = useId('toaster')
  const { dispatchToast } = useToastController(toasterId)

  const show = useCallback(
    (intent: ToastIntent, title: string, body?: string) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
          {body && <ToastBody>{body}</ToastBody>}
        </Toast>,
        { intent, timeout: 4000 }
      )
    },
    [dispatchToast]
  )

  const api: ToastApi = {
    success: (t, b) => show('success', t, b),
    error: (t, b) => show('error', t, b),
    info: (t, b) => show('info', t, b),
    warning: (t, b) => show('warning', t, b),
  }

  return (
    <ToastContext.Provider value={api}>
      <Toaster toasterId={toasterId} position="top-end" />
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
