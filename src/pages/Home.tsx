import { useHabitsStore } from '../store/habitsStore'
import { useGoalsStore } from '../store/goalsStore'
import { useFinanceStore } from '../store/financeStore'
import CalendarHeader from '../components/CalendarHeader'
import dayjs from 'dayjs'

interface HomeProps {
  selectedDate: string
  onDateChange: (d: string) => void
}

export default function Home({ selectedDate, onDateChange }: HomeProps) {
  const habits = useHabitsStore((s) => s.habits)
  const completedCount = useHabitsStore((s) => s.getCompletedCount(selectedDate))
  const balance = useFinanceStore((s) => s.getBalance())
  const streak = useFinanceStore((s) => s.getStreak())
  const { total: goalsTotal, inProgress: goalsActive } = useGoalsStore((s) => s.getStats())

  const formatBalance = (n: number) => {
    const abs = Math.abs(n)
    return (n < 0 ? '-' : '') + abs.toLocaleString('ru-RU')
  }

  return (
    <div className="animate-slide-up">
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="page-scroll px-4 pt-4 pb-4">
        {/* Виджеты 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Привычки */}
          <div className="card flex flex-col gap-1">
            <span className="text-xs text-text-secondary font-medium">Привычки</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-3xl font-bold text-text-primary">
                {completedCount}
                <span className="text-lg text-text-secondary font-normal">/{habits.length || 0}</span>
              </span>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-icon-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
          </div>

          {/* Баланс */}
          <div className="card flex flex-col gap-1">
            <span className="text-xs text-text-secondary font-medium">Баланс</span>
            <span className="text-2xl font-bold text-text-primary mt-1">
              {formatBalance(balance)}
            </span>
          </div>

          {/* Финансовая серия */}
          <div className="card flex flex-col gap-1">
            <span className="text-xs text-text-secondary font-medium">Финансовая серия</span>
            <span className="text-3xl font-bold text-text-primary mt-1">{streak} дней</span>
            <span className="text-xs text-text-secondary">без лишних трат</span>
            <div className="flex justify-end mt-1">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-icon-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Цели */}
          <div className="card flex flex-col gap-1">
            <span className="text-xs text-text-secondary font-medium">Цели</span>
            <span className="text-3xl font-bold text-text-primary mt-1">{goalsActive}</span>
            <span className="text-xs text-text-secondary">активные</span>
            <div className="flex justify-end mt-1">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-icon-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0012 0V2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Пустое состояние */}
        {habits.length === 0 && goalsTotal === 0 && (
          <div className="mt-6 card text-center text-text-secondary text-sm py-6">
            Добавь привычки и цели, чтобы видеть прогресс здесь
          </div>
        )}
      </div>
    </div>
  )
}
