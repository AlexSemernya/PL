/**
 * One-time seed of demo data so the app feels alive on first open.
 * Real users can clear via long-press on items (planned).
 */
import dayjs from 'dayjs'
import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useFinanceStore } from '../store/financeStore'
import { useDiaryStore } from '../store/diaryStore'

const SEED_FLAG = 'lifeos.seeded.v1'

export async function seedDemoDataIfEmpty() {
  // wait a tick for stores to hydrate from CloudStorage
  await new Promise((r) => setTimeout(r, 200))

  const hadAny =
    useHabitsStore.getState().habits.length > 0 ||
    useGoalsStore.getState().goals.length > 0 ||
    useFinanceStore.getState().entries.length > 0 ||
    useDiaryStore.getState().entries.length > 0

  let alreadySeeded = false
  try {
    alreadySeeded = localStorage.getItem(SEED_FLAG) === '1'
  } catch {
    /* noop */
  }

  if (hadAny || alreadySeeded) return

  const today = dayjs()
  const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD')

  // ─ Habits ──────────────────────────────────────
  const habitsSeed = [
    { title: 'Вода — 2 л',          icon: 'drop',   color: '#4cd6ff', goal: 30, streak: 28 },
    { title: 'Пробежка',            icon: 'run',    color: '#c6f84e', goal: 30, streak: 12 },
    { title: 'Чтение — 30 мин',     icon: 'book2',  color: '#b59cff', goal: 60, streak: 47 },
    { title: 'Без кофе после 14:00', icon: 'coffee', color: '#ff8a3d', goal: 30, streak: 4 },
    { title: 'Сон 23:00',           icon: 'moon',   color: '#ff5a8a', goal: 30, streak: 3 },
    { title: 'Медитация — 10 мин',  icon: 'mood',   color: '#6be99a', goal: 30, streak: 0 },
    { title: 'Финский — 5 слов',    icon: 'edit',   color: '#4cd6ff', goal: 90, streak: 9 },
  ]
  habitsSeed.forEach((h) => {
    const completedDates: string[] = []
    for (let i = 0; i < h.streak; i++) {
      completedDates.push(fmt(today.subtract(i, 'day')))
    }
    useHabitsStore.getState().addHabit({
      title: h.title,
      frequency: 'daily',
      icon: h.icon,
      color: h.color,
      goal: h.goal,
    })
    // backfill completed dates
    const list = useHabitsStore.getState().habits
    const last = list[list.length - 1]!
    useHabitsStore.getState().updateHabit(last.id, { completedDates })
  })

  // Mark today's first 3 done so UI shows progress
  useHabitsStore.getState().habits.slice(0, 3).forEach((h) => {
    if (!h.completedDates.includes(fmt(today))) {
      useHabitsStore.getState().toggleComplete(h.id, fmt(today))
    }
  })

  // ─ Goals ───────────────────────────────────────
  useGoalsStore.getState().addGoal({
    title: 'Финский язык до B1',
    startDate: fmt(today.subtract(90, 'day')),
    endDate: fmt(today.add(92, 'day')),
    frequency: 'daily',
    color: '#c6f84e',
    tags: ['обучение', 'привычка'],
    progressCurrent: 92,
    progressTarget: 180,
    progressUnit: 'уроков',
  })
  useGoalsStore.getState().addGoal({
    title: 'Марафон 200 км',
    startDate: fmt(today.subtract(40, 'day')),
    endDate: fmt(today.add(80, 'day')),
    frequency: 'weekly',
    color: '#4cd6ff',
    progressCurrent: 68,
    progressTarget: 200,
    progressUnit: 'км',
  })
  useGoalsStore.getState().addGoal({
    title: 'Подушка безопасности',
    startDate: fmt(today.subtract(120, 'day')),
    endDate: fmt(today.add(180, 'day')),
    frequency: 'monthly',
    color: '#ff8a3d',
    progressCurrent: 340,
    progressTarget: 500,
    progressUnit: 'к ₽',
  })

  // ─ Finance ─────────────────────────────────────
  const fin = useFinanceStore.getState()
  // recent expenses through current month
  const txs: Array<{ day: number; amt: number; cat: any; note: string; type: 'income' | 'expense' }> = [
    { day: 0,  amt: 2380,  cat: 'food',         note: 'Перекрёсток',     type: 'expense' },
    { day: 1,  amt: 85000, cat: 'salary',       note: 'Зарплата',         type: 'income'  },
    { day: 1,  amt: 540,   cat: 'cafe',         note: 'Surf Coffee',      type: 'expense' },
    { day: 2,  amt: 299,   cat: 'subscriptions',note: 'Spotify Family',   type: 'expense' },
    { day: 3,  amt: 1820,  cat: 'food',         note: 'ВкусВилл',         type: 'expense' },
    { day: 5,  amt: 320,   cat: 'transport',    note: 'Метро',            type: 'expense' },
    { day: 7,  amt: 2400,  cat: 'cafe',         note: 'Ужин',             type: 'expense' },
    { day: 10, amt: 57000, cat: 'project',      note: 'Проект «Альфа»',   type: 'income'  },
    { day: 12, amt: 4200,  cat: 'shopping',     note: 'Одежда',           type: 'expense' },
    { day: 14, amt: 1100,  cat: 'transport',    note: 'Такси',            type: 'expense' },
    { day: 18, amt: 6800,  cat: 'food',         note: 'Продукты на неделю', type: 'expense' },
    { day: 20, amt: 990,   cat: 'subscriptions',note: 'iCloud 200ГБ',     type: 'expense' },
    { day: 22, amt: 3400,  cat: 'entertainment',note: 'Кино',             type: 'expense' },
    { day: 24, amt: 5200,  cat: 'food',         note: 'Перекрёсток',      type: 'expense' },
  ]
  txs.forEach((t) =>
    fin.addEntry({ amount: t.amt, category: t.cat, type: t.type, note: t.note, date: fmt(today.subtract(t.day, 'day')) }),
  )

  // ─ Diary ───────────────────────────────────────
  const diary = useDiaryStore.getState()
  diary.addEntry({
    date: fmt(today.subtract(1, 'day')),
    mood: 4,
    moodNote: 'Закрыли спринт раньше срока. Вечером прошёл 18к шагов и читал «Атомные привычки».',
    tags: ['работа', 'спорт'],
  })
  diary.addEntry({
    date: fmt(today.subtract(2, 'day')),
    mood: 3,
    moodNote: 'Тяжёлый понедельник. Много встреч, мало сделано по продукту.',
    tags: ['работа'],
  })
  diary.addEntry({
    date: fmt(today.subtract(3, 'day')),
    mood: 5,
    moodNote: 'Воскресенье мечты. Длинная пробежка в парке, обед с Леной, вечером финский.',
    tags: ['отдых', 'спорт', 'семья'],
  })

  try { localStorage.setItem(SEED_FLAG, '1') } catch { /* noop */ }
}
