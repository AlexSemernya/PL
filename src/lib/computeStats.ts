/**
 * Compute a stats snapshot from the local zustand stores. We push this to the
 * bot so friends see fresh numbers in the mountain leaderboard.
 *
 * Tier-weighted XP is computed here on the client because the bot doesn't see
 * individual habits/goals — only the aggregate snapshot. The legacy count
 * fields are still sent so the server can show 'X habits today' on the
 * profile, but the XP math now uses the new weighted values.
 */
import dayjs from 'dayjs'
import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useDiaryStore } from '../store/diaryStore'
import { HABIT_TIER_XP, GOAL_TIER_XP } from '../types'
import type { StatsSnapshot } from './botApi'

export function computeStatsSnapshot(): StatsSnapshot {
  const today = dayjs().format('YYYY-MM-DD')

  const habits = useHabitsStore.getState().habits
  const habits_total = habits.length
  const habits_done_today = habits.filter((h) => h.completedDates.includes(today)).length

  // Cumulative habit XP: for each habit, count every historical check-in and
  // multiply by its tier weight. New habits w/o tier default to 'normal'.
  let habit_xp_alltime = 0
  for (const h of habits) {
    const xp = HABIT_TIER_XP[h.tier ?? 'normal']
    habit_xp_alltime += h.completedDates.length * xp
  }

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

  // Goal XP — full tier reward on completion; partial reward (up to 30% of
  // tier XP) for active goals proportional to progressCurrent/progressTarget.
  // The 30% cap is intentional: it gives users tangible momentum for big
  // goals without letting partial progress dominate the leaderboard.
  let goal_xp_completed = 0
  let goal_xp_progress = 0
  for (const g of goals) {
    const xp = GOAL_TIER_XP[g.tier ?? 'normal']
    if (g.completed) {
      goal_xp_completed += xp
    } else if (g.progressTarget && g.progressTarget > 0) {
      const pct = Math.min(1, (g.progressCurrent ?? 0) / g.progressTarget)
      goal_xp_progress += Math.round(xp * pct * 0.3)
    }
  }

  const diary_entries = useDiaryStore.getState().entries.length

  return {
    habits_done_today,
    habits_total,
    goals_completed,
    goals_active,
    diary_entries,
    longest_streak,
    habit_xp_alltime,
    goal_xp_completed,
    goal_xp_progress,
  }
}
