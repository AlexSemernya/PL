import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import { createTelegramStorage } from '../lib/telegramStorage'
import { uid } from '../lib/uid'
import type { Habit, EventCategory } from '../types'
import { useTimelineStore } from './timelineStore'
import { nowHHMM } from '../lib/eventCategories'

// Маппинг иконки привычки → категория timeline-события.
// Дефолт — 'other'. Этот список покрывает самые частые иконки
// (см. ICON_OPTIONS в Habits.tsx).
const ICON_TO_CATEGORY: Record<string, EventCategory> = {
  drop: 'food',        // вода
  run: 'cardio',
  shoe: 'cardio',
  book2: 'study',
  coffee: 'food',
  moon: 'sleep',
  mood: 'recovery',
  food: 'food',
  edit: 'work',
  star: 'other',
}

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

      toggleComplete: (id, date) => {
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return
        const wasDone = habit.completedDates.includes(date)
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            return {
              ...h,
              completedDates: wasDone
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            }
          }),
        }))
        // Sync с timeline: при чек-ине создаём событие, при снятии — удаляем
        const timeline = useTimelineStore.getState()
        const source = { kind: 'habit' as const, refId: id }
        if (wasDone) {
          timeline.removeSourceEvent(source, date)
        } else {
          const category = ICON_TO_CATEGORY[habit.icon ?? ''] ?? 'other'
          // Если отмечаем сегодняшнюю — ставим текущее время; для прошлых
          // дат — полдень как разумный дефолт
          const isToday = date === dayjs().format('YYYY-MM-DD')
          timeline.upsertSourceEvent(source, date, {
            time: isToday ? nowHHMM() : '12:00',
            title: habit.title,
            category,
            done: true,
          })
        }
      },

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
      name: 'lifeos_habits',
      storage: createTelegramStorage<HabitsState>(),
      partialize: (s) => ({ habits: s.habits } as HabitsState),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
