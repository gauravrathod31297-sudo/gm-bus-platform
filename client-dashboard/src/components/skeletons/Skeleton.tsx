import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  base: {
    background: `linear-gradient(90deg, ${tokens.colorNeutralBackground3} 25%, ${tokens.colorNeutralBackground2} 50%, ${tokens.colorNeutralBackground3} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '6px',
    '@keyframes shimmer': {
      '0%': { backgroundPosition: '200% 0' },
      '100%': { backgroundPosition: '-200% 0' },
    },
  },
})

export function Skeleton({ width, height, style }: { width?: string; height?: string; style?: any }) {
  const s = useStyles()
  return <div className={s.base} style={{ width: width || '100%', height: height || '20px', ...style }} />
}

export function SkeletonCard() {
  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '10px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
      <Skeleton width="40%" height="14px" />
      <div style={{ marginTop: '16px' }}><Skeleton width="60%" height="32px" /></div>
      <div style={{ marginTop: '12px' }}><Skeleton width="80%" height="12px" /></div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '16px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <Skeleton width="60px" height="16px" />
          <Skeleton width="25%" height="16px" />
          <Skeleton width="20%" height="16px" />
          <Skeleton width="15%" height="16px" />
        </div>
      ))}
    </div>
  )
}
