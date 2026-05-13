import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { telegramStorage } from '../lib/telegramStorage'
import { FinanceEntry, FinanceGoal, FinanceType } from '../types'
import dayjs from 'dayjs'

interface FinanceState {
  entries: FinanceEntry[]
  goals: FinanceGoal[]
  addEntry: (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  addGoal: (goal: Omit<FinanceGoal, 'id' | 'createdAt'>) => void
  removeGoal: (id: string) => void
  updateGoalAmount: (id: string, amount: number) => void
  getBalance: () => number
  getMonthlyTotal: (month: string, type: FinanceType) => number
  getStreak: () => number // дней без трат
  getChartData: () => { date: string; amount: number }[]
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      entries: [],
      goals: [],

      addEntry: (entry) => {
        const newEntry: FinanceEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ entries: [...s.entries, newEntry] }))
      },

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      addGoal: (goal) => {
        const newGoal: FinanceGoal = {
          ...goal,
          id: crypto.randomUUID(),
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ goals: [...s.goals, newGoal] }))
      },

      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      updateGoalAmount: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: amount } : g
          ),
        })),

      getBalance: () => {
        const { entries } = get()
        return entries.reduce(
          (acc, e) => (e.type === 'income' ? acc + e.amount : acc - e.amount),
          0
        )
      },

      getMonthlyTotal: (month, type) => {
        const { entries } = get()
        return entries
          .filter((e) => e.date.startsWith(month) && e.type === type)
          .reduce((acc, e) => acc + e.amount, 0)
      },

      getStreak: () => {
        const { entries } = get()
        const expenseDates = new Set(
          entries.filter((e) => e.type === 'expense').map((e) => dayjs(e.date).format('YYYY-MM-DD'))
        )
        if (expenseDates.size === 0) return 0
        let streak = 0
        let day = dayjs()
        // если сегодня нет трат — начинаем со вчера
        if (!expenseDates.has(dayjs().format('YYYY-MM-DD'))) {
          const yesterday = dayjs().subtract(1, 'day')
          if (expenseDates.has(yesterday.format('YYYY-MM-DD'))) day = yesterday
        }
        // считаем дни С тратами подряд
        while (expenseDates.has(day.format('YYYY-MM-DD'))) {
          streak++
          day = day.subtract(1, 'day')
          if (streak > 365) break
        }
        return streak
      },

      getChartData: () => {
        const { entries } = get()
        const map: Record<string, number> = {}
        entries.forEach((e) => {
          if (!map[e.date]) map[e.date] = 0
          map[e.date] += e.type === 'income' ? e.amount : -e.amount
        })
        return Object.entries(map)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-30)
          .map(([date, amount]) => ({ date, amount }))
      },
    }),
    { name: 'finance-store' }
  )
)
