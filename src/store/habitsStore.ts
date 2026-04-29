import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Habit } from '../types'
import dayjs from 'dayjs'

interface HabitsState {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates'>) => void
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

      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: crypto.randomUUID(),
          completedDates: [],
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ habits: [...s.habits, newHabit] }))
      },

      removeHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      toggleComplete: (id, date) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const already = h.completedDates.includes(date)
            return {
              ...h,
              completedDates: already
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            }
          }),
        })),

      updateHabit: (id, updates) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        })),

      getCompletedCount: (date) => {
        const { habits } = get()
        return habits.filter((h) => h.completedDates.includes(date)).length
      },

      getStreak: (id) => {
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return 0
        let streak = 0
        let day = dayjs()
        while (habit.completedDates.includes(day.format('YYYY-MM-DD'))) {
          streak++
          day = day.subtract(1, 'day')
        }
        return streak
      },
    }),
    { name: 'habits-store' }
  )
)
