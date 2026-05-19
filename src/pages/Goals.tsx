import { useState } from 'react'
import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon } from '../components/Icons'
import { Ring } from '../components/Widgets'
import { Sheet } from '../components/Sheet'
import { useGoalsStore } from '../store/goalsStore'
import { haptic } from '../lib/haptic'
import type { Goal } from '../types'
import { Field, fieldInput } from './Habits'
import type React from 'react'

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
}

const GOAL_COLORS = ['#c6f84e', '#4cd6ff', '#b59cff', '#ff8a3d', '#ff5a8a']

const UNIT_PRESETS = [
  { unit: '',      label: 'без единиц' },
  { unit: '%',     label: '%' },
  { unit: 'раз',   label: 'раз' },
  { unit: 'дн',    label: 'дни' },
  { unit: 'км',    label: 'км' },
  { unit: 'шагов', label: 'шаги' },
  { unit: 'стр',   label: 'страницы' },
  { unit: 'мин',   label: 'минуты' },
  { unit: 'ч',     label: 'часы' },
  { unit: '₽',     label: '₽' },
  { unit: '$',     label: '$' },
] as const

/**
 * Inline +/- progress steppers. Auto-detects a sensible step from the target
 * (target/20, min 1, max 10) so a 200km goal bumps by 10 and a 24-book goal
 * bumps by 1.
 */
function ProgressSteppers({
  goal, onChange, compact = false,
}: {
  goal: Goal
  onChange: (newCurrent: number) => void
  compact?: boolean
}) {
  const target = goal.progressTarget ?? 100
  const current = goal.progressCurrent ?? 0
  const rawStep = Math.max(1, Math.round(target / 20))
  const step = rawStep > 10 ? Math.round(rawStep / 5) * 5 : rawStep
  const color = goal.color ?? 'var(--accent)'
  const btn: React.CSSProperties = {
    flex: 1, padding: compact ? '8px 4px' : '10px 8px', borderRadius: 10,
    background: 'var(--panel-2)', color, border: 0, cursor: 'pointer',
    fontSize: compact ? 12 : 13, fontWeight: 700, letterSpacing: '0.02em',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  }
  const bump = (delta: number) => {
    const next = Math.max(0, Math.min(target, current + delta))
    if (next !== current) {
      onChange(next)
      haptic('light')
    }
  }
  return (
    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
      <button style={btn} onClick={() => bump(-step)}>− {step}</button>
      <button style={btn} onClick={() => bump(-1)}>−1</button>
      <button style={btn} onClick={() => bump(+1)}>+1</button>
      <button style={{ ...btn, background: color, color: '#0a0a0b' }} onClick={() => bump(+step)}>+ {step}</button>
    </div>
  )
}

