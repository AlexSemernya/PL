/**
 * Tiered persistent storage for LifeOS, exposed as zustand's `StateStorage`.
 *
 * Tiers (in order of preference for write/read):
 *   1. Telegram CloudStorage — syncs across user's devices. Optional.
 *   2. IndexedDB              — durable on most WebKit/Chromium webviews.
 *   3. localStorage           — sync fallback for old browsers.
 *
 * Writes go to ALL available tiers (so even if Telegram closes before async
 * writes finish, IDB/localStorage already have the data).
 * Reads try cloud → IDB → localStorage and return the first hit.
 *
 * We expose a counter on `window.__lifeosStorageStats__` so the UI can show
 * a tiny "saved" indicator and so we can diagnose persistence issues live.
 */
import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const CHUNK = 4000
const IDB_NAME = 'lifeos'
const IDB_STORE = 'kv'

interface StorageStats {
  reads: number
  writes: number
  cloud: boolean
  idb: boolean
  ls: boolean
  lastWriteKey?: string
  lastWriteAt?: number
  lastError?: string
}

const stats: StorageStats = { reads: 0, writes: 0, cloud: false, idb: false, ls: false }
;(globalThis as any).__lifeosStorageStats__ = stats

// ───────── Telegram CloudStorage ─────────
const cloudOk = (): boolean =>
  typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage
const cloud = () => window.Telegram!.WebApp!.CloudStorage!

const cloudGet = (k: string): Promise<string | null> =>
  new Promise((resolve) => {
    try {
      cloud().getItem(k, (err, value) => {
        if (err || value === undefined || value === null || value === '') resolve(null)
        else resolve(value)
      })
    } catch { resolve(null) }
  })

const cloudSet = (k: string, v: string): Promise<void> =>
  new Promise((resolve) => {
    try { cloud().setItem(k, v, () => resolve()) } catch { resolve() }
  })

const cloudRemove = (k: string): Promise<void> =>
  new Promise((resolve) => {
    try { cloud().removeItem(k, () => resolve()) } catch { resolve() }
  })

async function cloudReadChunked(name: string): Promise<string | null> {
  const head = await cloudGet(`${name}__0`)
  if (head !== null) {
    const parts: string[] = [head]
    for (let i = 1; i < 256; i++) {
      const next = await cloudGet(`${name}__${i}`)
      if (next === null) break
      parts.push(next)
    }
    return parts.join('')
  }
  return await cloudGet(name)
}

async function cloudWriteChunked(name: string, value: string): Promise<void> {
  const chunks: string[] = []
  for (let i = 0; i < value.length; i += CHUNK) chunks.push(value.slice(i, i + CHUNK))
  await Promise.all(chunks.map((c, i) => cloudSet(`${name}__${i}`, c)))
  for (let i = chunks.length; i < chunks.length + 4; i++) await cloudRemove(`${name}__${i}`)
  await cloudRemove(name)
}

// ───────── IndexedDB ─────────
let idbOpenPromise: Promise<IDBDatabase | null> | null = null
function openIdb(): Promise<IDBDatabase | null> {
  if (idbOpenPromise) return idbOpenPromise
  if (typeof indexedDB === 'undefined') {
    idbOpenPromise = Promise.resolve(null)
    return idbOpenPromise
  }
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
    } catch {
      resolve(null)
    }
  })
  return idbOpenPromise
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openIdb()
  if (!db) return null
  return new Promise<string | null>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const store = tx.objectStore(IDB_STORE)
      const req = store.get(key)
      req.onsuccess = () => {
        const v = req.result
        if (typeof v === 'string') resolve(v)
        else resolve(null)
      }
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openIdb()
  if (!db) return
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      store.put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function idbRemove(key: string): Promise<void> {
  const db = await openIdb()
  if (!db) return
  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

// ───────── localStorage ─────────
const lsGet = (k: string): string | null => {
  try { return localStorage.getItem(k) } catch { return null }
}
const lsSet = (k: string, v: string): boolean => {
  try { localStorage.setItem(k, v); return true } catch { return false }
}
const lsRemove = (k: string): void => {
  try { localStorage.removeItem(k) } catch { /* noop */ }
}

// ───────── StateStorage facade ─────────
const stateStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    stats.reads++
    // 1) CloudStorage (cross-device)
    if (cloudOk()) {
      const v = await cloudReadChunked(name)
      if (v !== null) { stats.cloud = true; return v }
    }
    // 2) IDB
    const fromIdb = await idbGet(name)
    if (fromIdb !== null) { stats.idb = true; return fromIdb }
    // 3) localStorage
    const fromLs = lsGet(name)
    if (fromLs !== null) { stats.ls = true; return fromLs }
    return null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    stats.writes++
    stats.lastWriteKey = name
    stats.lastWriteAt = Date.now()
    // Synchronous local write first — survives a sudden app close.
    if (lsSet(name, value)) stats.ls = true
    // IDB write (async but durable).
    try {
      await idbSet(name, value)
      stats.idb = true
    } catch (e) {
      stats.lastError = String(e)
    }
    // CloudStorage write (cross-device).
    if (cloudOk()) {
      try {
        await cloudWriteChunked(name, value)
        stats.cloud = true
      } catch (e) {
        stats.lastError = String(e)
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    lsRemove(name)
    await idbRemove(name)
    if (cloudOk()) {
      for (let i = 0; i < 256; i++) await cloudRemove(`${name}__${i}`)
      await cloudRemove(name)
    }
  },
}

/**
 * Use this in `persist({ storage: createTelegramStorage() })`.
 * Returns a JSON storage adapter compatible with zustand v4.
 */
export const createTelegramStorage = <T>() => createJSONStorage<T>(() => stateStorage)
