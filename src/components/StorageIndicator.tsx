import { useEffect, useState } from 'react'
import { runStorageSelfTest, type SelfTestResult } from '../lib/storageSelfTest'

// Bumped on every diagnostic build so you can confirm the new JS actually loaded.
export const BUILD_TAG = 'v1.0.4-debug'

interface Stats {
  reads: number
  writes: number
  cloud: boolean
  idb: boolean
  ls: boolean
  lastWriteAt?: number
  lastError?: string
}

/**
 * Permanent on-screen storage diagnostic panel. Visible by default — once we
 * confirm persistence works on the user's device we can hide it behind a flag.
 */
// Stub kept for backwards compatibility — the indicator is now always visible,
// so the 5-tap secret is a no-op. We keep the export so CalendarHeader's import
// doesn't break.
export function useSecretTapHandler(): () => void {
  return () => { /* noop */ }
}

export function StorageIndicator() {
  const [stats, setStats] = useState<Stats>({ reads: 0, writes: 0, cloud: false, idb: false, ls: false })
  const [test, setTest] = useState<SelfTestResult | null>(null)
  const [flash, setFlash] = useState(false)
  const [lastWrite, setLastWrite] = useState(0)

  // Run a write/read test once at boot.
  useEffect(() => {
    runStorageSelfTest().then(setTest)
  }, [])

  // Poll the global stats every 250ms for the live writes/reads counter.
  useEffect(() => {
    const id = setInterval(() => {
      const s = (globalThis as any).__lifeosStorageStats__ as Stats | undefined
      if (!s) return
      setStats({ ...s })
      if (s.lastWriteAt && s.lastWriteAt !== lastWrite) {
        setLastWrite(s.lastWriteAt)
        setFlash(true)
        setTimeout(() => setFlash(false), 600)
      }
    }, 250)
    return () => clearInterval(id)
  }, [lastWrite])

  const dotColor = (s: 'pass' | 'fail' | 'skip' | undefined) =>
    s === 'pass' ? 'var(--good)' : s === 'fail' ? 'var(--red)' : 'var(--text-faint)'

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(8px + var(--safe-top))',
        right: 8,
        zIndex: 9999,
        padding: '6px 9px',
        borderRadius: 10,
        background: flash ? 'var(--accent)' : 'rgba(20,21,24,0.92)',
        color: flash ? '#0a0a0b' : 'var(--text-dim)',
        fontSize: 9,
        fontFamily: 'SF Mono, ui-monospace, monospace',
        lineHeight: 1.4,
        pointerEvents: 'none',
        border: '1px solid var(--line)',
        transition: 'background 0.2s, color 0.2s',
        textTransform: 'lowercase',
        letterSpacing: '0.02em',
        minWidth: 92,
      }}
    >
      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{BUILD_TAG}</div>
      <div>writes {stats.writes} · reads {stats.reads}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <span><span style={{ color: dotColor(test?.cloud) }}>●</span> cloud</span>
        <span><span style={{ color: dotColor(test?.idb) }}>●</span> idb</span>
        <span><span style={{ color: dotColor(test?.ls) }}>●</span> ls</span>
      </div>
    </div>
  )
}
