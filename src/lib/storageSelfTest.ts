/**
 * Storage self-test — writes a test value to each layer (CloudStorage, IDB,
 * localStorage), reads it back, and reports which layers actually work.
 *
 * This is critical for debugging persistence in Telegram webviews where any
 * of the three layers may be unavailable or ephemeral.
 *
 * Results land in `window.__lifeosSelfTest__` and the on-screen indicator.
 */

export interface SelfTestResult {
  cloud: 'pass' | 'fail' | 'skip'
  idb: 'pass' | 'fail' | 'skip'
  ls: 'pass' | 'fail' | 'skip'
  errors: string[]
}

const KEY = '__lifeos_selftest__'
const VALUE = `selftest-${Date.now()}-${Math.random().toString(36).slice(2)}`

const cloudOk = (): boolean =>
  typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage

// ── CloudStorage round-trip ──
async function testCloud(): Promise<'pass' | 'fail' | 'skip'> {
  if (!cloudOk()) return 'skip'
  try {
    const cs = window.Telegram!.WebApp!.CloudStorage!
    await new Promise<void>((resolve, reject) => {
      cs.setItem(KEY, VALUE, (err) => (err ? reject(err) : resolve()))
    })
    const back = await new Promise<string | null>((resolve) => {
      cs.getItem(KEY, (_err, v) => resolve(v ?? null))
    })
    cs.removeItem(KEY)
    return back === VALUE ? 'pass' : 'fail'
  } catch {
    return 'fail'
  }
}

// ── IDB round-trip ──
async function testIdb(): Promise<'pass' | 'fail' | 'skip'> {
  if (typeof indexedDB === 'undefined') return 'skip'
  try {
    const db = await new Promise<IDBDatabase | null>((resolve) => {
      const req = indexedDB.open('lifeos', 1)
      req.onupgradeneeded = () => {
        const d = req.result
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    })
    if (!db) return 'fail'

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(VALUE, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(new Error('aborted'))
    })

    const back = await new Promise<unknown>((resolve) => {
      const tx = db.transaction('kv', 'readonly')
      const req = tx.objectStore('kv').get(KEY)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    })

    // cleanup
    try {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').delete(KEY)
    } catch { /* noop */ }

    return back === VALUE ? 'pass' : 'fail'
  } catch {
    return 'fail'
  }
}

// ── localStorage round-trip ──
function testLs(): 'pass' | 'fail' | 'skip' {
  try {
    if (typeof localStorage === 'undefined') return 'skip'
    localStorage.setItem(KEY, VALUE)
    const back = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    return back === VALUE ? 'pass' : 'fail'
  } catch {
    return 'fail'
  }
}

export async function runStorageSelfTest(): Promise<SelfTestResult> {
  const errors: string[] = []
  const result: SelfTestResult = { cloud: 'skip', idb: 'skip', ls: 'skip', errors }

  try { result.cloud = await testCloud() } catch (e) { result.cloud = 'fail'; errors.push(`cloud: ${e}`) }
  try { result.idb   = await testIdb() }   catch (e) { result.idb   = 'fail'; errors.push(`idb: ${e}`) }
  try { result.ls    = testLs() }          catch (e) { result.ls    = 'fail'; errors.push(`ls: ${e}`) }

  ;(globalThis as any).__lifeosSelfTest__ = result
  console.log('[LifeOS] storage self-test', result)
  return result
}
