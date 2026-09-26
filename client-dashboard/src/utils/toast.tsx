import { Toaster, Toast, useToastController, useId } from '@fluentui/react-components'

let globalToast: any = null

export function ToastProvider() {
  const toasterId = useId('toaster')
  const { dispatchToast } = useToastController(toasterId)
  globalToast = dispatchToast
  return <Toaster toasterId={toasterId} position="top-end" />
}

export const showToast = (title: string, body: string, intent: 'success' | 'error' | 'warning' = 'success') => {
  if (globalToast) globalToast(
    <Toast><div><strong>{title}</strong><br /><small>{body}</small></div></Toast>,
    { intent, timeout: 3000 }
  )
}
