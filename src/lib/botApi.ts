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

/** Shape returned by /api/friends for each friend (and me). Matches the
 * Friend interface used by the Mountain SVG renderer. */
export interface FriendDTO {
  id: string
  name: string
  initial: string
  lvl: number
  xp: number
  xpMax: number
  streak: number
  pct: number       // 0..1, altitude on the mountain
  xJitter: number   // -1..1, horizontal scatter
  color: string
  trend: number
  you?: boolean
  habits: number
  goals: number
}

export interface StatsSnapshot {
  habits_done_today: number
  habits_total: number
  goals_completed: number
  goals_active: number
  diary_entries: number
  longest_streak: number
  // Tier-weighted XP — pre-computed on the client so the server doesn't need
  // to know about per-item tiers. Old clients omit these fields and the bot
  // falls back to the legacy equal-weight formula.
  habit_xp_alltime?: number
  goal_xp_completed?: number
  goal_xp_progress?: number
}

export interface TierSuggestion {
  tier?: 'light' | 'normal' | 'hard' | 'epic'
  reason?: string
  error?: string
}

export interface InviteResponse {
  invite_link: string   // https://t.me/<bot>?start=invite_<id>
  share_url: string     // https://t.me/share/url?url=…
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

  /** Push a snapshot of my activity counters — feeds the friends mountain. */
  pushStats: (s: StatsSnapshot) =>
    call<{ ok: boolean; xp: number; lvl: number }>('/api/stats', s as any),

  /** List my friends + me with their stats. First element is always me. */
  getFriends: () => call<{ friends: FriendDTO[] }>('/api/friends'),

  /** Generate a t.me deep-link that auto-friends the receiver on /start. */
  createInvite: () => call<InviteResponse>('/api/friends/invite'),

  /** Top users you're not yet friends with — for the Discover section. */
  getDiscover: () => call<{ users: FriendDTO[] }>('/api/discover'),

  /** Add a friend by tg_id directly (from Discover list). Two-way. */
  addFriend: (tg_id: number) =>
    call<{ ok: boolean; created: boolean }>('/api/friends/add', { tg_id }),

  /** Premium-only. Send a receipt photo (base64) — get back parsed data. */
  parseReceipt: (image_b64: string, media_type = 'image/jpeg') =>
    call<ReceiptParse>('/api/receipt', { image_b64, media_type }),

  /** Ask Claude to suggest a difficulty tier for a goal/habit title. */
  suggestTier: (title: string, kind: 'goal' | 'habit') =>
    call<TierSuggestion>('/api/suggest-tier', { title, kind }),
}

export interface ReceiptParse {
  amount?: number
  date?: string | null
  vendor?: string
  category?: string
  confidence?: number
  note?: string
  error?: string
}
