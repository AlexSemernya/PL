import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

interface MonthCalendarProps {
  selectedDate: string
  currentMonth: string
  onDateChange: (date: string) => void
}

export default function MonthCalendar({ selectedDate, currentMonth, onDateChange }: MonthCalendarProps) {
  const firstDay = dayjs(currentMonth + '-01')
  // dayjs isoWeekday: 1=Пн, 7=Вс
  const startOffset = (firstDay.isoWeekday() - 1)
  const daysInMonth = firstDay.daysInMonth()

  const cells: (dayjs.Dayjs | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDay.add(i, 'day')),
  ]

  // Добиваем до полных строк
  while (cells.length % 7 !== 0) cells.push(null)

  const today = dayjs().format('YYYY-MM-DD')

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-text-secondary py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const dateStr = date.format('YYYY-MM-DD')
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today

          return (
            <button
              key={i}
              onClick={() => onDateChange(dateStr)}
              className="flex items-center justify-center py-1"
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-accent text-white'
                    : isToday
                    ? 'bg-accent-light text-accent font-semibold'
                    : 'text-text-primary'
                }`}
              >
                {date.date()}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
