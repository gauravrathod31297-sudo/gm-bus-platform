import { createContext, useContext, useState, useCallback } from 'react'
import {
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  Button, makeStyles,
} from '@fluentui/react-components'
import { WarningRegular, QuestionCircleRegular, DeleteRegular } from '@fluentui/react-icons'

export type ConfirmOpts = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>

const Ctx = createContext<ConfirmFn>(() => Promise.resolve(false))

const useStyles = makeStyles({
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginRight: 12, fontSize: 20,
  },
  dangerIcon: { background: '#fee2e2', color: '#dc2626' },
  infoIcon:   { background: '#eff6ff', color: '#2563eb' },
  msg: { fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginTop: 4 },
})

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const s = useStyles()
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null)

  const confirm: ConfirmFn = useCallback(
    (opts) => new Promise<boolean>((resolve) => setState({ opts, resolve })),
    []
  )

  const close = (v: boolean) => {
    if (state) state.resolve(v)
    setState(null)
  }

  const opts = state?.opts
  const danger = !!opts?.danger

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Dialog open={!!state} onOpenChange={(_, d) => !d.open && close(false)}>
        <DialogSurface style={{ maxWidth: 480 }}>
          <DialogBody>
            <DialogTitle
              action={
                <span className={`${s.iconWrap} ${danger ? s.dangerIcon : s.infoIcon}`}>
                  {danger ? <WarningRegular /> : <QuestionCircleRegular />}
                </span>
              }
            >
              {opts?.title || 'Confirm'}
            </DialogTitle>
            <DialogContent>
              <div className={s.msg}>{opts?.message}</div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => close(false)}>
                {opts?.cancelText || 'Cancel'}
              </Button>
              <Button
                appearance="primary"
                style={danger ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } : undefined}
                icon={danger ? <DeleteRegular /> : undefined}
                onClick={() => close(true)}
              >
                {opts?.confirmText || 'Confirm'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Ctx.Provider>
  )
}

export function useConfirm() { return useContext(Ctx) }
