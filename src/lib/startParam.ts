/**
 * Decodes the `start_param` that Telegram delivers when the Mini App is
 * launched via a deep-link like `t.me/<bot>?startapp=ch_<base64>`.
 *
 * Format produced by the bot (see handlers.py `_encode_start_param`):
 *   <action>_<urlsafe_base64_no_padding(utf8_payload)>
 *
 * Where action ∈ { "ch" = create habit, "cg" = create goal }.
 *
 * We expose two helpers:
 *   - `parseStartParam()` — pure parser; returns null if nothing useful.
 *   - `consumeStartParam()` — same, but clears the value so it doesn't fire
 *     twice on hot reload / store rehydration. Use this from the bootstrap
 *     effect in App.tsx.
 */

export type StartIntent =
  | { kind: 'create_habit'; title: string }
  | { kind: 'create_goal';  title: string }

const PREFIX_MAP: Record<string, StartIntent['kind']> = {
  ch: 'create_habit',
  cg: 'create_goal',
}

/** Base64-urlsafe decode, padding-tolerant (some encoders strip `=`). */
function b64UrlDecode(s: string): Uint8Array | null {
  try {
    // Restore padding so atob is happy
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
    const normal = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(normal)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

function bytesToUtf8(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8').decode(bytes) } catch { return '' }
}

function getRawStartParam(): string {
  try {
    const tg = (window as any).Telegram?.WebApp
    return (tg?.initDataUnsafe?.start_param as string) || ''
  } catch { return '' }
}

export function parseStartParam(): StartIntent | null {
  const raw = getRawStartParam()
  if (!raw) return null
  const us = raw.indexOf('_')
  if (us <= 0 || us === raw.length - 1) return null
  const prefix = raw.slice(0, us)
  const payload = raw.slice(us + 1)
  const kind = PREFIX_MAP[prefix]
  if (!kind) return null
  const bytes = b64UrlDecode(payload)
  if (!bytes) return null
  const title = bytesToUtf8(bytes).trim()
  if (!title) return null
  return { kind, title }
}

// Module-level flag — once we've consumed the param we don't fire again.
let consumed = false

export function consumeStartParam(): StartIntent | null {
  if (consumed) return null
  const intent = parseStartParam()
  if (intent) consumed = true
  return intent
}

// For tests / manual reset (e.g. if Mini App stays mounted across deep links)
export function _resetConsumed() { consumed = false }
