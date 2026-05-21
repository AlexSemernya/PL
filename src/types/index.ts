// ─── Тиры сложности ────────────────────────────────────
// Goals get all four; habits get the first three. XP weights:
//   Goals  — light=5, normal=25, hard=100, epic=500 (one-time, on completion)
//   Habits — light=1, normal=3,  hard=10           (per check-in)
export type GoalTier = 'light' | 'normal' | 'hard' | 'epic'
export type HabitTier = 'light' | 'normal' | 'hard'

export const GOAL_TIER_XP: Record<GoalTier, number> = {
  light: 5, normal: 25, hard: 100, epic: 500,
}
export const HABIT_TIER_XP: Record<HabitTier, number> = {
  light: 1, normal: 3, hard: 10,
}

// ─── Привычки ───────────────────────────────────────────
export interface Habit {
  id: string
  title: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[] // 0=Пн ... 6=Вс
  completedDates: string[] // 'YYYY-MM-DD'
  color?: string
  emoji?: string
  icon?: string
  createdAt: string
  goal?: number
  linkedGoalId?: string
  reminder?: string // 'HH:mm'
  tier?: HabitTier              // default 'normal' if missing
  tierConfirmedByAI?: boolean   // true if user accepted AI suggestion
}

// ─── Цели ───────────────────────────────────────────────
export interface Goal {
  id: string
  title: string
  startDate: string
  endDate?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'none'
  steps: GoalStep[]
  reminder?: string
  completed: boolean
  createdAt: string
  color?: string
  tags?: string[]
  progressCurrent?: number
  progressTarget?: number
  progressUnit?: string
  tier?: GoalTier              // default 'normal' if missing
  tierConfirmedByAI?: boolean
}

export interface GoalStep {
  id: string
  title: string
  done: boolean
}

// ─── Финансы ────────────────────────────────────────────
export type FinanceCategory =
  | 'salary' | 'project' | 'investment' | 'other_income'
  | 'food' | 'transport' | 'housing' | 'shopping' | 'entertainment'
  | 'cafe' | 'subscriptions' | 'gifts' | 'other_expense'

export type FinanceType = 'income' | 'expense'

export interface FinanceEntry {
  id: string
  type: FinanceType
  amount: number
  category: FinanceCategory
  note?: string
  date: string // 'YYYY-MM-DD'
  linkedGoalId?: string
  createdAt: string
}

export interface FinanceGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  createdAt: string
}

// ─── Дневник ────────────────────────────────────────────
export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface DiaryEntry {
  id: string
  date: string // 'YYYY-MM-DD'
  mood: MoodLevel
  moodNote: string
  text?: string
  tags?: string[]
  createdAt: string
}

// ─── Общее ──────────────────────────────────────────────
export type TabId = 'home' | 'habits' | 'goals' | 'finance' | 'diary' | 'friends'

declare global {
  interface ImportMetaEnv {
    readonly VITE_BOT_API_URL?: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        requestFullscreen?: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        setBottomBarColor?: (color: string) => void
        disableVerticalSwipes?: () => void
        viewportHeight?: number
        viewportStableHeight?: number
        colorScheme?: 'light' | 'dark'
        onEvent?: (event: string, cb: () => void) => void
        initData?: string
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        CloudStorage?: {
          getItem: (key: string, cb: (err: unknown, value: string) => void) => void
          setItem: (key: string, value: string, cb?: (err: unknown) => void) => void
          removeItem: (key: string, cb?: (err: unknown) => void) => void
          getKeys?: (cb: (err: unknown, keys: string[]) => void) => void
        }
        initDataUnsafe?: { user?: { id: number; first_name: string; last_name?: string; username?: string } }
      }
    }
  }
}
