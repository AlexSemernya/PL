import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { telegramStorage } from '../lib/telegramStorage'
import { DiaryEntry, MoodLevel } from '../types'
import dayjs from 'dayjs'

interface DiaryState {
  entries: DiaryEntry[]
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void
  removeEntry: (id: string) => void
  getByDate: (date: string) => DiaryEntry | undefined
  getRecentEntries: (count: number) => DiaryEntry[]
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const newEntry: DiaryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ entries: [...s.entries, newEntry] }))
      },

      updateEntry: (id, updates) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      getByDate: (date) => get().entries.find((e) => e.date === date),

      getRecentEntries: (count) =>
        [...get().entries]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, count),
    }),
    { name: 'diary-store' }
  )
)
