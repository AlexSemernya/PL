// @ts-nocheck
import dayjs from 'dayjs'
import { useHabitsStore } from '../store/habitsStore'

export default function HabitHeatmap() {
  const habits = useHabitsStore(s => s.habits)
  const getCompletedCount = useHabitsStore(s => s.getCompletedCount)
  const total = habits.length
  const today = dayjs()
  const dow = today.day()
  const todayMon = dow === 0 ? 6 : dow - 1
  const startDate = today.subtract(todayMon + 12 * 7, 'day')
  const cells = []
  for (let col = 0; col < 13; col++) {
    for (let row = 0; row < 7; row++) {
      const date = startDate.add(col * 7 + row, 'day')
      const isFuture = date.isAfter(today)
      let level = 0
      if (!isFuture && total > 0) {
        const count = getCompletedCount(date.format('YYYY-MM-DD'))
        const r = count / total
        level = r === 0 ? 0 : r < 0.35 ? 1 : r < 0.65 ? 2 : r < 1 ? 3 : 4
      }
      cells.push(level)
    }
  }
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 18, padding: '14px 16px 12px', marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Активность привычек — 13 недель</div>
      <div style={{ display: 'flex', gap: 5 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {['П','В','С','Ч','П','С','В'].map(d => <div key={d} style={{ height: 13, display: 'flex', alignItems: 'center', fontSize: 9, fontWeight: 500, color: 'var(--color-text-muted)', width: 13 }}>{d}</div>)}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(7, 13px)', gridAutoFlow: 'column', gap: 3 }}>
          {cells.map((level, i) => <div key={i} style={{ borderRadius: 3, background: 'var(--hm-' + level + ')' }} />)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>меньше</span>
        <div style={{ display: 'flex', gap: 3 }}>{[0,1,2,3,4].map(v => <div key={v} style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--hm-' + v + ')' }} />)}</div>
        <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>больше</span>
      </div>
    </div>
  )
}
