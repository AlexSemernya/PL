/**
 * HTTP client for the PLanner bot's API.
 *
 * All endpoints require Telegram Mini App `initData` (HMAC-signed by Telegram)
 * which we send in the JSON body and the bot verifies server-side.
 *
 * Configure the bot URL via `VITE_BOT_API_URL` at build time (or override at
 * runtime with `window.__lifeosBotApi__`).
 */
import type { DiaryEntry } from '../types'

// To change the URL after deploy:
//   - edit the default below, OR
//   - set VITE_BOT_API_URL env var on Timeweb (build-time), OR
//   - call `window.__lifeosBotApi__ = '...'` at runtime (dev only).
export const BOT_API_URL: string =
  (globalThis as any).__lifeosBotApi__ ||
  import.meta.env.VITE_BOT_API_URL ||
  'https://planner-bot-production-9979.up.railway.app'

const initData = (): string => {
  try { return window.Telegram?.WebApp?.initData || '' } catch { return '' }
}

async function call<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${BOT_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ init_data: initData(), ...body }),
  })
  if (!res.ok) {
    let err: any = null
    try { err = await res.json() } catch { /* noop */ }
    throw new BotApiError(res.status, err?.error || res.statusText)
  }
  return await res.json() as T
}

export class BotApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'BotApiError'
  }
  get isAuth() { return this.status === 401 }
  get isPremiumRequired() { return this.status === 402 }
}

// ─── DTOs ────────────────────────────────────────────────
export interface UserProfile {
  tg_id: number
  first_name: string
  username: string
  registered_at: number
  trial_until: number
  premium_until: number
  is_premium: boolean
  in_trial: boolean
  has_access: boolean
  trial_days_left: number
  premium_days_left: number
}

export interface RemindersConfig {
  enabled: boolean
  morning_time: string       // 'HH:MM' or ''
  evening_time: string
  weekly_goal_time: string
}

export interface MeResponse {
  user: UserProfile
  reminders: RemindersConfig
  premium_price_stars: number
  premium_days: number
  trial_days: number
}

// ─── Endpoints ───────────────────────────────────────────
export const api = {
  /** Fetch profile + reminders + pricing. Creates the user on first call. */
  me: () => call<MeResponse>('/api/me'),

  /** Ask the bot to send the Stars invoice to the user's chat with the bot. */
  buyPremium: () => call<{ ok: boolean }>('/api/buy'),

  /** Premium-only. Returns an analysis string from Claude. */
  analyzeDiary: (entries: DiaryEntry[]) =>
    call<{ text: string }>('/api/analyze', { entries }),

  /** Read current reminder settings. */
  getReminders: () => call<RemindersConfig>('/api/reminders'),

  /** Save reminder settings. */
  setReminders: (cfg: RemindersConfig) =>
    call<RemindersConfig>('/api/reminders', { set: true, ...cfg }),
}
