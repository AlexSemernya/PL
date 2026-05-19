/**
 * Compute a stats snapshot from the local zustand stores. We push this to the
 * bot so friends see fresh numbers in the mountain leaderboard.
 *
 * Counters are deliberately simple — XP/level math lives on the bot so
 * everyone uses identical formulas.
 */
import dayjs from 'dayjs'
import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useDiaryStore } from '../store/diaryStore'
import type { StatsSnapshot } from './botApi'

export function computeStatsSnapshot(): StatsSnapshot {
  const today = dayjs().format('YYYY-MM-DD')

  const habits = useHabitsStore.getState().habits
  const habits_total = habits.length
  const habits_done_today = habits.filter((h) => h.completedDates.includes(today)).length

  // longest streak across all habits (current — not historical best)
  let longest_streak = 0
  for (const h of habits) {
    let s = 0
    let day = dayjs()
    while (h.completedDates.includes(day.format('YYYY-MM-DD'))) {
      s++
      day = day.subtract(1, 'day')
      if (s > 365) break
    }
    if (s > longest_streak) longest_streak = s
  }

  const goals = useGoalsStore.getState().goals
  const goals_completed = goals.filter((g) => g.completed).length
  const goals_active = goals.length - goals_completed

  const diary_entries = useDiaryStore.getState().entries.length

  return {
    habits_done_today,
    habits_total,
    goals_completed,
    goals_active,
    diary_entries,
    longest_streak,
  }
}
