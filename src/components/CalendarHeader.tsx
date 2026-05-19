import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Icon } from './Icons'
import { LifeOSMark } from './Widgets'
import { haptic } from '../lib/haptic'
import { useSecretTapHandler } from './StorageIndicator'

const RU_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const WD_NAMES_UP = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
  userInitial?: string
}

export function CalendarHeader({ selectedDate, onDateChange, userInitial }: Props) {
  const today = dayjs()
  const selected = dayjs(selectedDate)
  const startOfWeek = selected.startOf('isoWeek') // Mon
  const monthName = RU_MONTHS[selected.month()]
  const year = selected.year()

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = startOfWeek.add(i, 'day')
      return {
        date: d.format('YYYY-MM-DD'),
        n: d.date(),
        wd: WD_NAMES_UP[i],
        isToday: d.isSame(today, 'day'),
        isSelected: d.format('YYYY-MM-DD') === selectedDate,
      }
    })
    // selectedDate change triggers recompute via startOfWeek
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const handlePrev = () => {
    onDateChange(selected.subtract(7, 'day').format('YYYY-MM-DD'))
    haptic('light')
  }
  const handleNext = () => {
    onDateChange(selected.add(7, 'day').format('YYYY-MM-DD'))
    haptic('light')
  }
  const handleToday = () => {
    onDateChange(today.format('YYYY-MM-DD'))
    haptic('select')
  }

  const initial = userInitial ?? window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name?.[0] ?? 'А'
  const onSecretTap = useSecretTapHandler()

  return (
    <>
      <div className="app-brand">
        <span onClick={onSecretTap} style={{ display: 'inline-flex' }}>
          <LifeOSMark size={22} />
        </span>
        <span className="app-brand-name">
          Life<span style={{ color: 'var(--accent)' }}>OS</span>
        </span>
        <span className="app-brand-dot">·</span>
        <span className="app-brand-meta">v1.0</span>
        <div className="app-brand-spacer" />
        <button
          aria-label="Premium / профиль"
          onClick={() => { window.dispatchEvent(new Event('lifeos-open-premium')); haptic('select') }}
          style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
        >
          <div className="avatar lime" style={{ width: 24, height: 24, fontSize: 10 }}>
            {initial}
          </div>
        </button>
      </div>

      <div className="app-header">
        <div className="month">
          {monthName}
          <span className="year">{year}</span>
        </div>
        <div className="nav-arrows">
          <button className="arrow-btn" onClick={handlePrev} aria-label="Прошлая неделя">
            <Icon name="chev-l" size={16} />
          </button>
          <button className="arrow-btn" onClick={handleToday} aria-label="Сегодня">
            <Icon name="target" size={14} />
          </button>
          <button className="arrow-btn" onClick={handleNext} aria-label="Следующая неделя">
            <Icon name="chev-r" size={16} />
          </button>
          <button
            className="arrow-btn"
            onClick={() => { window.dispatchEvent(new Event('lifeos-open-reminders')); haptic('light') }}
            aria-label="Напоминания"
          >
            <Icon name="bell" size={14} />
          </button>
        </div>
      </div>

      <div className="week-strip">
        {days.map((d) => (
          <button
            key={d.date}
            className={`week-day ${d.isSelected ? 'active' : ''} ${d.isToday && !d.isSelected ? 'today' : ''}`}
            onClick={() => {
              onDateChange(d.date)
              haptic('select')
            }}
          >
            <span className="wd-name">{d.wd}</span>
            <span className="wd-num">{d.n}</span>
            <span className="wd-dot" style={{ opacity: d.isToday || d.isSelected ? 1 : 0.3 }} />
          </button>
        ))}
      </div>
    </>
  )
}
