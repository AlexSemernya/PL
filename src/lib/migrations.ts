/**
 * One-shot migrations that run on app boot.
 *
 * Each migration is gated by a localStorage flag — once it's run, it won't
 * run again on the same device. (Telegram CloudStorage syncs the actual app
 * data, but the flag lives in localStorage so each device clears its cached
 * demo data exactly once.)
 */
import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useFinanceStore } from '../store/financeStore'
import { useDiaryStore } from '../store/diaryStore'

const FLAG_WIPE_DEMO = 'lifeos.migrated.wipe-demo.v1'

// Wait until persist middleware has hydrated all stores from CloudStorage,
// then clear them. We poll the `hydrated` flag we set in onRehydrateStorage.
async function waitForHydration(maxMs = 2500): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (
      useHabitsStore.getState().hydrated &&
      useGoalsStore.getState().hydrated &&
      useFinanceStore.getState().hydrated &&
      useDiaryStore.getState().hydrated
    ) return
    await new Promise((r) => setTimeout(r, 80))
  }
}

export async function runMigrations() {
  let alreadyRun = false
  try { alreadyRun = localStorage.getItem(FLAG_WIPE_DEMO) === '1' } catch { /* noop */ }
  if (alreadyRun) return

  await waitForHydration()

  // Wipe demo-data left over from the first deploy. Real user data added
  // after this migration runs won't be touched (flag gets set immediately).
  useHabitsStore.setState({ habits: [] })
  useGoalsStore.setState({ goals: [] })
  useFinanceStore.setState({ entries: [], goals: [] })
  useDiaryStore.setState({ entries: [] })

  try { localStorage.setItem(FLAG_WIPE_DEMO, '1') } catch { /* noop */ }
}
