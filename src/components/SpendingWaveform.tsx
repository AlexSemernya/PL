// @ts-nocheck
import dayjs from 'dayjs'
import { useFinanceStore } from '../store/financeStore'

const BAR_W = 7, GAP = 3, MAX_H = 72, DAYS = 30

export default function SpendingWaveform() {
  const getChartData = useFinanceStore(s => s.getChartData)
  const getStreak = useFinanceStore(s => s.getStreak)
  const getMonthlyTotal = useFinanceStore(s => s.getMonthlyTotal)
  const chartData = getChartData()
  const streak = getStreak()
  const monthlyExpenses = getMonthlyTotal(dayjs().format('YYYY-MM'), 'expense')
  const todayStr = dayjs().format('YYYY-MM-DD')
  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = dayjs().subtract(DAYS - 1 - i, 'day').format('YYYY-MM-DD')
    const entry = chartData.find(d => d.date === date)
    return { date, amount: entry ? Math.abs(entry.amount) : 0 }
  })
  const todayIdx = days.findIndex(d => d.date === todayStr)
  const maxAmount = Math.max(...days.map(d => d.amount), 1)
  const W = DAYS * (BAR_W + GAP) - GAP
  const fmt = n => n >= 1000 ? '-' + (n/1000).toFixed(1) + 'к ₽' : '-' + Math.round(n).toLocaleString('ru-RU') + ' ₽'
  return (
    <div style={{ background: 'var(--fin-bg)', borderRadius: 18, padding: '16px 16px 14px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--fin-title)', marginBottom: 4 }}>Расходы · {dayjs().format('MMMM')}</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: 'var(--fin-amt)', lineHeight: 1 }}>{monthlyExpenses > 0 ? fmt(monthlyExpenses) : '0 ₽'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--fin-title)', marginBottom: 4 }}>Серия</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: 'var(--color-accent)', lineHeight: 1 }}>{streak} 🔥</div>
        </div>
      </div>
      <div style={{ margin: '12px 0 10px', overflow: 'hidden' }}>
        <svg width="100%" height={MAX_H + 14} viewBox={'0 -14 ' + W + ' ' + (MAX_H + 14)} preserveAspectRatio="none" style={{ display: 'block' }}>
          {days.map((d, i) => {
            const x = i * (BAR_W + GAP)
            const isFuture = todayIdx >= 0 && i > todayIdx
            const isToday = i === todayIdx
            const bh = isFuture ? 8 : d.amount > 0 ? Math.max(10, (d.amount / maxAmount) * (MAX_H - 10) + 10) : 10
            const age = todayIdx > 0 ? (todayIdx - i) / todayIdx : 0
            const opacity = isFuture ? 1 : isToday ? 1 : Math.max(0.25, 1 - age * 0.55)
            return <rect key={i} x={x} y={MAX_H - bh} width={BAR_W} height={bh} rx="3.5" fill={isFuture ? 'var(--bar-future)' : 'var(--color-accent)'} opacity={opacity} />
          })}
          {todayIdx >= 0 && <line x1={todayIdx*(BAR_W+GAP)+BAR_W/2} y1={-2} x2={todayIdx*(BAR_W+GAP)+BAR_W/2} y2={MAX_H} stroke="var(--color-accent)" strokeWidth=".5" strokeDasharray="3 2" opacity=".4" />}
          {[10,20].map(n => <text key={n} x={n*(BAR_W+GAP)+BAR_W/2} y={-4} textAnchor="middle" fontSize="9" fill="var(--fin-title)" fontWeight="500">{n}</text>)}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--fin-title)' }}>{dayjs().subtract(DAYS-1,'day').format('D MMM')}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent)' }}>· сегодня ·</span>
        <span style={{ fontSize: 10, color: 'var(--fin-title)' }}>{dayjs().format('D MMM')}</span>
      </div>
    </div>
  )
}
