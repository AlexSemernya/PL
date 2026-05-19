/**
 * Safe UUID generator with fallback.
 *
 * crypto.randomUUID() requires Safari 15.4+ (March 2022). Older Telegram
 * Desktop builds on macOS use system WebKit which may not have it — calling
 * it throws and crashes the surrounding function (e.g. addHabit), which is
 * what was silently breaking persistence.
 *
 * We try the standard, then crypto.getRandomValues, then Math.random.
 */
export function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch { /* fall through */ }
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'))
      return (
        hex.slice(0, 4).join('') + '-' +
        hex.slice(4, 6).join('') + '-' +
        hex.slice(6, 8).join('') + '-' +
        hex.slice(8, 10).join('') + '-' +
        hex.slice(10, 16).join('')
      )
    }
  } catch { /* fall through */ }
  // Last-resort fallback (not cryptographically strong but unique enough).
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`
}

/**
 * Wrap a mutation in try/catch and report errors to the on-screen indicator
 * via window.__lifeosStorageStats__.lastError.
 */
export function safeMutate(label: string, fn: () => void): void {
  try {
    fn()
  } catch (e) {
    const msg = `${label}: ${e instanceof Error ? e.message : String(e)}`
    console.error('[LifeOS]', msg, e)
    try {
      const stats = (globalThis as any).__lifeosStorageStats__
      if (stats) stats.lastError = msg
    } catch { /* noop */ }
  }
}
