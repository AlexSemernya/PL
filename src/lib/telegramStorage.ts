/**
 * Tiered persistent storage for LifeOS, exposed as zustand's `StateStorage`.
 *
 * Tiers:
 *   1. Telegram CloudStorage — syncs across user's devices (server-side).
 *   2. IndexedDB              — durable local storage on most WebKit/Chromium.
 *   3. localStorage           — sync local fallback.
 *
 * Writes go to ALL available tiers in parallel. Reads try cloud → IDB → LS.
 *
 * No chunking: Telegram allows 4096 chars/value, which is enough for our
 * stores. Earlier chunking + cleanup logic caused ≥5 API calls per save and
 * tripped Telegram's 5-call/sec rate limit, leading to silent cloud failures.
 */
import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const CLOUD_VALUE_LIMIT = 4096
const IDB_NAME = 'lifeos'
const IDB_STORE = 'kv'
const CLOUD_TIMEOUT_MS = 4000

type LayerStatus = 'ok' | 'fail' | 'na' | 'pending'

interface StorageStats {
  reads: number
  writes: number
  cloud: boolean         // legacy: ever succeeded in this session
  idb: boolean
  ls: boolean
  cloudWrite: LayerStatus
  idbWrite: LayerStatus
  lsWrite: LayerStatus
  lastWriteKey?: string
  lastWriteAt?: number
  lastReadKey?: string
  lastReadFrom?: 'cloud' | 'idb' | 'ls' | 'none'
  lastError?: string
  lastValueSize?: number
}

const stats: StorageStats = {
  reads: 0, writes: 0,
  cloud: false, idb: false, ls: false,
  cloudWrite: 'pending', idbWrite: 'pending', lsWrite: 'pending',
}
;(globalThis as any).__lifeosStorageStats__ = stats

// ─── CloudStorage ─────────────────────────────────────────────────
const cloudOk = (): boolean =>
  typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage
const cloud = () => window.Telegram!.WebApp!.CloudStorage!

function cloudGet(k: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      cloud().getItem(k, (err, v) => {
        if (err || v === undefined || v === null || v === '') resolve(null)
        else resolve(v)
      })
    } catch { resolve(null) }
  })
}

function cloudSetWithTimeout(k: string, v: string): Promise<{ ok: boolean; error?: string }> {
  return Promise.race([
    new Promise<{ ok: boolean; error?: string }>((resolve) => {
      try {
        cloud().setItem(k, v, (err: unknown) => {
          if (err) resolve({ ok: false, error: String(err) })
          else resolve({ ok: true })
        })
      } catch (e) {
        resolve({ ok: false, error: e instanceof Error ? e.message : String(e) })
      }
    }),
    new Promise<{ ok: boolean; error?: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, error: 'timeout' }), CLOUD_TIMEOUT_MS),
    ),
  ])
}

// ─── IndexedDB ─────────────────────────────────────────────────────
let idbOpenPromise: Promise<IDBDatabase | null> | null = null
function openIdb(): Promise<IDBDatabase | null> {
  if (idbOpenPromise) return idbOpenPromise
  if (typeof indexedDB === 'undefined') { idbOpenPromise = Promise.resolve(null); return idbOpenPromise }
  idbOpenPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch { resolve(null) }
  })
  return idbOpenPromise
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openIdb()
  if (!db) return null
  return new Promise<string | null>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
}

async function idbSet(key: string, value: string): Promise<{ ok: boolean; error?: string }> {
  const db = await openIdb()
  if (!db) return { ok: false, error: 'idb not open' }
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(value, key)
      tx.oncomplete = () => resolve({ ok: true })
      tx.onerror = () => resolve({ ok: false, error: String(tx.error) })
      tx.onabort = () => resolve({ ok: false, error: 'aborted' })
    } catch (e) { resolve({ ok: false, error: e instanceof Error ? e.message : String(e) }) }
  })
}

// ─── localStorage ─────────────────────────────────────────────────
const lsGet = (k: string): string | null => {
  try { return localStorage.getItem(k) } catch { return null }
}
const lsSet = (k: string, v: string): { ok: boolean; error?: string } => {
  try { localStorage.setItem(k, v); return { ok: true } }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) } }
}
const lsRemove = (k: string): void => {
  try { localStorage.removeItem(k) } catch { /* noop */ }
}

// ─── StateStorage facade ──────────────────────────────────────────
const stateStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    stats.reads++
    stats.lastReadKey = name
    // 1) CloudStorage (source of truth across devices)
    if (cloudOk()) {
      const v = await cloudGet(name)
      if (v !== null) { stats.cloud = true; stats.lastReadFrom = 'cloud'; return v }
    }
    // 2) IDB
    const idb = await idbGet(name)
    if (idb !== null) { stats.idb = true; stats.lastReadFrom = 'idb'; return idb }
    // 3) localStorage
    const ls = lsGet(name)
    if (ls !== null) { stats.ls = true; stats.lastReadFrom = 'ls'; return ls }
    stats.lastReadFrom = 'none'
    return null
  },

  setItem: async (name: string, value: string): Promise<void> => {
    stats.writes++
    stats.lastWriteKey = name
    stats.lastWriteAt = Date.now()
    stats.lastValueSize = value.length

    // Kick off all writes in parallel.
    const lsPromise = Promise.resolve(lsSet(name, value))
    const idbPromise = idbSet(name, value)
    const cloudPromise: Promise<{ ok: boolean; error?: string }> = cloudOk()
      ? value.length > CLOUD_VALUE_LIMIT
        ? Promise.resolve({ ok: false, error: `value too long (${value.length} > ${CLOUD_VALUE_LIMIT})` })
        : cloudSetWithTimeout(name, value)
      : Promise.resolve({ ok: false, error: 'CloudStorage unavailable' })

    // Mark pending while in-flight
    stats.cloudWrite = cloudOk() ? 'pending' : 'na'
    stats.idbWrite = 'pending'
    stats.lsWrite = 'pending'

    const [lsRes, idbRes, cloudRes] = await Promise.all([lsPromise, idbPromise, cloudPromise])

    // Local storage
    stats.lsWrite = lsRes.ok ? 'ok' : 'fail'
    if (lsRes.ok) stats.ls = true
    else stats.lastError = `ls: ${lsRes.error}`

    // IDB
    stats.idbWrite = idbRes.ok ? 'ok' : 'fail'
    if (idbRes.ok) stats.idb = true
    else stats.lastError = `idb: ${idbRes.error}`

    // Cloud
    if (!cloudOk()) {
      stats.cloudWrite = 'na'
    } else if (cloudRes.ok) {
      stats.cloudWrite = 'ok'
      stats.cloud = true
    } else {
      stats.cloudWrite = 'fail'
      stats.lastError = `cloud: ${cloudRes.error}`
    }
  },

  removeItem: async (name: string): Promise<void> => {
    lsRemove(name)
    const db = await openIdb()
    if (db) {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite')
        tx.objectStore(IDB_STORE).delete(name)
      } catch { /* noop */ }
    }
    if (cloudOk()) {
      try {
        await new Promise<void>((resolve) => cloud().removeItem(name, () => resolve()))
      } catch { /* noop */ }
    }
  },
}

export const createTelegramStorage = <T>() => createJSONStorage<T>(() => stateStorage)
