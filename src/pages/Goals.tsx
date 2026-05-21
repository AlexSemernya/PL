import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { useGoalsStore } from '../store/goalsStore'
import { haptic } from '../lib/haptic'
import type { Goal, GoalTier } from '../types'
import { GOAL_TIER_XP } from '../types'
import { Field, fieldInput } from './Habits'
import { TierBadge, TierPicker, tierMeta } from '../components/Tier'
import { SwipeRow } from '../components/SwipeRow'
import type React from 'react'

/**
 * Goals — "expeditions" you commit to. Visually distinct from Habits:
 * each goal is a card with a tier badge, deadline countdown, progress bar,
 * and inline +/- steppers. Habits are checkbox rows; goals are journeys.
 */
interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
}

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
  const tierColor = tierMeta(goal.tier).color
  const btn: React.CSSProperties = {
    flex: 1, padding: compact ? '8px 4px' : '10px 8px', borderRadius: 10,
    background: 'var(--panel-2)', color: tierColor, border: 0, cursor: 'pointer',
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
      <button style={{ ...btn, background: tierColor, color: '#0a0a0b' }} onClick={() => bump(+step)}>+ {step}</button>
    </div>
  )
}

const daysLeft = (d?: string): number =>
  d ? Math.max(0, dayjs(d).diff(dayjs(), 'day')) : 0

const deadlineLabel = (d?: string): string => {
  if (!d) return 'без срока'
  const days = daysLeft(d)
  if (days === 0) return dayjs(d).isBefore(dayjs(), 'day') ? 'просрочено' : 'сегодня'
  if (days === 1) return 'завтра'
  if (days < 7) return `${days} дн`
  if (days < 30) return `${Math.round(days / 7)} нед`
  if (days < 365) return `${Math.round(days / 30)} мес`
  return `${Math.round(days / 365)} г`
}

/**
 * Expedition card — the visual identity of a Goal. Tier-colored accent stripe
 * on the left, large tier badge, prominent deadline + progress.
 */