export function Goals({ selectedDate, onDateChange }: Props) {
  const goals = useGoalsStore((s) => s.goals)
  const addGoal = useGoalsStore((s) => s.addGoal)
  const removeGoal = useGoalsStore((s) => s.removeGoal)
  const updateGoal = useGoalsStore((s) => s.updateGoal)
  const toggleComplete = useGoalsStore((s) => s.toggleComplete)

  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  const active = goals.filter((g) => !g.completed)
  const completed = goals.filter((g) => g.completed)
  const featured = active[0]
  const featuredPct = featured?.progressTarget
    ? Math.min(1, (featured.progressCurrent ?? 0) / featured.progressTarget)
    : 0

  const daysLeft = (d?: string) => (d ? Math.max(0, dayjs(d).diff(dayjs(), 'day')) : 0)

  return (
    <>
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="scroll screen-enter">
        <div className="w-row between" style={{ padding: '4px 4px 14px' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Цели</div>
            <div className="w-sub">
              {active.length} активные · {completed.length} завершены
            </div>
          </div>
          <button
            className="fab"
            style={{ width: 'auto', padding: '10px 14px', borderRadius: 14 }}
            onClick={() => { setEditing(null); setOpenAdd(true); haptic('medium') }}
          >
            <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} />
          </button>
        </div>

        {featured && (
          <div className="widget" style={{ marginBottom: 8 }}>
            <div className="w-head" onClick={() => { setEditing(featured); setOpenAdd(true) }} style={{ cursor: 'pointer' }}>
              <div className="w-title accent">◆ В ФОКУСЕ</div>
              {featured.endDate && <span className="w-label">{daysLeft(featured.endDate)} дней осталось</span>}
            </div>
            <div className="w-row" style={{ gap: 14, alignItems: 'center', marginBottom: 14 }}
                 onClick={() => { setEditing(featured); setOpenAdd(true) }}>
              <Ring value={featuredPct} size={88} stroke={9} color={featured.color ?? 'var(--accent)'}
                    label={`${Math.round(featuredPct * 100)}%`} sublabel="ГОТОВО" />
              <div style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                  {featured.title}
                </div>
                <div className="w-sub" style={{ marginTop: 4 }}>
                  {featured.progressTarget
                    ? `${featured.progressCurrent ?? 0} / ${featured.progressTarget} ${featured.progressUnit ?? ''}`
                    : ''}
                  {featured.endDate ? ` · до ${dayjs(featured.endDate).format('D MMMM')}` : ''}
                </div>
                {(featured.tags?.length ?? 0) > 0 && (
                  <div className="w-row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                    {featured.tags!.map((t) => (
                      <span key={t} className="pill outline" style={{ fontSize: 10 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 8, borderRadius: 2,
                  background: i < Math.floor(featuredPct * 12) ? (featured.color ?? 'var(--accent)') : 'var(--line)',
                }} />
              ))}
            </div>

            {/* Quick +/- buttons */}
            {featured.progressTarget !== undefined && featured.progressTarget > 0 && (
              <ProgressSteppers goal={featured} onChange={(v) => updateGoal(featured.id, { progressCurrent: v })} />
            )}
          </div>
        )}

        {/* 2-up grid for other active goals */}
        {active.length > 1 && (
          <div className="w-grid c2">
            {active.slice(1).map((g) => {
              const pct = g.progressTarget ? Math.min(1, (g.progressCurrent ?? 0) / g.progressTarget) : 0
              return (
                <div key={g.id} className="widget tight">
                  <div className="w-head" style={{ cursor: 'pointer' }}
                       onClick={() => { setEditing(g); setOpenAdd(true) }}>
                    <div className="w-title" style={{ color: g.color ?? 'var(--text-dim)' }}>
                      <Icon name="target" size={11} color={g.color ?? 'var(--text-dim)'} /> {g.title.toUpperCase().slice(0, 12)}
                    </div>
                  </div>
                  <div className="w-row baseline" style={{ gap: 4, marginBottom: 8 }}>
                    <span className="w-mid">{g.progressCurrent ?? 0}</span>
                    {g.progressTarget !== undefined && g.progressTarget > 0 && <span className="w-unit">/ {g.progressTarget} {g.progressUnit ?? ''}</span>}
                  </div>
                  <div className="h-progress" style={{ marginBottom: 8 }}>
                    <span style={{ width: `${pct * 100}%`, background: g.color ?? 'var(--accent)' }} />
                  </div>
                  <div className="w-row between" style={{ marginBottom: g.progressTarget ? 8 : 0 }}>
                    <span className="w-label">{Math.round(pct * 100)}%</span>
                    {g.endDate && <span className="w-label">{dayjs(g.endDate).format('D MMM')}</span>}
                  </div>
                  {g.progressTarget !== undefined && g.progressTarget > 0 && (
                    <ProgressSteppers goal={g} onChange={(v) => updateGoal(g.id, { progressCurrent: v })} compact />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {goals.length === 0 && (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 24 }}>
            Целей пока нет.<br />
            <button className="fab" style={{ marginTop: 14, width: 'auto', padding: '10px 16px', borderRadius: 14, display: 'inline-flex' }}
                    onClick={() => { setEditing(null); setOpenAdd(true); haptic('medium') }}>
              <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} /> Добавить цель
            </button>
          </div>
        )}

        {completed.length > 0 && (
          <>
            <div className="sec-h"><span className="t">Завершённые</span></div>
            {completed.map((g) => (
              <div key={g.id} className="lrow" style={{ opacity: 0.55 }}>
                <div className="check done"><Icon name="check" size={12} color="#0a0a0b" stroke={3} /></div>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--panel-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="target" size={16} color="var(--text-dim)" />
                </div>
                <div className="meta">
                  <div className="t1">{g.title}</div>
                  <div className="t2">{g.progressCurrent ?? 0} / {g.progressTarget ?? '?'} · 100%</div>
                </div>
                <button className="a" onClick={(e) => { e.stopPropagation(); toggleComplete(g.id); haptic('light') }}>
                  ← вернуть
                </button>
              </div>
            ))}
          </>
        )}

        {active.length > 0 && (
          <button className="fab ghost" style={{ marginTop: 14 }}
                  onClick={() => { setEditing(null); setOpenAdd(true); haptic('medium') }}>
            <Icon name="plus" size={14} /> Добавить цель
          </button>
        )}
      </div>

      <Sheet open={openAdd} onClose={() => setOpenAdd(false)} title={editing ? 'Цель' : 'Новая цель'}>
        <GoalForm
          initial={editing}
          onSubmit={(data) => {
            if (editing) {
              updateGoal(editing.id, data)
            } else {
              addGoal({
                title: data.title!,
                startDate: dayjs().format('YYYY-MM-DD'),
                endDate: data.endDate,
                frequency: 'none',
                color: data.color,
                tags: data.tags,
                progressCurrent: data.progressCurrent,
                progressTarget: data.progressTarget,
                progressUnit: data.progressUnit,
              })
            }
            haptic('success')
            setOpenAdd(false)
            setEditing(null)
          }}
          onComplete={
            editing && !editing.completed
              ? () => { toggleComplete(editing.id); haptic('success'); setOpenAdd(false); setEditing(null) }
              : undefined
          }
          onDelete={
            editing
              ? () => { removeGoal(editing.id); haptic('warning'); setOpenAdd(false); setEditing(null) }
              : undefined
          }
        />
      </Sheet>
    </>
  )
}

function GoalForm({
  initial, onSubmit, onComplete, onDelete,
}: {
  initial: Goal | null
  onSubmit: (data: Partial<Goal>) => void
  onComplete?: () => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [color, setColor] = useState(initial?.color ?? GOAL_COLORS[0])
  const [progressCurrent, setProgressCurrent] = useState(initial?.progressCurrent ?? 0)
  const [progressTarget, setProgressTarget] = useState(initial?.progressTarget ?? 0)
  const [progressUnit, setProgressUnit] = useState(initial?.progressUnit ?? '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Название">
        <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder="Финский до B1" style={fieldInput} />
      </Field>
      <Field label="До какой даты">
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={fieldInput} />
      </Field>
      <Field label="Единица измерения">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {UNIT_PRESETS.map((u) => {
            const on = progressUnit === u.unit
            return (
              <button key={u.unit} onClick={() => setProgressUnit(u.unit)}
                      style={{
                        padding: '8px 12px', borderRadius: 12, border: 0, cursor: 'pointer',
                        background: on ? 'var(--accent)' : 'var(--panel)',
                        color: on ? '#0a0a0b' : 'var(--text)',
                        fontSize: 13, fontWeight: 600,
                      }}>
                {u.label}
              </button>
            )
          })}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Сейчас">
          <input type="number" inputMode="numeric" value={progressCurrent || ''}
                 onChange={(e) => setProgressCurrent(+e.target.value)} placeholder="0" style={fieldInput} />
        </Field>
        <Field label={progressUnit ? `Цель (${progressUnit})` : 'Цель'}>
          <input type="number" inputMode="numeric" value={progressTarget || ''}
                 onChange={(e) => setProgressTarget(+e.target.value)} placeholder="100" style={fieldInput} />
        </Field>
      </div>
      <Field label="Цвет">
        <div style={{ display: 'flex', gap: 10 }}>
          {GOAL_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 32, height: 32, borderRadius: '50%', background: c,
              border: color === c ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer',
            }} />
          ))}
        </div>
      </Field>

      <button className="fab" disabled={!title.trim()}
              onClick={() => onSubmit({ title: title.trim(), endDate: endDate || undefined, color, progressCurrent, progressTarget, progressUnit })}>
        <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} /> {initial ? 'Сохранить' : 'Создать'}
      </button>

      {onComplete && (
        <button className="fab ghost" onClick={onComplete}>
          <Icon name="check" size={14} /> Отметить выполненной
        </button>
      )}
      {onDelete && (
        <button className="fab ghost" style={{ color: 'var(--red)' }} onClick={onDelete}>
          <Icon name="trash" size={14} color="var(--red)" /> Удалить
        </button>
      )}
    </div>
  )
}
