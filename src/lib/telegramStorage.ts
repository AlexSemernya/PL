/**
 * Telegram CloudStorage adapter for Zustand `persist` middleware.
 *
 * - Persists state to Telegram CloudStorage (syncs across user's devices).
 * - Also writes a parallel copy to localStorage as a fast local cache.
 *   This protects against the case where the user closes the Mini App
 *   before our async CloudStorage write completes — on next open we'll
 *   still see the latest data from localStorage while CloudStorage catches up.
 * - On read, we prefer CloudStorage (cross-device truth) and fall back to
 *   localStorage if cloud is empty or unavailable.
 * - Outside Telegram (web preview), only localStorage is used.
 *
 * Telegram limits: key ≤ 128 chars, value ≤ 4096 chars, up to 1024 keys.
 * Larger payloads are transparently sharded as `{name}__0`, `{name}__1`, …
 */
import type { PersistStorage, StorageValue } from 'zustand/middleware'

const CHUNK = 4000

const isTelegram = (): boolean =>
  typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage
const cloud = () => window.Telegram!.WebApp!.CloudStorage!

// ───────── low-level localStorage (safe wrappers) ─────────
const lsGet = (k: string): string | null => {
  try { return localStorage.getItem(k) } catch { return null }
}
const lsSet = (k: string, v: string): void => {
  try { localStorage.setItem(k, v) } catch { /* quota / privacy mode */ }
}
const lsRemove = (k: string): void => {
  try { localStorage.removeItem(k) } catch { /* noop */ }
}

// ───────── low-level CloudStorage (per-key, promise-wrapped) ─────────
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

// ───────── chunked read/write ─────────
async function readChunked(name: string): Promise<string | null> {
  // Try chunked first.
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
  // Legacy single-key fallback.
  return await cloudGet(name)
}

async function writeChunked(name: string, value: string): Promise<void> {
  const chunks: string[] = []
  for (let i = 0; i < value.length; i += CHUNK) chunks.push(value.slice(i, i + CHUNK))
  // Write all in parallel.
  await Promise.all(chunks.map((c, i) => cloudSet(`${name}__${i}`, c)))
  // Clean up any leftover chunks from a previously larger payload.
  for (let i = chunks.length; i < chunks.length + 4; i++) {
    await cloudRemove(`${name}__${i}`)
  }
  // Also delete any legacy single-key copy.
  await cloudRemove(name)
}

async function removeChunked(name: string): Promise<void> {
  for (let i = 0; i < 256; i++) await cloudRemove(`${name}__${i}`)
  await cloudRemove(name)
}

// ───────── PersistStorage<T> ─────────
export function createTelegramStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      // Prefer cloud (cross-device truth), fall back to local cache.
      let raw: string | null = null
      if (isTelegram()) {
        raw = await readChunked(name)
      }
      if (raw === null) raw = lsGet(name)
      if (raw === null) return null
      try {
        return JSON.parse(raw) as StorageValue<T>
      } catch {
        return null
      }
    },
    setItem: async (name, value) => {
      const raw = JSON.stringify(value)
      // 1) Synchronous local cache — survives even if user closes the app
      //    before the async cloud write completes.
      lsSet(name, raw)
      // 2) Cloud write (async, syncs across devices).
      if (isTelegram()) {
        await writeChunked(name, raw)
      }
    },
    removeItem: async (name) => {
      lsRemove(name)
      if (isTelegram()) await removeChunked(name)
    },
  }
}
