// @ts-nocheck
import { useGoalsStore } from '../store/goalsStore'

export default function GoalsCard() {
  const goals = useGoalsStore(s => s.goals)
  const { inProgress: goalsActive } = useGoalsStore(s => s.getStats())
  const activeGoals = goals.filter(g => !g.completed).slice(0, 3)
  const colors = ['var(--color-accent)', 'var(--color-accent-2)', 'var(--color-accent-dim)']
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 18, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Цели</div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.1px', color: 'var(--color-text)', lineHeight: 1 }}>{goalsActive}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.38 }}> акт.</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
        {activeGoals.length > 0 ? activeGoals.map((g, i) => {
          const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
          return <div key={g.id}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{g.title}</span><span style={{ fontSize: 11, fontWeight: 700, color: colors[i] }}>{pct}%</span></div><div style={{ height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: colors[i] }} /></div></div>
        }) : <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Добавь цели чтобы видеть прогресс</div>}
      </div>
    </div>
  )
}
