import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon } from '../components/Icons'
import { Ring, BarChart, TickRow, Sparkline, RU_WD_SHORT } from '../components/Widgets'
import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useFinanceStore } from '../store/financeStore'
import { useDiaryStore } from '../store/diaryStore'
import { haptic } from '../lib/haptic'
import type { TabId } from '../types'

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
  onJumpTab?: (t: TabId) => void
}

export function Home({ selectedDate, onDateChange, onJumpTab }: Props) {
  const habits = useHabitsStore((s) => s.habits)
  const toggleHabit = useHabitsStore((s) => s.toggleComplete)
  const completedToday = useHabitsStore((s) => s.getCompletedCount)
  const goalsStats = useGoalsStore((s) => s.getStats)()
  const goals = useGoalsStore((s) => s.goals)
  const balance = useFinanceStore((s) => s.getBalance)()
  const monthlyIncome = useFinanceStore((s) => s.getMonthlyTotal)(dayjs().format('YYYY-MM'), 'income')
  const monthlyExpense = useFinanceStore((s) => s.getMonthlyTotal)(dayjs().format('YYYY-MM'), 'expense')
  const diary = useDiaryStore((s) => s.entries)
  const avgMood = useDiaryStore((s) => s.getAverageMood)(7)

  const today = dayjs().format('YYYY-MM-DD')
  const dayName = dayjs(selectedDate).format('dddd')
  const dayNumLabel = dayjs(selectedDate).format('D MMM')
  const total = habits.length
  const done = completedToday(today)
  const ringValue = total > 0 ? done / total : 0
  const userName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? 'друг'

  // sparkline of last 8 days of finance balance change
  const sparkValues = (() => {
    const days = Array.from({ length: 8 }, (_, i) => dayjs().subtract(7 - i, 'day').format('YYYY-MM-DD'))
    let running = 0
    return days.map((d) => {
      const day = useFinanceStore.getState().entries.filter((e) => e.date === d)
      day.forEach((e) => (running += e.type === 'income' ? e.amount : -e.amount))
      return running
    })
  })()

  // habits — 7-day bar chart (count of done habits per weekday this week)
  const week = Array.from({ length: 7 }, (_, i) => dayjs().startOf('isoWeek').add(i, 'day').format('YYYY-MM-DD'))
  const weekCounts = week.map((d) => habits.filter((h) => h.completedDates.includes(d)).length)
  const todayIdx = (dayjs().isoWeekday() - 1) % 7

  const featured = goals.find((g) => !g.completed)
  const featuredPct = featured?.progressTarget
    ? Math.min(1, (featured.progressCurrent ?? 0) / featured.progressTarget)
    : 0
  const diaryDone = diary.some((e) => e.date === today)

  // diary mood last 7 days
  const moodWeek = week.map((d) => diary.find((e) => e.date === d)?.mood ?? 0)

  // streak (consecutive days where at least 1 habit done)
  const streak = (() => {
    let s = 0
    let day = dayjs()
    while (habits.some((h) => h.completedDates.includes(day.format('YYYY-MM-DD')))) {
      s++
      day = day.subtract(1, 'day')
      if (s > 365) break
    }
    return s
  })()

  return (
    <>
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="scroll screen-enter">
        <div className="w-row between" style={{ padding: '4px 4px 14px' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Привет, {userName}</div>
            <div className="w-sub">
              {dayName}
              {total > 0 ? ` · осталось ${total - done} из ${total}` : ' · Добро пожаловать'}
            </div>
          </div>
          {streak > 0 && (
            <div className="pill accent">
              <Icon name="flame" size={12} color="#0a0a0b" /> {streak} {pluralDays(streak)}
            </div>
          )}
        </div>

        {/* Today hero */}
        <div className="widget" style={{ marginBottom: 8 }}>
          <div className="w-head">
            <div className="w-title accent">◆ Сегодня</div>
            <span className="w-label">{dayNumLabel}</span>
          </div>
          <div className="w-row" style={{ gap: 18, alignItems: 'center' }}>
            <Ring
              value={ringValue}
              size={92}
              stroke={10}
              label={total > 0 ? `${done}/${total}` : '+'}
              sublabel={total > 0 ? 'ПРИВЫЧЕК' : 'ПУСТО'}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <MiniProgress
                icon="check"
                label="Привычки"
                value={total > 0 ? `${done}/${total}` : '—'}
                pct={ringValue}
                color="var(--accent)"
              />
              <MiniProgress
                icon="target"
                label="Цели"
                value={goalsStats.total > 0 ? `${goalsStats.inProgress} актив.` : '—'}
                pct={goalsStats.total ? goalsStats.completed / goalsStats.total : 0}
                color="var(--cyan)"
              />
              <MiniProgress
                icon="book2"
                label="Дневник"
                value={diaryDone ? 'Заполнен' : 'Не заполнен'}
                pct={diaryDone ? 1 : 0}
                color="var(--violet)"
              />
            </div>
          </div>
        </div>

        {/* KPI grid 2x2 */}
        <div className="w-grid c2">
          <button className="widget tight" style={{ cursor: 'pointer', border: 0, textAlign: 'left' }} onClick={() => onJumpTab?.('habits')}>
            <div className="w-head">
              <div className="w-title accent"><Icon name="check" size={11} color="var(--accent)" /> ПРИВЫЧКИ</div>
            </div>
            <div className="w-row baseline" style={{ gap: 4, marginBottom: 8 }}>
              <span className="w-big">{done}</span>
              <span className="w-unit">{total > 0 ? `/${total}` : ''}</span>
            </div>
            <BarChart values={weekCounts.length ? weekCounts : [0, 0, 0, 0, 0, 0, 0]} hot={todayIdx} />
          </button>

          <button className="widget tight" style={{ cursor: 'pointer', border: 0, textAlign: 'left' }} onClick={() => onJumpTab?.('goals')}>
            <div className="w-head">
              <div className="w-title cyan"><Icon name="target" size={11} color="var(--cyan)" /> ЦЕЛИ</div>
            </div>
            {featured ? (
              <div className="w-row" style={{ gap: 10, alignItems: 'center' }}>
                <Ring value={featuredPct} size={56} stroke={6} color="var(--cyan)" label={`${Math.round(featuredPct * 100)}%`} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{featured.title}</div>
                  <div className="w-label" style={{ marginTop: 2 }}>
                    {featured.endDate ? `до ${dayjs(featured.endDate).format('D MMM')}` : 'без срока'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-label">Добавь первую цель →</div>
            )}
          </button>

          <button className="widget tight" style={{ cursor: 'pointer', border: 0, textAlign: 'left' }} onClick={() => onJumpTab?.('finance')}>
            <div className="w-head">
              <div className="w-title orange"><Icon name="wallet" size={11} color="var(--warn)" /> ФИНАНСЫ</div>
              <span className="w-label">{dayjs().format('MMM')}</span>
            </div>
            <div className="w-row baseline" style={{ gap: 4, marginBottom: 6 }}>
              <span className="w-mid">{formatK(balance)}</span>
              <span className="w-unit">₽</span>
            </div>
            <div className="w-row between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--good)' }}>↑ {formatK(monthlyIncome)}</span>
              <span style={{ fontSize: 10, color: 'var(--warn)' }}>↓ {formatK(monthlyExpense)}</span>
            </div>
            <Sparkline values={sparkValues.length > 1 ? sparkValues : [0, 0]} color="var(--warn)" height={28} />
          </button>

          <button className="widget tight" style={{ cursor: 'pointer', border: 0, textAlign: 'left' }} onClick={() => onJumpTab?.('diary')}>
            <div className="w-head">
              <div className="w-title violet"><Icon name="book2" size={11} color="var(--violet)" /> ДНЕВНИК</div>
            </div>
            <div className="w-row baseline" style={{ gap: 4, marginBottom: 8 }}>
              <span className="w-mid">{avgMood ? avgMood.toFixed(1) : '—'}</span>
              <span className="w-unit">средн. 7д</span>
            </div>
            <TickRow values={moodWeek.map((m) => m || 0.4)} color="var(--violet)" height={28} />
            <div className="bar-labels" style={{ marginTop: 4 }}>
              {RU_WD_SHORT.map((d, i) => (
                <span key={i} className={i === todayIdx ? 'hot' : ''}>{d}</span>
              ))}
            </div>
          </button>
        </div>

        {/* Today's habits */}
        <div className="sec-h">
          <span className="t">Привычки на сегодня</span>
          <button className="a" onClick={() => onJumpTab?.('habits')}>все →</button>
        </div>
        {habits.length === 0 ? (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            Привычек пока нет. Перейди в «Привычки» и добавь первую.
          </div>
        ) : (
          habits.slice(0, 6).map((h) => {
            const isDone = h.completedDates.includes(today)
            return (
              <button
                key={h.id}
                className={`lrow ${isDone ? 'done' : ''}`}
                onClick={() => {
                  toggleHabit(h.id, today)
                  haptic(isDone ? 'light' : 'success')
                }}
              >
                <div className={`check ${isDone ? 'done' : ''}`}>
                  {isDone && <Icon name="check" size={12} color="#0a0a0b" stroke={3} />}
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: 'var(--panel-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={(h.icon as any) ?? 'check'} size={14} color={h.color ?? 'var(--text-dim)'} />
                </div>
                <div className="meta">
                  <div className="t1">{h.title}</div>
                  <div className="t2">{isDone ? '✓ выполнено' : 'нажми чтобы отметить'}</div>
                </div>
                <Icon name="dots" size={16} color="var(--text-faint)" />
              </button>
            )
          })
        )}
      </div>
    </>
  )
}

function MiniProgress({
  icon, label, value, pct, color,
}: { icon: any; label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="w-row between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name={icon} size={12} color={color} /> {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
      </div>
      <div className="h-progress" style={{ height: 4 }}>
        <span style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%`, background: color }} />
      </div>
    </div>
  )
}

function formatK(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
  return Math.round(v).toString()
}

function pluralDays(n: number): string {
  const abs = Math.abs(n) % 100
  const n1 = abs % 10
  if (abs > 10 && abs < 20) return 'дней'
  if (n1 === 1) return 'день'
  if (n1 > 1 && n1 < 5) return 'дня'
  return 'дней'
}

