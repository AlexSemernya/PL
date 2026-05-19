import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon } from '../components/Icons'
import { TickRow, Sparkline } from '../components/Widgets'
import { Sheet } from '../components/Sheet'
import { useDiaryStore } from '../store/diaryStore'
import { haptic } from '../lib/haptic'
import type { DiaryEntry, MoodLevel } from '../types'
import { Field, fieldInput } from './Habits'

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
}

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']
const MOOD_COLOR = ['var(--red)', 'var(--warn)', '#ffc850', 'var(--good)', 'var(--accent)']
const MOOD_BG = [
  'rgba(255,82,82,0.20)',
  'rgba(255,138,61,0.20)',
  'rgba(255,200,80,0.18)',
  'rgba(107,233,154,0.18)',
  'rgba(198,248,78,0.22)',
]
const COMMON_TAGS = ['работа', 'спорт', 'семья', 'отдых', 'обучение', 'здоровье']

export function Diary({ selectedDate, onDateChange }: Props) {
  const entries = useDiaryStore((s) => s.entries)
  const removeEntry = useDiaryStore((s) => s.removeEntry)
  const avgMood = useDiaryStore((s) => s.getAverageMood)(30)

  const selDay = dayjs(selectedDate)
  const isToday = selDay.isSame(dayjs(), 'day')
  const currentEntry = entries.find((e) => e.date === selectedDate)
  const [openWrite, setOpenWrite] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null)

  // graphs end on selectedDate
  const week = Array.from({ length: 7 }, (_, i) => selDay.subtract(6 - i, 'day').format('YYYY-MM-DD'))
  const moodWeek = week.map((d) => entries.find((e) => e.date === d)?.mood ?? 0)
  const energyWeek = week.map((d) => {
    const e = entries.find((x) => x.date === d)
    return e ? Math.min(10, e.mood * 2) : 0
  })

  const recent = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20), [entries])

  const handleMoodPick = (m: MoodLevel) => {
    // Write mood for selectedDate (today or any past day)
    const existing = entries.find((e) => e.date === selectedDate)
    if (existing) {
      useDiaryStore.getState().updateEntry(existing.id, { mood: m })
    } else {
      useDiaryStore.getState().addEntry({ date: selectedDate, mood: m, moodNote: '', tags: [] })
    }
    haptic('select')
  }
  const mood = (currentEntry?.mood as MoodLevel) ?? 4

  return (
    <>
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="scroll screen-enter">
        <div className="w-row between" style={{ padding: '4px 4px 14px' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Дневник</div>
            <div className="w-sub">{dayjs(selectedDate).format('D MMMM, dddd')}</div>
          </div>
          <button className="fab" style={{ width: 'auto', padding: '10px 14px', borderRadius: 14 }}
                  onClick={() => { setEditingEntry(currentEntry ?? { id: '', date: selectedDate, mood, moodNote: '', createdAt: '' } as any); setOpenWrite(true); haptic('medium') }}>
            <Icon name="edit" size={14} color="#0a0a0b" stroke={2.4} />
          </button>
        </div>

        {/* Mood capture */}
        <div className="widget" style={{ marginBottom: 8 }}>
          <div className="w-head">
            <div className="w-title violet">◆ {isToday ? 'КАК ТЫ СЕГОДНЯ?' : selDay.format('D MMMM').toUpperCase()}</div>
            <span className="w-label">сред. за 30 дн: {avgMood ? avgMood.toFixed(1) : '—'}</span>
          </div>
          <div className="mood-row">
            {[1, 2, 3, 4, 5].map((i) => {
              const active = mood === i
              return (
                <button
                  key={i}
                  className="mood-btn"
                  onClick={() => handleMoodPick(i as MoodLevel)}
                  style={{
                    background: active ? MOOD_BG[i - 1] : 'var(--panel-2)',
                    boxShadow: active ? `inset 0 0 0 1.5px ${MOOD_COLOR[i - 1]}` : 'none',
                  }}
                >
                  {MOOD_EMOJI[i - 1]}
                </button>
              )
            })}
          </div>
          <div className="w-row between" style={{ marginTop: 10 }}>
            <span className="w-label">плохо</span>
            <span className="w-label">отлично</span>
          </div>
        </div>

        {/* Graphs */}
        <div className="w-grid c2">
          <div className="widget tight">
            <div className="w-title violet">◆ НАСТРОЕНИЕ</div>
            <div className="w-row baseline" style={{ gap: 4, marginTop: 8, marginBottom: 8 }}>
              <span className="w-mid">{avgMood ? avgMood.toFixed(1) : '—'}</span>
              <span className="w-unit">30 дней</span>
            </div>
            <Sparkline values={moodWeek.length > 1 && moodWeek.some((v) => v > 0) ? moodWeek : [0, 0]}
                       color="var(--violet)" height={36} />
          </div>
          <div className="widget tight">
            <div className="w-title accent">◆ ЭНЕРГИЯ</div>
            <div className="w-row baseline" style={{ gap: 4, marginTop: 8, marginBottom: 8 }}>
              <span className="w-mid">{(avgMood * 2).toFixed(1)}</span>
              <span className="w-unit">из 10</span>
            </div>
            <TickRow values={energyWeek.length ? energyWeek : [0]} color="var(--accent)" height={28} />
          </div>
        </div>

        {/* Quick write */}
        <div className="widget" style={{ marginTop: 8 }}>
          <div className="w-head">
            <div className="w-title cyan">◆ ЗАМЕТКА ДНЯ</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 14 }}>
            {currentEntry?.moodNote ? currentEntry.moodNote.slice(0, 140) : 'Что было ярким сегодня?'}
            {currentEntry?.moodNote && currentEntry.moodNote.length > 140 ? '…' : ''}
          </div>
          <button
            className="lrow"
            style={{ background: 'var(--panel-2)', borderRadius: 14, gap: 10, padding: 12 }}
            onClick={() => { setEditingEntry(currentEntry ?? null); setOpenWrite(true); haptic('medium') }}
          >
            <Icon name="edit" size={18} color="var(--accent)" />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-dim)' }}>
              {currentEntry ? 'Редактировать запись' : 'Написать запись'}
            </span>
          </button>
          {(currentEntry?.tags?.length ?? 0) > 0 && (
            <div className="w-row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {currentEntry!.tags!.map((t) => (
                <span key={t} className="pill outline">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="sec-h"><span className="t">Прошлые записи</span></div>
        {recent.length === 0 ? (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 18 }}>
            Записей пока нет.
          </div>
        ) : (
          recent.map((e) => (
            <button key={e.id} className="widget tight"
                    style={{ marginBottom: 6, border: 0, textAlign: 'left', width: '100%', cursor: 'pointer' }}
                    onClick={() => { setEditingEntry(e); setOpenWrite(true) }}>
              <div className="w-row between" style={{ marginBottom: 8 }}>
                <span className="w-label" style={{ fontWeight: 600, color: 'var(--text-dim)' }}>
                  {dayjs(e.date).format('D MMM · dd')}
                </span>
                <div className="w-row" style={{ gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{MOOD_EMOJI[e.mood - 1]}</span>
                  <span className="num" style={{ fontSize: 11, color: MOOD_COLOR[e.mood - 1], fontWeight: 600 }}>
                    {e.mood}.0
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45, marginBottom: e.tags?.length ? 8 : 0 }}>
                {e.moodNote || <span style={{ color: 'var(--text-faint)' }}>(пусто)</span>}
              </div>
              {(e.tags?.length ?? 0) > 0 && (
                <div className="w-row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {e.tags!.map((t) => (
                    <span key={t} className="pill" style={{ fontSize: 10 }}>#{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      <Sheet open={openWrite} onClose={() => { setOpenWrite(false); setEditingEntry(null) }}
             title={editingEntry?.id ? dayjs(editingEntry.date).format('D MMMM') : selDay.format('D MMMM')}>
        <EntryForm
          initial={editingEntry ?? { date: selectedDate, mood, moodNote: '', tags: [] }}
          onSubmit={(data) => {
            if (editingEntry?.id) {
              useDiaryStore.getState().updateEntry(editingEntry.id, data)
            } else {
              // upsert for the selected (or editing) date
              const date = editingEntry?.date ?? selectedDate
              const existing = useDiaryStore.getState().entries.find((e) => e.date === date)
              if (existing) {
                useDiaryStore.getState().updateEntry(existing.id, data)
              } else {
                useDiaryStore.getState().addEntry({
                  date, mood: (data.mood as MoodLevel) ?? mood,
                  moodNote: data.moodNote ?? '', tags: data.tags,
                })
              }
            }
            haptic('success')
            setOpenWrite(false)
            setEditingEntry(null)
          }}
          onDelete={editingEntry ? () => {
            removeEntry(editingEntry.id)
            haptic('warning')
            setOpenWrite(false)
            setEditingEntry(null)
          } : undefined}
        />
      </Sheet>
    </>
  )
}

function EntryForm({
  initial, onSubmit, onDelete,
}: {
  initial: Partial<DiaryEntry> & { date: string }
  onSubmit: (data: Partial<DiaryEntry>) => void
  onDelete?: () => void
}) {
  const [mood, setMood] = useState<MoodLevel>((initial.mood as MoodLevel) ?? 4)
  const [text, setText] = useState(initial.moodNote ?? '')
  const [tags, setTags] = useState<string[]>(initial.tags ?? [])

  const toggleTag = (t: string) => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Настроение">
        <div className="mood-row">
          {[1, 2, 3, 4, 5].map((i) => {
            const active = mood === i
            return (
              <button key={i} className="mood-btn" onClick={() => setMood(i as MoodLevel)}
                      style={{
                        background: active ? MOOD_BG[i - 1] : 'var(--panel-2)',
                        boxShadow: active ? `inset 0 0 0 1.5px ${MOOD_COLOR[i - 1]}` : 'none',
                      }}>
                {MOOD_EMOJI[i - 1]}
              </button>
            )
          })}
        </div>
      </Field>
      <Field label="Запись">
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Что было сегодня?" rows={6}
                  style={{ ...fieldInput, resize: 'none', fontFamily: 'inherit' }} />
      </Field>
      <Field label="Теги">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COMMON_TAGS.map((t) => {
            const on = tags.includes(t)
            return (
              <button key={t} onClick={() => toggleTag(t)}
                      className={`pill ${on ? 'accent' : 'outline'}`}
                      style={{ fontSize: 12, border: 0, cursor: 'pointer' }}>
                #{t}
              </button>
            )
          })}
        </div>
      </Field>

      <button className="fab" onClick={() => onSubmit({ mood, moodNote: text.trim(), tags })}>
        <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} /> Сохранить
      </button>
      {onDelete && (
        <button className="fab ghost" style={{ color: 'var(--red)' }} onClick={onDelete}>
          <Icon name="trash" size={14} color="var(--red)" /> Удалить запись
        </button>
      )}
    </div>
  )
}
