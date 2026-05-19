import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icons'
import { api } from '../lib/botApi'
import { useUser } from '../lib/useUser'
import { haptic } from '../lib/haptic'

export function PremiumSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, reload } = useUser()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!data) return null

  const buy = async () => {
    setBusy(true); setErr(null)
    try {
      await api.buyPremium()
      setSent(true)
      haptic('success')
    } catch (e) {
      setErr((e as Error)?.message || 'Не удалось открыть оплату')
      haptic('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Premium-подписка">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.user.is_premium ? (
          <div style={{
            padding: '16px', borderRadius: 14,
            background: 'rgba(198,248,78,0.10)', border: '1px solid var(--accent)',
            color: 'var(--text)', fontSize: 14,
          }}>
            ✨ Premium активен. Осталось <b>{data.user.premium_days_left} дн.</b>
            <br /><br />
            Можно продлить заранее — дни прибавятся к текущему сроку.
          </div>
        ) : data.user.in_trial ? (
          <div style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'var(--panel)', color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5,
          }}>
            🎁 У тебя сейчас триал — осталось <b style={{ color: 'var(--text)' }}>
              {data.user.trial_days_left} дн.</b>
            <br />Купи Premium заранее, чтобы не прерывать привычки.
          </div>
        ) : (
          <div style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'rgba(255,82,82,0.10)', border: '1px solid var(--red)',
            color: 'var(--text)', fontSize: 13, lineHeight: 1.5,
          }}>
            ❗ Триал закончился. Купи Premium, чтобы продолжить.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Безлимитный доступ ко всем разделам',
            'ИИ-психолог в дневнике (Claude Haiku)',
            'Ежедневные напоминания в Telegram',
            'Поддержка проекта 🙏',
          ].map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent)', color: '#0a0a0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="check" size={12} color="#0a0a0b" stroke={3} />
              </span>
              <span style={{ color: 'var(--text)' }}>{line}</span>
            </div>
          ))}
        </div>

        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'var(--panel)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Цена
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {data.premium_price_stars}⭐
              <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500, marginLeft: 6 }}>
                / {data.premium_days} дней
              </span>
            </div>
          </div>
        </div>

        {!sent ? (
          <button
            className="fab"
            onClick={buy}
            disabled={busy}
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            ⭐ {busy ? 'Открываю…' : `Купить за ${data.premium_price_stars}⭐`}
          </button>
        ) : (
          <>
            <div style={{
              padding: '14px 16px', borderRadius: 14, background: 'var(--panel)',
              color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5,
            }}>
              📩 Счёт отправлен в чат с ботом. Оплати и нажми «Проверить».
            </div>
            <button className="fab" onClick={() => reload()}>
              ✓ Я оплатил — проверить
            </button>
          </>
        )}

        {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>}
      </div>
    </Sheet>
  )
}
