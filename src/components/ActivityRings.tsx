// @ts-nocheck
import dayjs from 'dayjs'
import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useFinanceStore } from '../store/financeStore'

const DAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В']

export default function ActivityRings() {
  const habits = useHabitsStore(s => s.habits)
  const getCompletedCount = useHabitsStore(s => s.getCompletedCount)
  const { total: goalsTotal, inProgress: goalsActive } = useGoalsStore(s => s.getStats())
  const finStreak = useFinanceStore(s => s.getStreak())
  const today = dayjs().format('YYYY-MM-DD')
  const completedToday = getCompletedCount(today)
  const total = habits.length
  const habitPct = total > 0 ? completedToday / total : 0
  const goalPct = goalsTotal > 0 ? goalsActive / goalsTotal : 0
  const streakPct = Math.min(finStreak / 30, 1)
  const dow = dayjs().day()
  const todayMon = dow === 0 ? 6 : dow - 1
  function arc(pct, r) {
    const C = 2 * Math.PI * r
    return pct * C + ' ' + C
  }
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 18, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Привычки</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
          <circle cx="42" cy="42" r="36" fill="none" style={{ stroke: 'var(--ring-bg)' }} strokeWidth="6.5" />
          <circle cx="42" cy="42" r="36" fill="none" style={{ stroke: 'var(--color-accent)' }} strokeWidth="6.5" strokeDasharray={arc(habitPct, 36)} strokeLinecap="round" transform="rotate(-90 42 42)" />
          <circle cx="42" cy="42" r="27.5" fill="none" style={{ stroke: 'var(--ring-bg)' }} strokeWidth="5.5" />
          <circle cx="42" cy="42" r="27.5" fill="none" style={{ stroke: 'var(--color-accent-2)' }} strokeWidth="5.5" strokeDasharray={arc(goalPct, 27.5)} strokeLinecap="round" transform="rotate(-90 42 42)" />
          <circle cx="42" cy="42" r="19" fill="none" style={{ stroke: 'var(--ring-bg)' }} strokeWidth="5" />
          <circle cx="42" cy="42" r="19" fill="none" style={{ stroke: 'var(--color-accent-dim)' }} strokeWidth="5" strokeDasharray={arc(streakPct, 19)} strokeLinecap="round" transform="rotate(-90 42 42)" />
        </svg>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.1px', color: 'var(--color-text)', lineHeight: 1 }}>{completedToday}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.38 }}>/{total}</span></div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>сегодня</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 9, fontSize: 11, fontWeight: 700, background: 'var(--badge-bg)', color: 'var(--badge-text)', marginTop: 7 }}>🔥 {finStreak} дней</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 9 }}>
        {DAYS.map((d, i) => {
          const isToday = i === todayMon
          const isDone = i < todayMon
          return <div key={i} style={{ width: 21, height: 21, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: isToday ? 'var(--color-accent)' : isDone ? 'var(--day-done-bg)' : 'rgba(128,128,128,0.1)', color: isToday ? '#fff' : isDone ? 'var(--day-done-text)' : 'var(--color-text-muted)' }}>{d}</div>
        })}
      </div>
    </div>
  )
}
