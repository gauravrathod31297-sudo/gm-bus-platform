import { Button, makeStyles, tokens, Text } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: { padding: '48px 24px', textAlign: 'center', background: 'white', borderRadius: '12px', border: `1px dashed ${tokens.colorNeutralStroke2}` },
  icon: { fontSize: '64px', marginBottom: '12px', lineHeight: 1 },
})

export function EmptyState({ icon, title, description, action, actionLabel }: {
  icon: string
  title: string
  description: string
  action?: () => void
  actionLabel?: string
}) {
  const s = useStyles()
  return (
    <div className={s.root}>
      <div className={s.icon}>{icon}</div>
      <Text size={500} weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>{title}</Text>
      <Text style={{ display: 'block', marginBottom: '20px', color: tokens.colorNeutralForeground3, fontSize: '14px' }}>{description}</Text>
      {action && actionLabel && (
        <Button appearance="primary" onClick={action}>{actionLabel}</Button>
      )}
    </div>
  )
}
