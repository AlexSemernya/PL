/**
 * Telegram CloudStorage adapter for Zustand persist middleware.
 *
 * - Inside Telegram: persists to Telegram cloud → syncs across user's devices.
 * - Outside Telegram (preview/web): falls back to localStorage.
 *
 * Telegram limits: key ≤ 128 chars, value ≤ 4096 chars, up to 1024 keys.
 * For larger state we transparently shard across keys `{name}__0`, `{name}__1`, ...
 */
import type { PersistStorage, StorageValue } from 'zustand/middleware'

const CHUNK_LIMIT = 4000 // safety margin under Telegram's 4096-char value cap

const isTelegram = (): boolean =>
  typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage

const cloud = () => window.Telegram!.WebApp!.CloudStorage!

// ─── low-level get/set (chunked, with localStorage fallback) ─────────
async function rawGet(key: string): Promise<string | null> {
  if (!isTelegram()) {
    try { return localStorage.getItem(key) } catch { return null }
  }
  // try chunked first
  const head = await getOne(`${key}__0`)
  if (head !== null) {
    const parts: string[] = [head]
    let i = 1
    // collect until we miss a chunk
    while (true) {
      const next = await getOne(`${key}__${i}`)
      if (next === null) break
      parts.push(next)
      i++
      if (i > 256) break // hard safety cap
    }
    return parts.join('')
  }
  // fallback to single-key value (legacy data)
  return await getOne(key)
}

function getOne(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      cloud().getItem(key, (err, value) => {
        if (err || value === undefined || value === '') resolve(null)
        else resolve(value)
      })
    } catch {
      resolve(null)
    }
  })
}

async function rawSet(key: string, value: string): Promise<void> {
  if (!isTelegram()) {
    try { localStorage.setItem(key, value) } catch {}
    return
  }
  // split into chunks of CHUNK_LIMIT chars
  const chunks: string[] = []
  for (let i = 0; i < value.length; i += CHUNK_LIMIT) {
    chunks.push(value.slice(i, i + CHUNK_LIMIT))
  }
  // write chunks
  await Promise.all(chunks.map((c, idx) => setOne(`${key}__${idx}`, c)))
  // remove any leftover chunks from previous larger state
  // (best-effort — Telegram doesn't expose a key-prefix delete)
  for (let idx = chunks.length; idx < chunks.length + 4; idx++) {
    await removeOne(`${key}__${idx}`)
  }
  // also clear legacy single-key
  await removeOne(key)
}

function setOne(key: string, value: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      cloud().setItem(key, value, () => resolve())
    } catch {
      try { localStorage.setItem(key, value) } catch {}
      resolve()
    }
  })
}

function removeOne(key: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      cloud().removeItem(key, () => resolve())
    } catch {
      try { localStorage.removeItem(key) } catch {}
      resolve()
    }
  })
}

async function rawRemove(key: string): Promise<void> {
  if (!isTelegram()) {
    try { localStorage.removeItem(key) } catch {}
    return
  }
  for (let i = 0; i < 256; i++) {
    await removeOne(`${key}__${i}`)
  }
  await removeOne(key)
}

// ─── Zustand v4 PersistStorage<T> with JSON (de)serialization ────────
export function createTelegramStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      const raw = await rawGet(name)
      if (raw === null) return null
      try {
        return JSON.parse(raw) as StorageValue<T>
      } catch {
        return null
      }
    },
    setItem: async (name, value) => {
      await rawSet(name, JSON.stringify(value))
    },
    removeItem: async (name) => {
      await rawRemove(name)
    },
  }
}
