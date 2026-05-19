import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import { createTelegramStorage } from '../lib/telegramStorage'
import { uid } from '../lib/uid'
import type { FinanceEntry, FinanceGoal, FinanceType } from '../types'

interface FinanceState {
  entries: FinanceEntry[]
  goals: FinanceGoal[]
  hydrated: boolean
  addEntry: (e: Omit<FinanceEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  addGoal: (g: Omit<FinanceGoal, 'id' | 'createdAt'>) => void
  removeGoal: (id: string) => void
  updateGoalAmount: (id: string, amount: number) => void
  getBalance: () => number
  getMonthlyTotal: (month: string, type: FinanceType) => number
  getCategoryBreakdown: (month: string) => Array<{ category: string; amount: number }>
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      entries: [],
      goals: [],
      hydrated: false,

      addEntry: (e) => {
        const entry: FinanceEntry = { ...e, id: uid(), createdAt: dayjs().toISOString() }
        set((s) => ({ entries: [...s.entries, entry] }))
      },

      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      addGoal: (g) => {
        const goal: FinanceGoal = { ...g, id: uid(), createdAt: dayjs().toISOString() }
        set((s) => ({ goals: [...s.goals, goal] }))
      },

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      updateGoalAmount: (id, amount) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, currentAmount: amount } : g)) })),

      getBalance: () =>
        get().entries.reduce((acc, e) => (e.type === 'income' ? acc + e.amount : acc - e.amount), 0),

      getMonthlyTotal: (month, type) =>
        get()
          .entries.filter((e) => e.date.startsWith(month) && e.type === type)
          .reduce((acc, e) => acc + e.amount, 0),

      getCategoryBreakdown: (month) => {
        const map: Record<string, number> = {}
        get()
          .entries.filter((e) => e.date.startsWith(month) && e.type === 'expense')
          .forEach((e) => {
            map[e.category] = (map[e.category] ?? 0) + e.amount
          })
        return Object.entries(map)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
      },
    }),
    {
      name: 'lifeos.finance',
      storage: createTelegramStorage<FinanceState>(),
      partialize: (s) => ({ entries: s.entries, goals: s.goals } as FinanceState),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
