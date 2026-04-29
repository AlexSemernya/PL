import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const DAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

interface WeekCalendarProps {
  selectedDate: string
  currentMonth: string
  onDateChange: (date: string) => void
}

export default function WeekCalendar({ selectedDate, currentMonth, onDateChange }: WeekCalendarProps) {
  // Найдём неделю, содержащую selectedDate
  const selected = dayjs(selectedDate)
  // Начало недели (пн)
  const startOfWeek = selected.startOf('isoWeek')

  return (
    <div className="grid grid-cols-7 gap-1">
      {DAY_LABELS.map((label, i) => {
        const date = startOfWeek.add(i, 'day')
        const dateStr = date.format('YYYY-MM-DD')
        const isSelected = dateStr === selectedDate
        const isToday = dateStr === dayjs().format('YYYY-MM-DD')
        const isOtherMonth = date.format('YYYY-MM') !== currentMonth

        return (
          <button
            key={i}
            onClick={() => onDateChange(dateStr)}
            className="flex flex-col items-center py-1 rounded-xl transition-colors"
          >
            <span className={`text-[10px] font-medium mb-1 ${isOtherMonth ? 'text-text-muted' : 'text-text-secondary'}`}>
              {label}
            </span>
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[15px] font-semibold transition-colors ${
                isSelected
                  ? 'bg-accent text-white'
                  : isToday
                  ? 'bg-accent-light text-accent'
                  : 'text-text-primary'
              } ${isOtherMonth ? 'opacity-40' : ''}`}
            >
              {date.date()}
            </div>
          </button>
        )
      })}
    </div>
  )
}
