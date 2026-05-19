import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import { createTelegramStorage } from '../lib/telegramStorage'
import { uid } from '../lib/uid'
import type { Habit } from '../types'

interface HabitsState {
  habits: Habit[]
  hydrated: boolean
  addHabit: (h: Omit<Habit, 'id' | 'createdAt' | 'completedDates'>) => void
  removeHabit: (id: string) => void
  toggleComplete: (id: string, date: string) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  getCompletedCount: (date: string) => number
  getStreak: (id: string) => number
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      hydrated: false,

      addHabit: (h) => {
        const habit: Habit = {
          ...h,
          id: uid(),
          completedDates: [],
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ habits: [...s.habits, habit] }))
      },

      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      toggleComplete: (id, date) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const has = h.completedDates.includes(date)
            return {
              ...h,
              completedDates: has
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            }
          }),
        })),

      updateHabit: (id, updates) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) })),

      getCompletedCount: (date) => get().habits.filter((h) => h.completedDates.includes(date)).length,

      getStreak: (id) => {
        const h = get().habits.find((x) => x.id === id)
        if (!h) return 0
        let streak = 0
        let day = dayjs()
        while (h.completedDates.includes(day.format('YYYY-MM-DD'))) {
          streak++
          day = day.subtract(1, 'day')
          if (streak > 365) break
        }
        return streak
      },
    }),
    {
      name: 'lifeos.habits',
      storage: createTelegramStorage<HabitsState>(),
      partialize: (s) => ({ habits: s.habits } as HabitsState),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
