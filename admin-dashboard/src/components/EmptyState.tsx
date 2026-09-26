import { makeStyles, tokens, Button } from '@fluentui/react-components'
import type { ReactNode } from 'react'

const useStyles = makeStyles({
  wrap: {
    padding: '60px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    textAlign: 'center',
  },
  icon: {
    width: 64, height: 64, borderRadius: 16,
    background: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28,
  },
  title: { fontSize: 16, fontWeight: 600, color: tokens.colorNeutralForeground1 },
  desc: { fontSize: 13.5, color: tokens.colorNeutralForeground3, maxWidth: 420, lineHeight: 1.6 },
  actions: { display: 'flex', gap: 8, marginTop: 8 },
})

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, onAction, secondaryLabel, onSecondary }: Props) {
  const s = useStyles()
  return (
    <div className={s.wrap}>
      {icon && <div className={s.icon}>{icon}</div>}
      <div className={s.title}>{title}</div>
      {description && <div className={s.desc}>{description}</div>}
      {(actionLabel || secondaryLabel) && (
        <div className={s.actions}>
          {actionLabel && onAction && <Button appearance="primary" onClick={onAction}>{actionLabel}</Button>}
          {secondaryLabel && onSecondary && <Button appearance="secondary" onClick={onSecondary}>{secondaryLabel}</Button>}
        </div>
      )}
    </div>
  )
}
