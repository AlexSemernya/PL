import { useEffect, useState } from 'react'
import {
  runStorageSelfTest,
  runCrossSessionTest,
  type SelfTestResult,
  type CrossSessionResult,
} from '../lib/storageSelfTest'

export const BUILD_TAG = 'v1.0.8-debug'

type LayerStatus = 'ok' | 'fail' | 'na' | 'pending'

interface Stats {
  reads: number
  writes: number
  cloud: boolean
  idb: boolean
  ls: boolean
  cloudWrite: LayerStatus
  idbWrite: LayerStatus
  lsWrite: LayerStatus
  lastWriteKey?: string
  lastWriteAt?: number
  lastReadFrom?: 'cloud' | 'idb' | 'ls' | 'none'
  lastError?: string
  lastValueSize?: number
}

export function useSecretTapHandler(): () => void { return () => { /* noop */ } }

export function StorageIndicator() {
  const [stats, setStats] = useState<Stats>({
    reads: 0, writes: 0, cloud: false, idb: false, ls: false,
    cloudWrite: 'pending', idbWrite: 'pending', lsWrite: 'pending',
  })
  const [test, setTest] = useState<SelfTestResult | null>(null)
  const [xs, setXs] = useState<CrossSessionResult | null>(null)
  const [flash, setFlash] = useState(false)
  const [lastWrite, setLastWrite] = useState(0)

  useEffect(() => {
    runStorageSelfTest().then(setTest)
    runCrossSessionTest().then(setXs)
  }, [])

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
    }, 200)
    return () => clearInterval(id)
  }, [lastWrite])

  const tcolor = (s: 'pass' | 'fail' | 'skip' | undefined) =>
    s === 'pass' ? 'var(--good)' : s === 'fail' ? 'var(--red)' : 'var(--text-faint)'

  const lcolor = (s: LayerStatus): string =>
    s === 'ok' ? 'var(--good)' : s === 'fail' ? 'var(--red)' : s === 'pending' ? 'var(--warn)' : 'var(--text-faint)'

  const fmtPrev = (iso: string | null) => {
    if (!iso) return '∅'
    try { return iso.slice(11, 19) } catch { return '?' }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(8px + var(--safe-top))',
        right: 8,
        zIndex: 9999,
        padding: '6px 9px',
        borderRadius: 10,
        background: flash ? 'var(--accent)' : 'rgba(20,21,24,0.95)',
        color: flash ? '#0a0a0b' : 'var(--text-dim)',
        fontSize: 9,
        fontFamily: 'SF Mono, ui-monospace, monospace',
        lineHeight: 1.4,
        pointerEvents: 'none',
        border: '1px solid var(--line)',
        transition: 'background 0.2s, color 0.2s',
        textTransform: 'lowercase',
        letterSpacing: '0.02em',
        minWidth: 170,
        maxWidth: 240,
      }}
    >
      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{BUILD_TAG}</div>
      <div>w {stats.writes} · r {stats.reads}</div>

      {/* last write per layer */}
      {stats.writes > 0 && (
        <div style={{ marginTop: 3 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span><span style={{ color: lcolor(stats.cloudWrite) }}>●</span> cloud</span>
            <span><span style={{ color: lcolor(stats.idbWrite) }}>●</span> idb</span>
            <span><span style={{ color: lcolor(stats.lsWrite) }}>●</span> ls</span>
          </div>
          {stats.lastWriteKey && (
            <div style={{ color: 'var(--text)' }}>
              last: {stats.lastWriteKey.replace('lifeos.', '')}
              {stats.lastValueSize !== undefined ? ` (${stats.lastValueSize}b)` : ''}
            </div>
          )}
          {stats.lastReadFrom && (
            <div>read←{stats.lastReadFrom}</div>
          )}
        </div>
      )}

      {stats.lastError && (
        <div style={{ color: 'var(--red)', wordBreak: 'break-all', marginTop: 2 }}>
          err: {stats.lastError.slice(0, 80)}
        </div>
      )}

      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>self-test (now):</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span><span style={{ color: tcolor(test?.cloud) }}>●</span> cloud</span>
          <span><span style={{ color: tcolor(test?.idb) }}>●</span> idb</span>
          <span><span style={{ color: tcolor(test?.ls) }}>●</span> ls</span>
        </div>
      </div>

      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>persists across:</div>
        <div>cloud: <span style={{ color: xs?.cloud ? 'var(--good)' : 'var(--red)' }}>{fmtPrev(xs?.cloud ?? null)}</span></div>
        <div>idb:   <span style={{ color: xs?.idb ? 'var(--good)' : 'var(--red)' }}>{fmtPrev(xs?.idb ?? null)}</span></div>
        <div>ls:    <span style={{ color: xs?.ls ? 'var(--good)' : 'var(--red)' }}>{fmtPrev(xs?.ls ?? null)}</span></div>
      </div>
    </div>
  )
}
