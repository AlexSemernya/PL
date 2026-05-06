import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { telegramStorage } from '../lib/telegramStorage'
import { Goal, GoalStep } from '../types'
import dayjs from 'dayjs'

interface GoalsState {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'steps'>) => void
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

      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: crypto.randomUUID(),
          steps: [],
          completed: false,
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ goals: [...s.goals, newGoal] }))
      },

      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      toggleComplete: (id) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, completed: !g.completed } : g
          ),
        })),

      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      addStep: (goalId, title) => {
        const step: GoalStep = {
          id: crypto.randomUUID(),
          title,
          done: false,
        }
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, steps: [...g.steps, step] } : g
          ),
        }))
      },

      toggleStep: (goalId, stepId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  steps: g.steps.map((step) =>
                    step.id === stepId ? { ...step, done: !step.done } : step
                  ),
                }
              : g
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
    { name: 'goals-store' }
  )
)
