import type { CSSProperties } from 'react'

export const RU_WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const
export const RU_WD_SHORT = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'] as const

export function LifeOSMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="LifeOS">
      <circle cx="60" cy="60" r="46" stroke="#26272c" strokeWidth="6" fill="none" />
      <circle cx="60" cy="60" r="34" stroke="#26272c" strokeWidth="6" fill="none" />
      <circle cx="60" cy="60" r="22" stroke="#26272c" strokeWidth="6" fill="none" />
      <path d="M 60 14 A 46 46 0 0 1 106 60" stroke="#C6F84E" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 26 60 A 34 34 0 0 1 60 26" stroke="#4CD6FF" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 60 82 A 22 22 0 0 1 38 60" stroke="#B59CFF" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="60" r="6" fill="#F4F4F5" />
    </svg>
  )
}

export function BarChart({
  values,
  hot = -1,
  color = 'var(--accent)',
  labels = RU_WD_SHORT as unknown as string[],
}: {
  values: number[]
  hot?: number
  color?: string
  labels?: readonly string[]
}) {
  const max = Math.max(...values, 1)
  return (
    <div>
      <div className="bar-row">
        {values.map((v, i) => (
          <div
            key={i}
            className="bar"
            style={{
              height: `${Math.max(8, (v / max) * 100)}%`,
              background: color,
              opacity: i === hot ? 1 : v > 0 ? 0.5 : 0.15,
            }}
          />
        ))}
      </div>
      <div className="bar-labels">
        {labels.map((l, i) => (
          <span key={i} className={i === hot ? 'hot' : ''}>
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

export function TickRow({
  values,
  color = 'var(--accent)',
  height = 36,
}: {
  values: number[]
  color?: string
  height?: number
}) {
  const max = Math.max(...values, 1)
  return (
    <div className="tick-row" style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="tick" style={{ height: `${Math.max(6, (v / max) * 100)}%`, background: color }} />
      ))}
    </div>
  )
}

export function Ring({
  value,
  size = 60,
  stroke = 7,
  color = 'var(--accent)',
  track = 'var(--line)',
  label,
  sublabel,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  label?: string
  sublabel?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(1, Math.max(0, value)))
  return (
    <div className="ring" style={{ ['--ring-size' as string]: `${size}px` } as CSSProperties}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="label" style={{ flexDirection: 'column', gap: 0 }}>
        <span style={{ fontSize: size > 80 ? 18 : 13, fontWeight: 700 }}>{label}</span>
        {sublabel && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: 1,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

export function Sparkline({
  values,
  color = 'var(--accent)',
  height = 40,
  fill = true,
}: {
  values: number[]
  color?: string
  height?: number
  fill?: boolean
}) {
  const safe = values.length > 1 ? values : [0, 0]
  const w = 100
  const h = height
  const min = Math.min(...safe)
  const max = Math.max(...safe)
  const rng = max - min || 1
  const pts = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * w
    const y = h - ((v - min) / rng) * (h - 4) - 2
    return [x, y] as const
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = `${path} L ${w},${h} L 0,${h} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {fill && <path d={area} fill={color} opacity="0.18" />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />
    </svg>
  )
}
