import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icons'
import { api } from '../lib/botApi'
import { useUser } from '../lib/useUser'
import { haptic } from '../lib/haptic'

interface State {
  enabled: boolean
  morning_time: string
  evening_time: string
  weekly_goal_time: string
}

export function RemindersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, reload } = useUser()
  const [state, setState] = useState<State>({
    enabled: true,
    morning_time: '',
    evening_time: '',
    weekly_goal_time: '',
  })
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // Pull initial state from /api/me payload when sheet opens
  useEffect(() => {
    if (open && data?.reminders) {
      setState({
        enabled: data.reminders.enabled,
        morning_time: data.reminders.morning_time,
        evening_time: data.reminders.evening_time,
        weekly_goal_time: data.reminders.weekly_goal_time,
      })
      setSaved(false)
    }
  }, [open, data])

  const save = async () => {
    setBusy(true); setSaved(false)
    try {
      await api.setReminders(state)
      await reload()
      setSaved(true)
      haptic('success')
    } catch {
      haptic('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Напоминания">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          Бот будет писать тебе в чат напоминания в указанное время
          (часовой пояс — МСК). Пустое поле = выкл.
        </div>

        <ToggleRow
          label="Получать напоминания"
          value={state.enabled}
          onChange={(v) => setState((s) => ({ ...s, enabled: v }))}
        />

        <TimeRow
          label="Утро — отметить привычки"
          value={state.morning_time}
          onChange={(v) => setState((s) => ({ ...s, morning_time: v }))}
          placeholder="08:00"
        />
        <TimeRow
          label="Вечер — записать день в дневник"
          value={state.evening_time}
          onChange={(v) => setState((s) => ({ ...s, evening_time: v }))}
          placeholder="21:30"
        />
        <TimeRow
          label="Воскресенье — обзор целей"
          value={state.weekly_goal_time}
          onChange={(v) => setState((s) => ({ ...s, weekly_goal_time: v }))}
          placeholder="10:00"
        />

        <button
          className="fab"
          onClick={save}
          disabled={busy}
          style={{ opacity: busy ? 0.6 : 1, marginTop: 6 }}
        >
          <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} />
          {busy ? 'Сохраняю…' : saved ? 'Сохранено ✓' : 'Сохранить'}
        </button>
      </div>
    </Sheet>
  )
}

function TimeRow({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 6,
      }}>
        {label}
      </div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14,
          background: 'var(--panel)', border: '1px solid var(--line)',
          color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function ToggleRow({ label, value, onChange }: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => { onChange(!value); haptic('select') }}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderRadius: 14,
        background: 'var(--panel)', border: 0, cursor: 'pointer',
        color: 'var(--text)', fontSize: 14, fontWeight: 500,
      }}
    >
      <span>{label}</span>
      <span style={{
        width: 36, height: 22, borderRadius: 22,
        background: value ? 'var(--accent)' : 'var(--line-2)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 16 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s',
        }} />
      </span>
    </button>
  )
}
