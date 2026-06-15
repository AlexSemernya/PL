/**
 * DayTimeline — компонент-расписание дня.
 *
 * Визуально воспроизводит формат из референса (Sunsama-like):
 *  - слева колонка времени
 *  - по центру вертикальная линия с цветным «пином» (icon)
 *  - справа карточка с заголовком, длительностью, заметкой
 *
 * Используется и в compact-режиме на Главной (3-4 ближайших), и в full
 * экране (все события дня, scrollable).
 *
 * Авто-события (из привычек/целей) визуально не отличаются от ручных, но
 * их источник показан мелкой подписью "от привычки X" под названием.
 */
import { useState } from 'react'
import dayjs from 'dayjs'
import { Sheet } from './Sheet'
import { Icon } from './Icons'
import { useTimelineStore } from '../store/timelineStore'
import { CATEGORY_META, CATEGORY_LIST, formatDuration, nowHHMM } from '../lib/eventCategories'
import { haptic } from '../lib/haptic'
import type { DayEvent, EventCategory } from '../types'
import { Field, fieldInput } from '../pages/Habits'

interface Props {
  /** Дата YYYY-MM-DD */
  date: string
  /** Компактный = показывать только ближайшие 4 события + кнопку "ещё" */
  compact?: boolean
  /** Колбек когда юзер тапнул "Открыть день" в compact-режиме */
  onExpand?: () => void
}

export function DayTimeline({ date, compact, onExpand }: Props) {
  const events = useTimelineStore((s) => s.getEventsForDate(date))
  const addEvent = useTimelineStore((s) => s.addEvent)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const removeEvent = useTimelineStore((s) => s.removeEvent)
  const toggleDone = useTimelineStore((s) => s.toggleDone)

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<DayEvent | null>(null)

  const visibleEvents = compact ? events.slice(0, 4) : events
  const hiddenCount = compact ? Math.max(0, events.length - 4) : 0

  const isPast = (d: string) => dayjs(d).isBefore(dayjs(), 'day')
  const isToday = dayjs(date).isSame(dayjs(), 'day')

  return (
    <div>
      {events.length === 0 && (
        <div
          className="widget"
          style={{
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: 13,
            padding: 24,
          }}
        >
          <Icon name="calendar" size={28} color="var(--text-faint)" stroke={1.5} />
          <div style={{ marginTop: 8, marginBottom: 4, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {isToday ? 'День ещё пуст' : isPast(date) ? 'В этот день ничего не записано' : 'Спланируй день'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, maxWidth: 260, marginInline: 'auto' }}>
            Добавь события вручную или просто отмечай привычки и цели — они
            автоматически появятся здесь.
          </div>
          <button
            className="fab"
            style={{ width: 'auto', padding: '10px 18px', borderRadius: 14, display: 'inline-flex' }}
            onClick={() => {
              setEditing(null)
              setOpenForm(true)
              haptic('medium')
            }}
          >
            <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} /> Добавить событие
          </button>
        </div>
      )}

      {visibleEvents.map((event, idx) => (
        <TimelineRow
          key={event.id}
          event={event}
          isLast={idx === visibleEvents.length - 1 && hiddenCount === 0 && !compact}
          onTap={() => {
            setEditing(event)
            setOpenForm(true)
            haptic('select')
          }}
          onToggleDone={() => {
            toggleDone(event.id)
            haptic('light')
          }}
        />
      ))}

      {compact && hiddenCount > 0 && (
        <button
          className="fab ghost"
          style={{ marginTop: 6, width: '100%' }}
          onClick={() => {
            haptic('select')
            onExpand?.()
          }}
        >
          Ещё {hiddenCount} {plural(hiddenCount, 'событие', 'события', 'событий')} →
        </button>
      )}

      {events.length > 0 && (
        <button
          className="fab ghost"
          style={{ marginTop: 8 }}
          onClick={() => {
            setEditing(null)
            setOpenForm(true)
            haptic('medium')
          }}
        >
          <Icon name="plus" size={14} /> Добавить событие
        </button>
      )}

      <Sheet
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? 'Событие' : 'Новое событие'}
      >
        <EventForm
          initial={editing}
          defaultDate={date}
          onSubmit={(data) => {
            if (editing) {
              updateEvent(editing.id, data)
            } else {
              addEvent({
                date: data.date ?? date,
                time: data.time ?? nowHHMM(),
                title: data.title ?? 'Без названия',
                category: (data.category ?? 'other') as EventCategory,
                durationMin: data.durationMin,
                note: data.note,
                done: false,
              })
            }
            haptic('success')
            setOpenForm(false)
            setEditing(null)
          }}
          onDelete={
            editing
              ? () => {
                  removeEvent(editing.id)
                  haptic('warning')
                  setOpenForm(false)
                  setEditing(null)
                }
              : undefined
          }
        />
      </Sheet>
    </div>
  )
}

