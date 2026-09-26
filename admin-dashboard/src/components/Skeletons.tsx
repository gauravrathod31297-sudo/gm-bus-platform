import { makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  shimmer: {
    background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
    backgroundSize: '200% 100%',
    animationName: {
      from: { backgroundPosition: '200% 0' },
      to:   { backgroundPosition: '-200% 0' },
    },
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
    borderRadius: 6,
  },
  row: {
    display: 'grid',
    gap: 16,
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
  },
  cell: { height: 14 },
  avatar: { width: 28, height: 28, borderRadius: '50%' },
  kpi: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  kpiIcon: { width: 40, height: 40, borderRadius: 10 },
  kpiValue: { height: 28, width: '60%' },
  kpiLabel: { height: 12, width: '40%' },
})

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  const s = useStyles()
  const gridCols = `minmax(200px, 2fr) ${Array(cols - 1).fill('1fr').join(' ')}`
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={s.row} style={{ gridTemplateColumns: gridCols }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`${s.shimmer} ${s.avatar}`} />
            <div className={`${s.shimmer} ${s.cell}`} style={{ flex: 1, maxWidth: 180 }} />
          </div>
          {Array.from({ length: cols - 1 }).map((__, j) => (
            <div key={j} className={`${s.shimmer} ${s.cell}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function KpiSkeleton() {
  const s = useStyles()
  return (
    <div className={s.kpi}>
      <div className={`${s.shimmer} ${s.kpiIcon}`} />
      <div className={`${s.shimmer} ${s.kpiValue}`} />
      <div className={`${s.shimmer} ${s.kpiLabel}`} />
    </div>
  )
}

export function CardSkeleton({ height = 260 }: { height?: number }) {
  const s = useStyles()
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
      <div className={s.shimmer} style={{ height: 16, width: 180, marginBottom: 20 }} />
      <div className={s.shimmer} style={{ height }} />
    </div>
  )
}
