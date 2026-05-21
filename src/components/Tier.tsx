/**
 * Tier — visual + chooser primitives for the difficulty system.
 *
 * Why this lives here: both Goals and Habits use the same chooser shape and
 * the same badge appearance on cards/lists. Keeping it in one file means the
 * XP economy stays consistent across the app (single source for labels,
 * colors, XP values).
 */
import { useState } from 'react'
import {
  GOAL_TIER_XP, HABIT_TIER_XP,
  type GoalTier, type HabitTier,
} from '../types'
import { Icon } from './Icons'
import { api } from '../lib/botApi'
import { haptic } from '../lib/haptic'

export type AnyTier = GoalTier | HabitTier

export interface TierMeta {
  key: AnyTier
  label: string
  color: string            // CSS color
  icon: 'leaf' | 'zap' | 'flame' | 'gem'
  xp: (kind: 'goal' | 'habit') => number
  blurb: string            // one-line explainer for the picker
}

// Lookup table for all four tiers. We render the chooser by filtering this
// down to the three relevant entries for habits.
export const TIERS: TierMeta[] = [
  {
    key: 'light',
    label: 'Лёгкая',
    color: '#6be99a',
    icon: 'leaf',
    xp: (k) => k === 'goal' ? GOAL_TIER_XP.light : HABIT_TIER_XP.light,
    blurb: 'минуты-часы',
  },
  {
    key: 'normal',
    label: 'Обычная',
    color: '#c6f84e',
    icon: 'zap',
    xp: (k) => k === 'goal' ? GOAL_TIER_XP.normal : HABIT_TIER_XP.normal,
    blurb: 'дни-неделя',
  },
  {
    key: 'hard',
    label: 'Сложная',
    color: '#ff8a3d',
    icon: 'flame',
    xp: (k) => k === 'goal' ? GOAL_TIER_XP.hard : HABIT_TIER_XP.hard,
    blurb: 'недели-месяцы',
  },
  {
    key: 'epic',
    label: 'Эпическая',
    color: '#b59cff',
    icon: 'gem',
    xp: (k) => GOAL_TIER_XP.epic, // goals only
    blurb: 'месяцы-годы',
  },
]

export function tierMeta(tier: AnyTier | undefined): TierMeta {
  return TIERS.find((t) => t.key === (tier ?? 'normal')) ?? TIERS[1]
}

// ─── Compact badge: used on cards/lists ─────────────────
export function TierBadge({
  tier,
  kind,
  size = 'sm',
  showXP = false,
}: {
  tier: AnyTier | undefined
  kind: 'goal' | 'habit'
  size?: 'xs' | 'sm' | 'md'
  showXP?: boolean
}) {
  const t = tierMeta(tier)
  const px = size === 'xs' ? 4 : size === 'sm' ? 6 : 8
  const py = size === 'xs' ? 2 : 3
  const fs = size === 'xs' ? 9 : size === 'sm' ? 10 : 11
  const iconSize = size === 'xs' ? 9 : size === 'sm' ? 11 : 12
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: `${py}px ${px}px`, borderRadius: 6,
      background: `${t.color}22`, color: t.color,
      fontSize: fs, fontWeight: 700, letterSpacing: '0.04em',
      lineHeight: 1, textTransform: 'uppercase',
      border: `1px solid ${t.color}44`,
    }}>
      <Icon name={t.icon} size={iconSize} color={t.color} />
      {t.label}
      {showXP && <span style={{ opacity: 0.7, fontWeight: 500 }}>· {t.xp(kind)} XP</span>}
    </span>
  )
}

// ─── Full chooser: used in create/edit forms ────────────
export function TierPicker({
  kind,
  value,
  onChange,
  title,                 // for AI-suggest button
  onAIConfirmed,         // callback when user accepts AI suggestion
}: {
  kind: 'goal' | 'habit'
  value: AnyTier
  onChange: (tier: AnyTier) => void
  title?: string
  onAIConfirmed?: (tier: AnyTier) => void
}) {
  const tiers = kind === 'goal' ? TIERS : TIERS.filter((t) => t.key !== 'epic')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<{ tier: AnyTier; reason: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const askAI = async () => {
    if (!title || title.trim().length < 2) {
      setError('Сначала напиши название')
      return
    }
    setError(null)
    setSuggesting(true)
    try {
      const res = await (api as any).suggestTier(title.trim(), kind)
      if (res?.tier) {
        setSuggestion({ tier: res.tier as AnyTier, reason: res.reason || '' })
        haptic('success')
      } else {
        setError('AI недоступен — выбери вручную')
      }
    } catch {
      setError('AI недоступен — выбери вручную')
    } finally {
      setSuggesting(false)
    }
  }

  const accept = () => {
    if (suggestion) {
      onChange(suggestion.tier)
      onAIConfirmed?.(suggestion.tier)
      haptic('medium')
      setSuggestion(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiers.length}, 1fr)`, gap: 6 }}>
        {tiers.map((t) => {
          const on = t.key === value
          return (
            <button
              key={t.key}
              onClick={() => { onChange(t.key); haptic('select') }}
              style={{
                padding: '10px 6px', borderRadius: 12, border: 0, cursor: 'pointer',
                background: on ? t.color : 'var(--panel-2)',
                color: on ? '#0a0a0b' : 'var(--text-dim)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon name={t.icon} size={16} color={on ? '#0a0a0b' : t.color} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.label}
              </span>
              <span style={{ fontSize: 9, opacity: on ? 0.7 : 0.5 }}>
                {t.xp(kind)} XP
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={askAI}
        disabled={suggesting}
        style={{
          padding: '10px 12px', borderRadius: 12, border: '1px dashed var(--line)',
          background: 'transparent', color: 'var(--accent)', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
          opacity: suggesting ? 0.5 : 1,
        }}
      >
        <Icon name="sparkle" size={12} color="var(--accent)" />
        {suggesting ? 'Думаю…' : 'Подсказать сложность'}
      </button>

      {suggestion && (
        <div style={{
          padding: 10, borderRadius: 12,
          background: `${tierMeta(suggestion.tier).color}11`,
          border: `1px solid ${tierMeta(suggestion.tier).color}44`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-dim)' }}>AI предлагает:</span>
            <TierBadge tier={suggestion.tier} kind={kind} size="xs" showXP />
          </div>
          {suggestion.reason && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              «{suggestion.reason}»
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={accept}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 10, border: 0,
                background: tierMeta(suggestion.tier).color, color: '#0a0a0b',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Принять
            </button>
            <button
              onClick={() => setSuggestion(null)}
              style={{
                padding: '8px 10px', borderRadius: 10, border: 0,
                background: 'var(--panel-2)', color: 'var(--text-dim)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: 'var(--warn)' }}>{error}</div>
      )}
    </div>
  )
}
