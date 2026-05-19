/**
 * Storage diagnostics.
 *
 * 1. SelfTest (intra-session):  write a value to each of cloud/idb/ls, read it
 *    back, delete. Catches layers that are completely broken.
 *
 * 2. CrossSessionTest (across reopens): read previously-stored timestamps from
 *    each layer (proves the layer survived a close+reopen), then overwrite
 *    them with the current time so the next open can in turn verify them.
 *    THIS is the test that proves persistence actually works.
 */

const KEY_PREFIX = '__lifeos_xs_'  // cross-session test keys

export interface SelfTestResult {
  cloud: 'pass' | 'fail' | 'skip'
  idb: 'pass' | 'fail' | 'skip'
  ls: 'pass' | 'fail' | 'skip'
  errors: string[]
}

export interface CrossSessionResult {
  cloud: string | null   // ISO timestamp from previous session, or null
  idb: string | null
  ls: string | null
  current: string        // timestamp written this session (now)
}

const cloudOk = (): boolean =>
  typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage

// ─── intra-session self-test ────────────────────────────────────────
const TEST_KEY = '__lifeos_selftest__'
const TEST_VAL = `selftest-${Date.now()}-${Math.random().toString(36).slice(2)}`

async function testCloud(): Promise<'pass' | 'fail' | 'skip'> {
  if (!cloudOk()) return 'skip'
  try {
    const cs = window.Telegram!.WebApp!.CloudStorage!
    await new Promise<void>((resolve, reject) => {
      cs.setItem(TEST_KEY, TEST_VAL, (err) => (err ? reject(err) : resolve()))
    })
    const back = await new Promise<string | null>((resolve) => {
      cs.getItem(TEST_KEY, (_e, v) => resolve(v ?? null))
    })
    cs.removeItem(TEST_KEY)
    return back === TEST_VAL ? 'pass' : 'fail'
  } catch { return 'fail' }
}

async function testIdb(): Promise<'pass' | 'fail' | 'skip'> {
  if (typeof indexedDB === 'undefined') return 'skip'
  try {
    const db = await openIdb()
    if (!db) return 'fail'
    await idbPut(db, TEST_KEY, TEST_VAL)
    const back = await idbGet(db, TEST_KEY)
    await idbDel(db, TEST_KEY)
    return back === TEST_VAL ? 'pass' : 'fail'
  } catch { return 'fail' }
}

function testLs(): 'pass' | 'fail' | 'skip' {
  try {
    if (typeof localStorage === 'undefined') return 'skip'
    localStorage.setItem(TEST_KEY, TEST_VAL)
    const back = localStorage.getItem(TEST_KEY)
    localStorage.removeItem(TEST_KEY)
    return back === TEST_VAL ? 'pass' : 'fail'
  } catch { return 'fail' }
}

export async function runStorageSelfTest(): Promise<SelfTestResult> {
  const errors: string[] = []
  const result: SelfTestResult = { cloud: 'skip', idb: 'skip', ls: 'skip', errors }
  try { result.cloud = await testCloud() } catch (e) { result.cloud = 'fail'; errors.push(String(e)) }
  try { result.idb   = await testIdb()   } catch (e) { result.idb   = 'fail'; errors.push(String(e)) }
  try { result.ls    = testLs() }          catch (e) { result.ls    = 'fail'; errors.push(String(e)) }
  ;(globalThis as any).__lifeosSelfTest__ = result
  console.log('[LifeOS] self-test', result)
  return result
}

// ─── cross-session persistence test ─────────────────────────────────
async function readPrevCloud(): Promise<string | null> {
  if (!cloudOk()) return null
  return await new Promise<string | null>((resolve) => {
    try {
      window.Telegram!.WebApp!.CloudStorage!.getItem(`${KEY_PREFIX}cloud`, (_e, v) => resolve(v ?? null))
    } catch { resolve(null) }
  })
}

async function writeCurrentCloud(now: string): Promise<void> {
  if (!cloudOk()) return
  await new Promise<void>((resolve) => {
    try {
      window.Telegram!.WebApp!.CloudStorage!.setItem(`${KEY_PREFIX}cloud`, now, () => resolve())
    } catch { resolve() }
  })
}

let idbDbPromise: Promise<IDBDatabase | null> | null = null
function openIdb(): Promise<IDBDatabase | null> {
  if (idbDbPromise) return idbDbPromise
  if (typeof indexedDB === 'undefined') { idbDbPromise = Promise.resolve(null); return idbDbPromise }
  idbDbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open('lifeos', 1)
      req.onupgradeneeded = () => {
        const d = req.result
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
  return idbDbPromise
}

function idbPut(db: IDBDatabase, key: string, val: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(val, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(new Error('aborted'))
    } catch (e) { reject(e) }
  })
}

function idbGet(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readonly')
      const req = tx.objectStore('kv').get(key)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
}

function idbDel(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch { resolve() }
  })
}

async function readPrevIdb(): Promise<string | null> {
  const db = await openIdb()
  if (!db) return null
  return await idbGet(db, `${KEY_PREFIX}idb`)
}

async function writeCurrentIdb(now: string): Promise<void> {
  const db = await openIdb()
  if (!db) return
  try { await idbPut(db, `${KEY_PREFIX}idb`, now) } catch { /* noop */ }
}

function readPrevLs(): string | null {
  try { return localStorage.getItem(`${KEY_PREFIX}ls`) } catch { return null }
}

function writeCurrentLs(now: string): void {
  try { localStorage.setItem(`${KEY_PREFIX}ls`, now) } catch { /* noop */ }
}

export async function runCrossSessionTest(): Promise<CrossSessionResult> {
  const now = new Date().toISOString()
  const [prevCloud, prevIdb] = await Promise.all([readPrevCloud(), readPrevIdb()])
  const prevLs = readPrevLs()

  // overwrite with current timestamp for the NEXT session
  await Promise.all([writeCurrentCloud(now), writeCurrentIdb(now)])
  writeCurrentLs(now)

  const result: CrossSessionResult = { cloud: prevCloud, idb: prevIdb, ls: prevLs, current: now }
  ;(globalThis as any).__lifeosCrossTest__ = result
  console.log('[LifeOS] cross-session test', result)
  return result
}