// ─── Один ряд timeline ──────────────────────────────────
function TimelineRow({
  event,
  isLast,
  onTap,
  onToggleDone,
}: {
  event: DayEvent
  isLast: boolean
  onTap: () => void
  onToggleDone: () => void
}) {
  const meta = CATEGORY_META[event.category] ?? CATEGORY_META.other
  const dur = formatDuration(event.durationMin)
  const isAuto = !!event.source
  const sourceLabel =
    event.source?.kind === 'habit' ? 'привычка'
    : event.source?.kind === 'goal' ? 'цель'
    : event.source?.kind === 'finance' ? 'трата'
    : ''

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', marginBottom: 10 }}>
      {/* Левая колонка — время */}
      <div
        style={{
          width: 52,
          flexShrink: 0,
          paddingTop: 9,
          fontSize: 12,
          fontWeight: 600,
          color: event.done ? 'var(--text-faint)' : 'var(--text-dim)',
          fontFamily: 'SF Mono, ui-monospace, monospace',
          textAlign: 'right',
          paddingRight: 10,
          letterSpacing: '-0.02em',
        }}
      >
        {event.time}
      </div>

      {/* Колонка с иконкой и линией */}
      <div style={{ width: 40, flexShrink: 0, position: 'relative' }}>
        {/* Линия вниз — кроме последнего ряда */}
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              left: 19,
              top: 32,
              bottom: -10,
              width: 2,
              background: 'var(--line)',
              borderRadius: 1,
            }}
          />
        )}
        {/* Pin с иконкой */}
        <button
          onClick={onToggleDone}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: meta.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 0,
            cursor: 'pointer',
            opacity: event.done ? 0.45 : 1,
            transition: 'opacity 0.15s',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Icon name={meta.icon} size={18} color={meta.fgColor} stroke={2} />
        </button>
      </div>

      {/* Карточка справа */}
      <div
        onClick={onTap}
        style={{
          flex: 1,
          marginLeft: 8,
          background: 'var(--panel)',
          borderRadius: 14,
          padding: '10px 14px',
          border: '1px solid var(--line)',
          cursor: 'pointer',
          opacity: event.done ? 0.55 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.25,
            textDecoration: event.done ? 'line-through' : 'none',
            textDecorationColor: 'var(--line-2)',
          }}
        >
          {event.title}
        </div>
        {(dur || isAuto) && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-dim)',
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {dur && <span>{dur}</span>}
            {dur && isAuto && <span style={{ opacity: 0.5 }}>·</span>}
            {isAuto && <span style={{ opacity: 0.8 }}>от {sourceLabel}</span>}
          </div>
        )}
        {event.note && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-dim)',
              marginTop: 6,
              lineHeight: 1.35,
            }}
          >
            {event.note}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Форма создания/редактирования ──────────────────────
function EventForm({
  initial,
  defaultDate,
  onSubmit,
  onDelete,
}: {
  initial: DayEvent | null
  defaultDate: string
  onSubmit: (data: Partial<DayEvent>) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const [time, setTime] = useState(initial?.time ?? nowHHMM())
  const [category, setCategory] = useState<EventCategory>(initial?.category ?? 'other')
  const [durationMin, setDurationMin] = useState(initial?.durationMin ?? 0)
  const [note, setNote] = useState(initial?.note ?? '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Название">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например — пробежка в парке"
          style={fieldInput}
        />
      </Field>

      <Field label="Категория">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {CATEGORY_LIST.map((m) => {
            const on = category === m.key
            return (
              <button
                key={m.key}
                onClick={() => { setCategory(m.key); haptic('select') }}
                style={{
                  padding: '12px 4px',
                  borderRadius: 12,
                  border: 0,
                  cursor: 'pointer',
                  background: on ? m.color : 'var(--panel-2)',
                  color: on ? m.fgColor : 'var(--text-dim)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'background 0.15s',
                }}
              >
                <Icon name={m.icon} size={18} color={on ? m.fgColor : m.color} stroke={2} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Дата">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={fieldInput}
          />
        </Field>
        <Field label="Время">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={fieldInput}
          />
        </Field>
      </div>

      <Field label="Длительность (мин, опционально)">
        <input
          type="number"
          inputMode="numeric"
          value={durationMin || ''}
          onChange={(e) => setDurationMin(+e.target.value)}
          placeholder="0"
          style={fieldInput}
        />
        {/* Быстрые кнопки */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {[15, 30, 45, 60, 90].map((v) => (
            <button
              key={v}
              onClick={() => { setDurationMin(v); haptic('select') }}
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                border: 0,
                background: durationMin === v ? 'var(--accent)' : 'var(--panel-2)',
                color: durationMin === v ? '#0a0a0b' : 'var(--text-dim)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {v} мин
            </button>
          ))}
        </div>
      </Field>

      <Field label="Заметка (опционально)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Детали, ощущения, повторения…"
          rows={3}
          style={{ ...fieldInput, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
        />
      </Field>

      <button
        className="fab"
        disabled={!title.trim()}
        onClick={() =>
          onSubmit({
            title: title.trim(),
            date,
            time,
            category,
            durationMin: durationMin > 0 ? durationMin : undefined,
            note: note.trim() || undefined,
          })
        }
      >
        <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} />
        {initial ? 'Сохранить' : 'Создать'}
      </button>

      {onDelete && (
        <button className="fab ghost" style={{ color: 'var(--red)' }} onClick={onDelete}>
          <Icon name="trash" size={14} color="var(--red)" /> Удалить
        </button>
      )}
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const n1 = abs % 10
  if (abs > 10 && abs < 20) return many
  if (n1 === 1) return one
  if (n1 > 1 && n1 < 5) return few
  return many
}
