import { makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  trend: { display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 },
})

export function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  const s = useStyles()
  const positive = value >= 0
  return (
    <span className={s.trend} style={{ background: positive ? '#dcfce7' : '#fee2e2', color: positive ? '#166534' : '#991b1b' }}>
      {positive ? '↑' : '↓'} {Math.abs(value)}{suffix}
    </span>
  )
}
