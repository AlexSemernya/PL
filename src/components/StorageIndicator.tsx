import { useEffect, useRef, useState } from 'react'

/**
 * Tiny on-screen indicator that flashes when state is persisted.
 * Useful for diagnosing persistence problems in real time.
 *
 * Toggle visibility with: tap the LifeOS logo 5 times quickly.
 */
interface Stats {
  reads: number
  writes: number
  cloud: boolean
  idb: boolean
  ls: boolean
  lastWriteAt?: number
}

const KEY = 'lifeos.debugOverlay'

export function StorageIndicator() {
  const [visible, setVisible] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === '1' } catch { return false }
  })
  const [stats, setStats] = useState<Stats>({ reads: 0, writes: 0, cloud: false, idb: false, ls: false })
  const [flash, setFlash] = useState(false)
  const lastWriteRef = useRef(0)

  useEffect(() => {
    // listen for the secret 5-tap on brand logo
    const onSecret = () => {
      setVisible((v) => {
        const next = !v
        try { localStorage.setItem(KEY, next ? '1' : '0') } catch { /* noop */ }
        return next
      })
    }
    window.addEventListener('lifeos-debug-toggle', onSecret)
    return () => window.removeEventListener('lifeos-debug-toggle', onSecret)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const s = (globalThis as any).__lifeosStorageStats__ as Stats | undefined
      if (!s) return
      setStats({ ...s })
      if (s.lastWriteAt && s.lastWriteAt !== lastWriteRef.current) {
        lastWriteRef.current = s.lastWriteAt
        setFlash(true)
        setTimeout(() => setFlash(false), 600)
      }
    }, 250)
    return () => clearInterval(id)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(8px + var(--safe-top))',
        right: 8,
        zIndex: 999,
        padding: '6px 8px',
        borderRadius: 8,
        background: flash ? 'var(--accent)' : 'rgba(20,21,24,0.85)',
        color: flash ? '#0a0a0b' : 'var(--text-dim)',
        fontSize: 10,
        fontFamily: 'SF Mono, monospace',
        lineHeight: 1.3,
        pointerEvents: 'none',
        border: '1px solid var(--line)',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      <div>w {stats.writes} · r {stats.reads}</div>
      <div>
        <span style={{ color: stats.cloud ? 'var(--good)' : 'var(--red)' }}>cloud</span>{' '}
        <span style={{ color: stats.idb ? 'var(--good)' : 'var(--red)' }}>idb</span>{' '}
        <span style={{ color: stats.ls ? 'var(--good)' : 'var(--red)' }}>ls</span>
      </div>
    </div>
  )
}

// Helper used by the brand logo to toggle the indicator via 5 quick taps.
export function useSecretTapHandler() {
  const tapsRef = useRef<number[]>([])
  return () => {
    const now = Date.now()
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 2000), now]
    if (tapsRef.current.length >= 5) {
      tapsRef.current = []
      window.dispatchEvent(new Event('lifeos-debug-toggle'))
    }
  }
}
