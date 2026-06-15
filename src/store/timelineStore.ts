/**
 * Timeline-store: события дня (расписание / лог).
 *
 * Поддерживает два сценария:
 *  1. Ручное создание/редактирование — addEvent / updateEvent / removeEvent
 *  2. Авто-события из других сторов (habitsStore при чеке, goalsStore при
 *     завершении). Такие события несут поле `source` и управляются через
 *     upsertSourceEvent / removeSourceEvent — это поддерживает идемпотентность
 *     при чек/uncheck и фиксирует одну и ту же привычку только один раз
 *     для конкретной даты.
 *
 * Хранится через тот же telegramStorage-helper что и остальные сторы
 * (CloudStorage → IDB → localStorage).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import { createTelegramStorage } from '../lib/telegramStorage'
import { uid } from '../lib/uid'
import { timeCompare } from '../lib/eventCategories'
import type { DayEvent } from '../types'

interface TimelineState {
  events: DayEvent[]
  hydrated: boolean

  /** Все события за указанную дату, отсортированы по времени */
  getEventsForDate: (date: string) => DayEvent[]

  /** Полностью ручное создание (из формы) */
  addEvent: (e: Omit<DayEvent, 'id' | 'createdAt'>) => string

  removeEvent: (id: string) => void

  updateEvent: (id: string, updates: Partial<DayEvent>) => void

  toggleDone: (id: string) => void

  /**
   * Создать или обновить авто-событие, связанное с источником (привычка/цель).
   * Если событие с такой парой (source.kind, source.refId, date) уже есть —
   * обновляется (новое время/title). Иначе создаётся.
   */
  upsertSourceEvent: (
    source: { kind: 'habit' | 'goal' | 'finance'; refId: string },
    date: string,
    fields: Omit<DayEvent, 'id' | 'createdAt' | 'date' | 'source'>,
  ) => void

  /**
   * Удалить авто-событие по источнику за указанную дату. Используется когда
   * юзер снимает чек привычки.
   */
  removeSourceEvent: (
    source: { kind: 'habit' | 'goal' | 'finance'; refId: string },
    date: string,
  ) => void

  /** Скопировать структуру (без времени-смещений) из предыдущей даты в новую */
  copyFromDate: (sourceDate: string, targetDate: string) => void
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      events: [],
      hydrated: false,

      getEventsForDate: (date) =>
        get()
          .events.filter((e) => e.date === date)
          .slice()
          .sort((a, b) => timeCompare(a.time, b.time)),

      addEvent: (e) => {
        const id = uid()
        const event: DayEvent = {
          ...e,
          id,
          createdAt: dayjs().toISOString(),
        }
        set((s) => ({ events: [...s.events, event] }))
        return id
      },

      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      toggleDone: (id) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, done: !e.done } : e,
          ),
        })),

      upsertSourceEvent: (source, date, fields) => {
        const existing = get().events.find(
          (e) =>
            e.date === date &&
            e.source &&
            e.source.kind === source.kind &&
            e.source.refId === source.refId,
        )
        if (existing) {
          set((s) => ({
            events: s.events.map((e) =>
              e.id === existing.id ? { ...e, ...fields } : e,
            ),
          }))
        } else {
          const event: DayEvent = {
            ...fields,
            id: uid(),
            date,
            source,
            createdAt: dayjs().toISOString(),
          }
          set((s) => ({ events: [...s.events, event] }))
        }
      },

      removeSourceEvent: (source, date) =>
        set((s) => ({
          events: s.events.filter(
            (e) =>
              !(
                e.date === date &&
                e.source &&
                e.source.kind === source.kind &&
                e.source.refId === source.refId
              ),
          ),
        })),

      copyFromDate: (sourceDate, targetDate) => {
        const sourceEvents = get().events.filter((e) => e.date === sourceDate)
        if (sourceEvents.length === 0) return
        const copies: DayEvent[] = sourceEvents.map((e) => ({
          ...e,
          id: uid(),
          date: targetDate,
          done: false,                 // сбрасываем выполненность
          source: undefined,           // копии — независимые ручные события
          createdAt: dayjs().toISOString(),
        }))
        set((s) => ({ events: [...s.events, ...copies] }))
      },
    }),
    {
      name: 'lifeos_timeline',
      storage: createTelegramStorage<TimelineState>(),
      partialize: (s) => ({ events: s.events } as TimelineState),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)
