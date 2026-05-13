import { useState } from 'react'
import { useHabitsStore } from '../store/habitsStore'
import CalendarHeader from '../components/CalendarHeader'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

interface HabitsProps {
  selectedDate: string
  onDateChange: (d: string) => void
}

export default function Habits({ selectedDate, onDateChange }: HabitsProps) {
  const { habits, addHabit, toggleComplete, removeHabit } = useHabitsStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addHabit({ title: newTitle.trim(), frequency: 'daily' })
    setNewTitle('')
    setShowAdd(false)
  }

  // Данные для графика: последние 30 дней
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = dayjs().subtract(29 - i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const count = habits.filter((h) => h.completedDates.includes(dateStr)).length
    return {
      date: date.format('D MMM'),
      value: count,
    }
  })

  return (
    <div className="animate-slide-up">
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="page-scroll px-4 pt-4 pb-4">
        {/* Список привычек */}
        {habits.length === 0 ? (
          <div className="card text-center py-10 text-text-secondary text-sm">
            Привычек нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {habits.map((habit) => {
              const done = habit.completedDates.includes(selectedDate)
              return (
                <div
                  key={habit.id}
                  className="card flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleComplete(habit.id, selectedDate)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        done ? 'bg-accent border-accent' : 'border-border'
                      }`}
                    >
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-[15px] font-medium ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                      {habit.title}
                    </span>
                  </div>
                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="w-7 h-7 flex items-center justify-center text-text-muted"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Кнопка добавить */}
        {showAdd ? (
          <div className="mt-3 card">
            <input
              autoFocus
              type="text"
              placeholder="Название привычки"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full text-[15px] outline-none bg-transparent text-text-primary placeholder:text-text-muted"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAdd}
                className="flex-1 bg-accent text-white rounded-xl py-2 text-sm font-medium"
              >
                Добавить
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewTitle('') }}
                className="flex-1 bg-icon-bg text-text-secondary rounded-xl py-2 text-sm font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="btn-add mt-3">
            + Добавить привычку
          </button>
        )}

        {/* График */}
        {habits.length > 0 && (
          <div className="card mt-4">
            <p className="text-xs text-text-secondary font-medium mb-3">Достижение цели по привычкам</p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="habitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F7FFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F7FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#8E8E93' }}
                  interval={9}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#8E8E93' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  formatter={(v: number) => [v, 'Выполнено']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4F7FFF"
                  strokeWidth={2}
                  fill="url(#habitsGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
