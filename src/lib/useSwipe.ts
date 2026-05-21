/**
 * useSwipeComplete — touch-only horizontal swipe handler that fires a callback
 * when the user has dragged past a threshold to the right.
 *
 * Returns a `bind` object to spread on the target element + live state for
 * rendering the "drag preview" (translateX + opacity). The element should be
 * absolutely positioned inside a relative wrapper so the swiped item can
 * animate out cleanly without affecting siblings.
 *
 * Why custom and not react-spring/use-gesture: we want zero deps for the
 * Mini App bundle. Native touch events with a transform-only update path
 * are smooth enough on iOS Safari.
 */
import { useCallback, useRef, useState } from 'react'
import { haptic } from './haptic'

interface Opts {
  onComplete: () => void
  threshold?: number      // pixels to trigger (default 100)
  axis?: 'x' | 'y'        // default 'x'
}

export function useSwipeComplete({ onComplete, threshold = 100, axis = 'x' }: Opts) {
  const [dx, setDx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)
  const reachedThreshold = useRef(false)

  const reset = useCallback(() => {
    setDx(0)
    tracking.current = false
    reachedThreshold.current = false
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (animating) return
    const t = e.touches[0]
    startX.current = t.clientX
    startY.current = t.clientY
    tracking.current = true
    reachedThreshold.current = false
  }, [animating])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current || animating) return
    const t = e.touches[0]
    const deltaX = t.clientX - startX.current
    const deltaY = t.clientY - startY.current

    // Only engage horizontal swipe if the gesture is clearly horizontal —
    // otherwise let the vertical scroll happen naturally.
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      tracking.current = false
      setDx(0)
      return
    }

    // Only positive (rightward) swipes count as "complete"
    const clamped = Math.max(0, deltaX)
    if (axis === 'x') setDx(clamped)

    // Haptic tick once when threshold first crossed during drag
    if (!reachedThreshold.current && clamped >= threshold) {
      reachedThreshold.current = true
      haptic('medium')
    }
  }, [animating, axis, threshold])

  const onTouchEnd = useCallback(() => {
    if (!tracking.current) return
    if (dx >= threshold) {
      // Animate the row out to the right, then fire callback
      setAnimating(true)
      setDx(window.innerWidth)
      setTimeout(() => {
        onComplete()
        setAnimating(false)
        setDx(0)
      }, 220)
    } else {
      // Snap back
      setDx(0)
    }
    tracking.current = false
  }, [dx, onComplete, threshold])

  const onTouchCancel = useCallback(() => {
    reset()
  }, [reset])

  const progress = Math.min(1, dx / threshold)

  return {
    bind: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
    dx,
    progress,
    animating,
    style: {
      transform: `translateX(${dx}px)`,
      transition: tracking.current ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s',
      opacity: animating ? 0 : 1,
      willChange: 'transform',
    } as React.CSSProperties,
  }
}
