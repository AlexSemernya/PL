/**
 * SwipeRow — wraps a habit/goal row and reveals a "complete" action when the
 * user swipes right. Releases the callback when the swipe crosses threshold.
 *
 * The visual is two stacked layers:
 *   1. action background (green check icon, fixed to the row)
 *   2. the user-supplied content (translates rightward as the user drags)
 *
 * As the drag progresses, the action background becomes more visible and the
 * row tints green at threshold — giving clear feedback before release.
 */
import type { ReactNode } from 'react'
import { useSwipeComplete } from '../lib/useSwipe'
import { Icon } from './Icons'

interface Props {
  children: ReactNode
  onComplete: () => void
  /** Hide the swipe affordance when the item is already done */
  disabled?: boolean
  /** Custom action label (default: "Готово") */
  actionLabel?: string
}

export function SwipeRow({ children, onComplete, disabled, actionLabel = 'Готово' }: Props) {
  const { bind, progress, style } = useSwipeComplete({ onComplete, threshold: 110 })

  if (disabled) {
    return <>{children}</>
  }

  const armed = progress >= 1
  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      {/* Action layer — sits behind the row, fades in as user drags */}
      <div style={{
        position: 'absolute', inset: 0,
        background: armed ? 'var(--good)' : `rgba(107, 233, 154, ${progress * 0.7})`,
        borderRadius: 14,
        display: 'flex', alignItems: 'center',
        paddingLeft: 18, gap: 10,
        transition: 'background 0.15s',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: armed ? '#0a0a0b' : 'rgba(10,10,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${0.6 + progress * 0.4})`,
          transition: 'background 0.15s, transform 0.15s',
        }}>
          <Icon name="check" size={16} color={armed ? 'var(--good)' : '#0a0a0b'} stroke={3} />
        </div>
        {progress > 0.4 && (
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#0a0a0b',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            opacity: Math.min(1, (progress - 0.4) * 2.5),
          }}>
            {actionLabel}
          </span>
        )}
      </div>

      {/* Content layer — translates with the drag */}
      <div style={style} {...bind}>
        {children}
      </div>
    </div>
  )
}
