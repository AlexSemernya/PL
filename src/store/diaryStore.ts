import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import { createTelegramStorage } from '../lib/telegramStorage'
import { uid } from '../lib/uid'
import type { DiaryEntry } from '../types'

interface DiaryState {
  entries: DiaryEntry[]
  hydrated: boolean
  addEntry: (e: Omit<DiaryEntry, 'id' | 'createdAt'>) => void
  upsertToday: (mood: DiaryEntry['mood'], text?: string, tags?: string[]) => void
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void
  removeEntry: (id: string) => void
  getByDate: (date: string) => DiaryEntry | undefined
  getRecentEntries: (count: number) => DiaryEntry[]
  getAverageMood: (lastNdays: number) => number
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,

      addEntry: (e) => {
        const entry: DiaryEntry = { ...e, id: uid(), createdAt: dayjs().toISOString() }
        set((s) => ({ entries: [...s.entries, entry] }))
      },

      upsertToday: (mood, text, tags) => {
        const today = dayjs().format('YYYY-MM-DD')
        const existing = get().entries.find((e) => e.date === today)
        if (existing) {
          set((s) => ({
            entries: s.entries.map((e) =>
              e.id === existing.id ? { ...e, mood, moodNote: text ?? e.moodNote, tags: tags ?? e.tags } : e,
            ),
          }))
        } else {
          get().addEntry({ date: today, mood, moodNote: text ?? '', tags })
        }
      },

      updateEntry: (id, updates) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),

      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      getByDate: (date) => get().entries.find((e) => e.date === date),

      getRecentEntries: (count) =>
        [...get().entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, count),

      getAverageMood: (n) => {
        const start = dayjs().subtract(n - 1, 'day').format('YYYY-MM-DD')
        const recent = get().entries.filter((e) => e.date >= start)
        if (recent.length === 0) return 0
        return recent.reduce((a, e) => a + e.mood, 0) / recent.length
      },
    }),
    {
      name: 'lifeos.diary',
      storage: createTelegramStorage<DiaryState>(),
      partialize: (s) => ({ entries: s.entries } as DiaryState),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
