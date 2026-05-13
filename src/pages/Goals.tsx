import { useState } from 'react'
import { useGoalsStore } from '../store/goalsStore'
import CalendarHeader from '../components/CalendarHeader'
import dayjs from 'dayjs'

interface GoalsProps {
  selectedDate: string
  onDateChange: (d: string) => void
}

export default function Goals({ selectedDate, onDateChange }: GoalsProps) {
  const { goals, addGoal, toggleComplete, removeGoal, getStats } = useGoalsStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', startDate: dayjs().format('YYYY-MM-DD'), endDate: '' })

  const stats = getStats()

  const handleAdd = () => {
    if (!form.title.trim()) return
    addGoal({
      title: form.title.trim(),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      frequency: 'daily',
      reminder: undefined,
    })
    setForm({ title: '', startDate: dayjs().format('YYYY-MM-DD'), endDate: '' })
    setShowAdd(false)
  }

  return (
    <div className="animate-slide-up">
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="page-scroll px-4 pt-4 pb-4">
        {/* Список целей */}
        {goals.length === 0 ? (
          <div className="card text-center py-10 text-text-secondary text-sm">
            Целей нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {goals.map((goal) => (
              <div key={goal.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleComplete(goal.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        goal.completed ? 'bg-accent border-accent' : 'border-border'
                      }`}
                    >
                      {goal.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p className={`text-[15px] font-medium ${goal.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                        {goal.title}
                      </p>
                      {goal.endDate && (
                        <p className="text-xs text-text-muted mt-0.5">
                          до {dayjs(goal.endDate).format('D MMM YYYY')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="w-7 h-7 flex items-center justify-center text-text-muted"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Форма добавления */}
        {showAdd ? (
          <div className="mt-3 card flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Введите цель"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-[15px] outline-none bg-transparent text-text-primary placeholder:text-text-muted"
            />
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Дата начала</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="text-text-primary text-sm outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Дата окончания</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="text-text-primary text-sm outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={handleAdd} className="flex-1 bg-accent text-white rounded-xl py-2 text-sm font-medium">
                Добавить
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-icon-bg text-text-secondary rounded-xl py-2 text-sm font-medium">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="btn-add mt-3">
            + Добавить цель
          </button>
        )}

        {/* Статистика */}
        {goals.length > 0 && (
          <div className="card mt-4 flex items-center gap-4">
            {/* Круговой прогресс */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#E5E5EA" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke="#4F7FFF" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - stats.percent / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-text-primary">{stats.percent}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-text-secondary">Всего целей: <b className="text-text-primary">{stats.total}</b></span>
              <span className="text-text-secondary">Выполнено: <b className="text-text-primary">{stats.completed}</b></span>
              <span className="text-text-secondary">Невыполнено: <b className="text-text-primary">{stats.inProgress}</b></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
