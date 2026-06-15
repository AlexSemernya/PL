/**
 * Единый источник правды для категорий событий timeline.
 *
 * Каждая категория задаёт иконку, цвет circle-pin, цвет accent (для заметки)
 * и человекочитаемый label. Цвета выбраны чтобы быть визуально различимыми
 * в стиле скрина из Sunsama.
 */
import type { EventCategory } from '../types'
import type { IconName } from '../components/Icons'

export interface CategoryMeta {
  key: EventCategory
  label: string
  icon: IconName
  /** Фон circular icon — насыщенный цвет */
  color: string
  /** Цвет иконки внутри circle. Обычно белый, для светлых фонов — тёмный */
  fgColor: string
}

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  sleep:      { key: 'sleep',      label: 'Сон',         icon: 'moon',     color: '#5b8cff', fgColor: '#ffffff' },
  wake:       { key: 'wake',       label: 'Подъём',      icon: 'sparkle',  color: '#ffb43d', fgColor: '#0a0a0b' },
  cardio:     { key: 'cardio',     label: 'Кардио',      icon: 'run',      color: '#3dd6c4', fgColor: '#0a0a0b' },
  strength:   { key: 'strength',   label: 'Тренировка',  icon: 'flame',    color: '#a0a4ad', fgColor: '#ffffff' },
  food:       { key: 'food',       label: 'Еда',         icon: 'food',     color: '#6be99a', fgColor: '#0a0a0b' },
  recovery:   { key: 'recovery',   label: 'Восстан.',    icon: 'mood',     color: '#ff5a5a', fgColor: '#ffffff' },
  cold:       { key: 'cold',       label: 'Холод',       icon: 'drop',     color: '#4cd6ff', fgColor: '#0a0a0b' },
  meditation: { key: 'meditation', label: 'Медитация',   icon: 'leaf',     color: '#b59cff', fgColor: '#ffffff' },
  work:       { key: 'work',       label: 'Работа',      icon: 'edit',     color: '#8e6b3e', fgColor: '#ffffff' },
  study:      { key: 'study',      label: 'Учёба',       icon: 'book2',    color: '#ff8a3d', fgColor: '#ffffff' },
  social:     { key: 'social',     label: 'Общение',     icon: 'users',    color: '#ff5a8a', fgColor: '#ffffff' },
  other:      { key: 'other',      label: 'Другое',      icon: 'star',     color: '#7a7d83', fgColor: '#ffffff' },
}

export const CATEGORY_LIST: CategoryMeta[] = [
  CATEGORY_META.sleep,
  CATEGORY_META.wake,
  CATEGORY_META.cardio,
  CATEGORY_META.strength,
  CATEGORY_META.food,
  CATEGORY_META.recovery,
  CATEGORY_META.cold,
  CATEGORY_META.meditation,
  CATEGORY_META.work,
  CATEGORY_META.study,
  CATEGORY_META.social,
  CATEGORY_META.other,
]

/** Формат длительности: 90 → '1 ч 30 мин', 30 → '30 мин', 0/undef → ''. */
export function formatDuration(min: number | undefined): string {
  if (!min || min <= 0) return ''
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

/** Сравнить два времени 'HH:MM' для сортировки */
export function timeCompare(a: string, b: string): number {
  return a.localeCompare(b)
}

/** 'HH:MM' текущего момента */
export function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
