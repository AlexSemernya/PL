import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import WeekCalendar from './WeekCalendar'
import MonthCalendar from './MonthCalendar'

dayjs.locale('ru')

interface CalendarHeaderProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export default function CalendarHeader({ selectedDate, onDateChange }: CalendarHeaderProps) {
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate).format('YYYY-MM'))

  const monthLabel = dayjs(currentMonth).format('MMMM YYYY')
    .replace(/^./, (c) => c.toUpperCase())

  const prevMonth = () => setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'))
  const nextMonth = () => setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM'))

  return (
    <div className="bg-white px-4 pt-4 pb-2 shadow-sm">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-icon-bg active:bg-gray-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-[17px] font-semibold text-text-primary">{monthLabel}</span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-icon-bg active:bg-gray-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Переключатель вид */}
        <div className="flex items-center gap-1 bg-icon-bg rounded-lg p-0.5">
          <button
            onClick={() => setMode('week')}
            className={`w-8 h-7 flex items-center justify-center rounded-md transition-colors ${mode === 'week' ? 'bg-white shadow-sm' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mode === 'week' ? '#1C1C1E' : '#8E8E93'} strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <button
            onClick={() => setMode('month')}
            className={`w-8 h-7 flex items-center justify-center rounded-md transition-colors ${mode === 'month' ? 'bg-white shadow-sm' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mode === 'month' ? '#1C1C1E' : '#8E8E93'} strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Дни недели или месяц */}
      {mode === 'week' ? (
        <WeekCalendar
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDateChange={onDateChange}
        />
      ) : (
        <MonthCalendar
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDateChange={(d) => {
            onDateChange(d)
            setMode('week')
          }}
        />
      )}
    </div>
  )
}
