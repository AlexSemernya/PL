// ─── Привычки ───────────────────────────────────────────
export interface Habit {
  id: string
  title: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[] // 0=Пн ... 6=Вс
  completedDates: string[] // формат: 'YYYY-MM-DD'
  color?: string
  emoji?: string
  createdAt: string
  goal?: number // цель в днях
  linkedGoalId?: string
  reminder?: string // время HH:mm
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
}

export interface GoalStep {
  id: string
  title: string
  done: boolean
}

// ─── Финансы ────────────────────────────────────────────
export type FinanceCategory =
  | 'salary' | 'project' | 'investment' | 'other_income'
  | 'food' | 'transport' | 'housing' | 'shopping' | 'entertainment' | 'other_expense'

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
  createdAt: string
}

// ─── Общее ──────────────────────────────────────────────
export type TabId = 'habits' | 'goals' | 'home' | 'finance' | 'diary'

export interface CalendarView {
  mode: 'week' | 'month'
  selectedDate: string // 'YYYY-MM-DD'
  currentMonth: string // 'YYYY-MM'
}