function ExpeditionCard({
  goal, onOpen, onProgress,
}: {
  goal: Goal
  onOpen: () => void
  onProgress: (v: number) => void
}) {
  const tier = tierMeta(goal.tier)
  const hasTarget = (goal.progressTarget ?? 0) > 0
  const pct = hasTarget ? Math.min(1, (goal.progressCurrent ?? 0) / (goal.progressTarget ?? 1)) : 0
  const deadline = goal.endDate
  const dLabel = deadlineLabel(deadline)
  const overdue = deadline && dayjs(deadline).isBefore(dayjs(), 'day') && !goal.completed
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--panel)',
        borderRadius: 16,
        padding: '14px 14px 14px 18px',
        overflow: 'hidden',
        border: '1px solid var(--line)',
      }}
    >
      {/* Tier accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: tier.color,
      }} />

      {/* Header: tier badge + deadline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}
           onClick={onOpen}>
        <TierBadge tier={goal.tier} kind="goal" size="sm" showXP />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600,
          color: overdue ? 'var(--red)' : 'var(--text-dim)',
        }}>
          <Icon name="calendar" size={11} color={overdue ? 'var(--red)' : 'var(--text-dim)'} />
          {dLabel}
        </div>
      </div>

      {/* Title */}
      <div onClick={onOpen} style={{ cursor: 'pointer' }}>
        <div style={{
          fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em',
          lineHeight: 1.2, marginBottom: 4,
        }}>
          {goal.title}
        </div>
        {hasTarget && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
            {goal.progressCurrent ?? 0} / {goal.progressTarget} {goal.progressUnit ?? ''}
            {' · '}
            <span style={{ color: tier.color, fontWeight: 600 }}>{Math.round(pct * 100)}%</span>
          </div>
        )}
        {!hasTarget && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
            без числовой цели
          </div>
        )}

        {/* Progress bar — segmented for visual interest, matches expedition feel */}
        {hasTarget && (
          <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 2,
                background: i < Math.floor(pct * 16) ? tier.color : 'var(--line)',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Steppers */}
      {hasTarget && (
        <ProgressSteppers
          goal={goal}
          onChange={onProgress}
          compact
        />
      )}

      {/* Tags */}
      {(goal.tags?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {goal.tags!.map((t) => (
            <span key={t} className="pill outline" style={{ fontSize: 10 }}>{t}</span>
          ))}
        </div>
      )}
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
  const [explainerOpen, setExplainerOpen] = useState(false)
  // Title prefilled by inline-mode deep link (`lifeos-create-goal` event).
  const [prefilledTitle, setPrefilledTitle] = useState<string>('')

  // Listen for the inline-mode "create goal X" deep link from App.tsx.
  useEffect(() => {
    const onCreate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { title?: string } | undefined
      if (!detail?.title) return
      setEditing(null)
      setPrefilledTitle(detail.title)
      setOpenAdd(true)
    }
    window.addEventListener('lifeos-create-goal', onCreate)
    return () => window.removeEventListener('lifeos-create-goal', onCreate)
  }, [])

  // Sort active goals: epic > hard > normal > light, then by deadline
  const tierOrder: Record<GoalTier, number> = { epic: 0, hard: 1, normal: 2, light: 3 }
  const active = goals
    .filter((g) => !g.completed)
    .slice()
    .sort((a, b) => {
      const ta = tierOrder[(a.tier ?? 'normal') as GoalTier]
      const tb = tierOrder[(b.tier ?? 'normal') as GoalTier]
      if (ta !== tb) return ta - tb
      const da = a.endDate ? dayjs(a.endDate).valueOf() : Infinity
      const db = b.endDate ? dayjs(b.endDate).valueOf() : Infinity
      return da - db
    })

  const completed = goals.filter((g) => g.completed)

  // Tier breakdown for header chip
  const tierCounts = active.reduce((acc, g) => {
    const t = (g.tier ?? 'normal') as GoalTier
    acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {} as Record<GoalTier, number>)

  return (
    <>
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="scroll screen-enter">
        {/* Header */}
        <div className="w-row between" style={{ padding: '4px 4px 6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="flag" size={20} color="var(--accent)" stroke={2} />
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Цели</div>
            </div>
            <div className="w-sub" style={{ marginTop: 4 }}>
              Долгосрочные экспедиции — отличаются от привычек
              <button
                onClick={() => setExplainerOpen(true)}
                style={{ marginLeft: 6, background: 'transparent', border: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: 12, padding: 0 }}
              >
                что это?
              </button>
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

        {/* Tier summary strip */}
        {active.length > 0 && (
          <div style={{
            display: 'flex', gap: 6, padding: '8px 4px 14px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {(['epic', 'hard', 'normal', 'light'] as GoalTier[]).map((t) => {
              const count = tierCounts[t] ?? 0
              if (count === 0) return null
              const m = tierMeta(t)
              return (
                <div key={t} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 9px', borderRadius: 10,
                  background: `${m.color}11`, border: `1px solid ${m.color}33`,
                  flexShrink: 0,
                }}>
                  <Icon name={m.icon} size={11} color={m.color} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {count}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{m.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Expedition cards — swipe right to mark complete + claim full tier XP */}
        {active.map((g) => (
          <SwipeRow
            key={g.id}
            onComplete={() => { toggleComplete(g.id); haptic('success') }}
            actionLabel={`+${GOAL_TIER_XP[(g.tier ?? 'normal') as GoalTier]} XP`}
          >
            <ExpeditionCard
              goal={g}
              onOpen={() => { setEditing(g); setOpenAdd(true) }}
              onProgress={(v) => updateGoal(g.id, { progressCurrent: v })}
            />
          </SwipeRow>
        ))}

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 28 }}>
            <Icon name="mountain" size={36} color="var(--text-faint)" stroke={1.5} />
            <div style={{ marginTop: 12, marginBottom: 4, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Целей пока нет
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16, maxWidth: 260, marginInline: 'auto' }}>
              Цель — это значимая экспедиция, путь к которой ты планируешь пройти. AI поможет выбрать сложность.
            </div>
            <button className="fab" style={{ width: 'auto', padding: '10px 18px', borderRadius: 14, display: 'inline-flex' }}
                    onClick={() => { setEditing(null); setOpenAdd(true); haptic('medium') }}>
              <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} /> Создать первую цель
            </button>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <div className="sec-h" style={{ marginTop: 16 }}><span className="t">Завершённые</span></div>
            {completed.map((g) => (
              <div key={g.id} className="lrow" style={{ opacity: 0.6 }}>
                <div className="check done"><Icon name="check" size={12} color="#0a0a0b" stroke={3} /></div>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${tierMeta(g.tier).color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={tierMeta(g.tier).icon} size={16} color={tierMeta(g.tier).color} />
                </div>
                <div className="meta">
                  <div className="t1">{g.title}</div>
                  <div className="t2">+{GOAL_TIER_XP[(g.tier ?? 'normal') as GoalTier]} XP · {g.progressCurrent ?? 0} / {g.progressTarget ?? '?'}</div>
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

      {/* Create/edit sheet */}
      <Sheet open={openAdd} onClose={() => { setOpenAdd(false); setPrefilledTitle('') }} title={editing ? 'Цель' : 'Новая цель'}>
        <GoalForm
          initial={editing}
          prefilledTitle={prefilledTitle}
          onSubmit={(data) => {
            if (editing) {
              updateGoal(editing.id, data)
            } else {
              addGoal({
                title: data.title!,
                startDate: dayjs().format('YYYY-MM-DD'),
                endDate: data.endDate,
                frequency: 'none',
                tags: data.tags,
                progressCurrent: data.progressCurrent,
                progressTarget: data.progressTarget,
                progressUnit: data.progressUnit,
                tier: data.tier,
                tierConfirmedByAI: data.tierConfirmedByAI,
              })
            }
            haptic('success')
            setOpenAdd(false)
            setPrefilledTitle('')
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

      {/* Explainer sheet — answers "what's the difference?" */}
      <Sheet open={explainerOpen} onClose={() => setExplainerOpen(false)} title="Цели vs Привычки">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--text)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>ЦЕЛЬ — экспедиция</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              Это разовое значимое достижение с дедлайном. У цели есть путь: ты двигаешься к финишу.
              Примеры: пробежать марафон, выучить язык, запустить курс.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', marginBottom: 6 }}>ПРИВЫЧКА — ритм</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              Это то, что ты делаешь регулярно. Метрика — серия (streak). Привычка не «завершается», она поддерживается.
              Примеры: 30 минут чтения, тренировка, утренний душ.
            </div>
          </div>
          <div style={{ marginTop: 4, padding: 14, borderRadius: 12, background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Тиры сложности
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, lineHeight: 1.4 }}>
              <div><TierBadge tier="light" kind="goal" size="xs" showXP /> &nbsp; «сходить в магазин, прочитать статью»</div>
              <div><TierBadge tier="normal" kind="goal" size="xs" showXP /> &nbsp; «прочитать книгу, закрыть проект»</div>
              <div><TierBadge tier="hard" kind="goal" size="xs" showXP /> &nbsp; «пробежать марафон, запустить курс»</div>
              <div><TierBadge tier="epic" kind="goal" size="xs" showXP /> &nbsp; «выучить язык, написать книгу»</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              XP за выполнение зависит от сложности — так марафон и поход в магазин не дают одинаковую высоту на горе друзей.
            </div>
          </div>
        </div>
      </Sheet>
    </>
  )
}

function GoalForm({
  initial, prefilledTitle, onSubmit, onComplete, onDelete,
}: {
  initial: Goal | null
  prefilledTitle?: string
  onSubmit: (data: Partial<Goal>) => void
  onComplete?: () => void
  onDelete?: () => void
}) {
  // Priority: editing initial > prefilled (from inline deep link) > empty
  const [title, setTitle] = useState(initial?.title ?? prefilledTitle ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [tier, setTier] = useState<GoalTier>((initial?.tier ?? 'normal') as GoalTier)
  const [tierConfirmedByAI, setTierConfirmedByAI] = useState(initial?.tierConfirmedByAI ?? false)
  const [progressCurrent, setProgressCurrent] = useState(initial?.progressCurrent ?? 0)
  const [progressTarget, setProgressTarget] = useState(initial?.progressTarget ?? 0)
  const [progressUnit, setProgressUnit] = useState(initial?.progressUnit ?? '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Название">
        <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder="Финский до B1" style={fieldInput} />
      </Field>

      <Field label="Сложность">
        <TierPicker
          kind="goal"
          value={tier}
          onChange={(t) => { setTier(t as GoalTier); setTierConfirmedByAI(false) }}
          title={title}
          onAIConfirmed={() => setTierConfirmedByAI(true)}
        />
      </Field>

      <Field label="До какой даты">
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={fieldInput} />
      </Field>

      <Field label="Единица измерения (опционально)">
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

      <button className="fab" disabled={!title.trim()}
              onClick={() => onSubmit({
                title: title.trim(),
                endDate: endDate || undefined,
                tier,
                tierConfirmedByAI,
                progressCurrent, progressTarget, progressUnit,
              })}>
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
