import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon, type IconName } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { useHabitsStore } from '../store/habitsStore'
import { haptic } from '../lib/haptic'
import type { Habit } from '../types'

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
}

const ICON_OPTIONS: IconName[] = ['drop', 'run', 'book2', 'coffee', 'moon', 'mood', 'edit', 'food', 'shoe', 'star']
const COLOR_OPTIONS = ['#c6f84e', '#4cd6ff', '#b59cff', '#ff8a3d', '#ff5a8a', '#6be99a']

export function Habits({ selectedDate, onDateChange }: Props) {
  const habits = useHabitsStore((s) => s.habits)
  const toggleComplete = useHabitsStore((s) => s.toggleComplete)
  const addHabit = useHabitsStore((s) => s.addHabit)
  const removeHabit = useHabitsStore((s) => s.removeHabit)
  const getStreak = useHabitsStore((s) => s.getStreak)

  const [tab, setTab] = useState<'Неделя' | 'Месяц' | 'Год'>('Неделя')
  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)

  const doneOn = (d: string) => habits.filter((h) => h.completedDates.includes(d)).length

  // 60-day heatmap: cells colored by count of habits done that day
  const heatmap = useMemo(() => {
    const cells: { level: 0 | 1 | 2 | 3 | 4; date: string }[] = []
    const start = dayjs().subtract(59, 'day')
    const maxPerDay = Math.max(1, habits.length)
    for (let i = 0; i < 60; i++) {
      const date = start.add(i, 'day').format('YYYY-MM-DD')
      const c = doneOn(date)
      const ratio = c / maxPerDay
      const level: 0 | 1 | 2 | 3 | 4 = c === 0 ? 0 : ratio >= 1 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.5 ? 2 : 1
      cells.push({ level, date })
    }
    return cells
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, tab])

  const today = dayjs().format('YYYY-MM-DD')
  const doneToday = doneOn(today)

  // overall streak — consecutive days back from today where ≥1 habit done
  const streak = (() => {
    let s = 0
    let d = dayjs()
    while (habits.some((h) => h.completedDates.includes(d.format('YYYY-MM-DD')))) {
      s++
      d = d.subtract(1, 'day')
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
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Привычки</div>
            <div className="w-sub">
              {habits.length} активных · {doneToday} выполнено сегодня
            </div>
          </div>
          <button
            className="fab"
            style={{ width: 'auto', padding: '10px 14px', borderRadius: 14 }}
            onClick={() => {
              setEditing(null)
              setOpenAdd(true)
              haptic('medium')
            }}
          >
            <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} />
          </button>
        </div>

        {/* Streak + heatmap */}
        <div className="widget" style={{ marginBottom: 8 }}>
          <div className="w-head">
            <div className="w-title accent">◆ СЕРИЯ</div>
            <div className="segmented">
              {(['Неделя', 'Месяц', 'Год'] as const).map((t) => (
                <button
                  key={t}
                  className={tab === t ? 'on' : ''}
                  onClick={() => {
                    setTab(t)
                    haptic('select')
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="w-row baseline" style={{ gap: 6, marginBottom: 12 }}>
            <span className="w-big">{streak}</span>
            <span className="w-unit">{streak === 1 ? 'день' : streak > 1 && streak < 5 ? 'дня' : 'дней'} подряд</span>
          </div>
          <div className="habit-grid">
            {heatmap.map((c, i) => (
              <div key={i} className={`habit-cell ${c.level ? 'l' + c.level : ''}`} title={`${c.date}: ${doneOn(c.date)} привычек`} />
            ))}
          </div>
          <div className="w-row between" style={{ marginTop: 10, fontSize: 10, color: 'var(--text-faint)' }}>
            <span>60 дней назад</span>
            <div className="w-row" style={{ gap: 4 }}>
              <span>меньше</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div key={lvl} className={`habit-cell ${lvl ? 'l' + lvl : ''}`} style={{ width: 8, height: 8 }} />
              ))}
              <span>больше</span>
            </div>
          </div>
        </div>

        {/* Habits list */}
        <div className="sec-h">
          <span className="t">Сегодня</span>
        </div>

        {habits.length === 0 ? (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 24 }}>
            Привычек пока нет.<br />
            <button className="fab" style={{ marginTop: 14, width: 'auto', padding: '10px 16px', borderRadius: 14, display: 'inline-flex' }}
              onClick={() => { setEditing(null); setOpenAdd(true); haptic('medium') }}>
              <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} /> Добавить первую
            </button>
          </div>
        ) : (
          habits.map((h) => {
            const done = h.completedDates.includes(today)
            const last5 = Array.from({ length: 5 }, (_, i) => dayjs().subtract(4 - i, 'day').format('YYYY-MM-DD'))
            const streakH = getStreak(h.id)
            return (
              <button
                key={h.id}
                className={`lrow ${done ? 'done' : ''}`}
                onClick={() => { toggleComplete(h.id, today); haptic(done ? 'light' : 'success') }}
                onContextMenu={(e) => { e.preventDefault(); setEditing(h); setOpenAdd(true) }}
              >
                <div className={`check ${done ? 'done' : ''}`}>
                  {done && <Icon name="check" size={12} color="#0a0a0b" stroke={3} />}
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: 'var(--panel-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={(h.icon as IconName) ?? 'check'} size={16} color={h.color ?? 'var(--text-dim)'} />
                </div>
                <div className="meta">
                  <div className="t1">{h.title}</div>
                  <div className="t2">{done ? '✓ выполнено' : 'не отмечено'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {last5.map((d, i) => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: 2,
                        background: h.completedDates.includes(d) ? (h.color ?? 'var(--accent)') : 'var(--line)',
                      }} />
                    ))}
                  </div>
                  {streakH > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Icon name="flame" size={10} color="var(--warn)" />
                      {streakH}
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}

        {habits.length > 0 && (
          <button className="fab ghost" style={{ marginTop: 14 }}
            onClick={() => { setEditing(null); setOpenAdd(true); haptic('medium') }}>
            <Icon name="plus" size={14} /> Добавить привычку
          </button>
        )}
      </div>

      <Sheet open={openAdd} onClose={() => setOpenAdd(false)} title={editing ? 'Изменить привычку' : 'Новая привычка'}>
        <HabitForm
          initial={editing}
          onSubmit={(data) => {
            if (editing) {
              useHabitsStore.getState().updateHabit(editing.id, data)
            } else {
              addHabit({
                title: data.title ?? 'Без названия',
                icon: data.icon,
                color: data.color,
                frequency: data.frequency ?? 'daily',
                daysOfWeek: data.daysOfWeek,
                reminder: data.reminder,
              })
            }
            haptic('success')
            setOpenAdd(false)
            setEditing(null)
          }}
          onDelete={
            editing
              ? () => {
                  removeHabit(editing.id)
                  haptic('warning')
                  setOpenAdd(false)
                  setEditing(null)
                }
              : undefined
          }
        />
      </Sheet>
    </>
  )
}

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
type FreqMode = 'daily' | 'weekdays' | 'weekends' | 'custom'

function deriveFreqMode(h: Habit | null): FreqMode {
  if (!h) return 'daily'
  if (h.frequency === 'daily') return 'daily'
  const d = h.daysOfWeek ?? []
  const sortedKey = [...d].sort().join(',')
  if (sortedKey === '0,1,2,3,4') return 'weekdays'
  if (sortedKey === '5,6') return 'weekends'
  return 'custom'
}

function HabitForm({
  initial,
  onSubmit,
  onDelete,
}: {
  initial: Habit | null
  onSubmit: (data: Partial<Habit>) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [icon, setIcon] = useState<IconName>((initial?.icon as IconName) ?? 'drop')
  const [color, setColor] = useState(initial?.color ?? '#c6f84e')
  const [freqMode, setFreqMode] = useState<FreqMode>(deriveFreqMode(initial))
  const [customDays, setCustomDays] = useState<number[]>(initial?.daysOfWeek ?? [0, 1, 2, 3, 4])
  const [reminder, setReminder] = useState(initial?.reminder ?? '')

  const toggleDay = (d: number) =>
    setCustomDays((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d].sort()))

  // derive the final frequency + daysOfWeek to save
  const buildFreqData = (): Pick<Habit, 'frequency' | 'daysOfWeek'> => {
    switch (freqMode) {
      case 'daily':    return { frequency: 'daily' }
      case 'weekdays': return { frequency: 'weekly', daysOfWeek: [0, 1, 2, 3, 4] }
      case 'weekends': return { frequency: 'weekly', daysOfWeek: [5, 6] }
      case 'custom':   return { frequency: 'custom', daysOfWeek: customDays }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Название">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например — пробежка"
          style={fieldInput}
        />
      </Field>

      <Field label="Периодичность">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {([
            ['daily',    'Каждый день'],
            ['weekdays', 'Будни (Пн–Пт)'],
            ['weekends', 'Выходные (Сб–Вс)'],
            ['custom',   'Свой график'],
          ] as const).map(([mode, label]) => {
            const on = freqMode === mode
            return (
              <button
                key={mode}
                onClick={() => setFreqMode(mode)}
                style={{
                  padding: '12px 10px', borderRadius: 12, border: 0, cursor: 'pointer',
                  background: on ? 'var(--accent)' : 'var(--panel)',
                  color: on ? '#0a0a0b' : 'var(--text)',
                  fontSize: 13, fontWeight: 600, textAlign: 'left',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        {freqMode === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 10 }}>
            {DAY_LABELS.map((d, i) => {
              const on = customDays.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  style={{
                    aspectRatio: '1', borderRadius: 10, border: 0, cursor: 'pointer',
                    background: on ? 'var(--accent)' : 'var(--panel-2)',
                    color: on ? '#0a0a0b' : 'var(--text-dim)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                  }}
                >
                  {d}
                </button>
              )
            })}
          </div>
        )}
      </Field>

      <Field label="Напоминание (необязательно)">
        <input
          type="time"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          style={fieldInput}
        />
      </Field>

      <Field label="Иконка">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ICON_OPTIONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              style={{
                width: 44, height: 44, borderRadius: 12, border: 0, cursor: 'pointer',
                background: icon === i ? 'var(--accent)' : 'var(--panel)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name={i} size={18} color={icon === i ? '#0a0a0b' : 'var(--text-dim)'} />
            </button>
          ))}
        </div>
      </Field>

      <Field label="Цвет">
        <div style={{ display: 'flex', gap: 10 }}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c, border: color === c ? '2px solid var(--text)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </Field>

      <button
        className="fab"
        style={{ marginTop: 8 }}
        disabled={!title.trim()}
        onClick={() =>
          onSubmit({
            title: title.trim(),
            icon,
            color,
            ...buildFreqData(),
            reminder: reminder || undefined,
          })
        }
      >
        <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} /> {initial ? 'Сохранить' : 'Создать'}
      </button>

      {onDelete && (
        <button
          className="fab ghost"
          style={{ color: 'var(--red)' }}
          onClick={onDelete}
        >
          <Icon name="trash" size={14} color="var(--red)" /> Удалить
        </button>
      )}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export const fieldInput: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 14,
  background: 'var(--panel)', border: '1px solid var(--line)',
  color: 'var(--text)', fontSize: 15, outline: 'none',
  fontFamily: 'inherit',
}
