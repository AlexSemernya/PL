import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icons'
import { api, BotApiError } from '../lib/botApi'
import { useUser } from '../lib/useUser'
import { useDiaryStore } from '../store/diaryStore'
import { haptic } from '../lib/haptic'

type Range = 7 | 14 | 30

/**
 * Premium-only sheet that posts the last N days of diary entries to the
 * bot's /api/analyze endpoint (which forwards to Claude Haiku) and shows
 * the empathetic analysis.
 */
export function AnalyzeMoodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useUser()
  const entries = useDiaryStore((s) => s.entries)
  const [range, setRange] = useState<Range>(14)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState<string>('')
  const [err, setErr] = useState<string | null>(null)

  // Reset when reopening
  useEffect(() => {
    if (!open) {
      setText(''); setErr(null); setBusy(false)
    }
  }, [open])

  const isPremium = !!data?.user.is_premium

  const run = async () => {
    setBusy(true); setErr(null); setText('')
    try {
      const cutoff = Date.now() - range * 86400_000
      const recent = entries
        .filter((e) => new Date(e.date).getTime() >= cutoff)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-60)
      const res = await api.analyzeDiary(recent)
      setText(res.text)
      haptic('success')
    } catch (e) {
      if (e instanceof BotApiError && e.isPremiumRequired) {
        setErr('Нужен Premium')
      } else {
        setErr((e as Error)?.message || 'Не удалось получить анализ')
      }
      haptic('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Анализ от ИИ-психолога">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          Claude Haiku посмотрит твои записи за выбранный период и даст
          эмпатичный комментарий + один конкретный совет.
        </div>

        <div className="segmented" style={{ width: '100%' }}>
          {([7, 14, 30] as Range[]).map((d) => (
            <button
              key={d}
              className={range === d ? 'on' : ''}
              onClick={() => { setRange(d); haptic('select') }}
            >
              {d} дней
            </button>
          ))}
        </div>

        {!isPremium ? (
          <div style={{
            padding: '14px 16px', borderRadius: 14, background: 'var(--panel)',
            color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5,
          }}>
            🔒 Эта функция доступна в <b style={{ color: 'var(--text)' }}>Premium</b>.<br />
            Закрой это окно и купи подписку из меню.
          </div>
        ) : (
          <button
            className="fab"
            onClick={run}
            disabled={busy}
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            <Icon name="mood" size={14} color="#0a0a0b" stroke={2.4} />
            {busy ? 'Анализирую…' : `Проанализировать ${range} дней`}
          </button>
        )}

        {err && (
          <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>
        )}

        {text && (
          <div style={{
            padding: 14, borderRadius: 14, background: 'var(--panel)',
            color: 'var(--text)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {text}
          </div>
        )}
      </div>
    </Sheet>
  )
}
