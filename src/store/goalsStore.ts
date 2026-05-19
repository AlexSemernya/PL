import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import { createTelegramStorage } from '../lib/telegramStorage'
import { uid } from '../lib/uid'
import type { Goal, GoalStep } from '../types'

interface GoalsState {
  goals: Goal[]
  hydrated: boolean
  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'steps'>) => void
  removeGoal: (id: string) => void
  toggleComplete: (id: string) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  addStep: (goalId: string, title: string) => void
  toggleStep: (goalId: string, stepId: string) => void
  getStats: () => { total: number; completed: number; inProgress: number; percent: number }
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      hydrated: false,

      addGoal: (g) => {
        const goal: Goal = {
          ...g,
          id: uid(),
          steps: [],
          completed: false,
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ goals: [...s.goals, goal] }))
      },

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      toggleComplete: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)) })),

      updateGoal: (id, updates) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),

      addStep: (goalId, title) => {
        const step: GoalStep = { id: uid(), title, done: false }
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, steps: [...g.steps, step] } : g)),
        }))
      },

      toggleStep: (goalId, stepId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, steps: g.steps.map((s2) => (s2.id === stepId ? { ...s2, done: !s2.done } : s2)) }
              : g,
          ),
        })),

      getStats: () => {
        const { goals } = get()
        const total = goals.length
        const completed = goals.filter((g) => g.completed).length
        const inProgress = total - completed
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        return { total, completed, inProgress, percent }
      },
    }),
    {
      name: 'lifeos_goals',
      storage: createTelegramStorage<GoalsState>(),
      partialize: (s) => ({ goals: s.goals } as GoalsState),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
