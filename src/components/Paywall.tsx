import { useState } from 'react'
import { api } from '../lib/botApi'
import { invalidateUser, useUser } from '../lib/useUser'
import { Icon } from './Icons'
import { LifeOSMark } from './Widgets'
import { haptic } from '../lib/haptic'

/**
 * Full-screen blocking overlay shown once trial expires and the user has
 * no active Premium.
 */
export function Paywall() {
  const { data, reload } = useUser()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!data) return null
  const price = data.premium_price_stars
  const days = data.premium_days

  const buy = async () => {
    setBusy(true)
    setErr(null)
    try {
      await api.buyPremium()
      setSent(true)
      haptic('success')
    } catch (e: any) {
      setErr(e?.message || 'Не удалось открыть оплату')
      haptic('error')
    } finally {
      setBusy(false)
    }
  }

  const onCheckPayment = () => {
    void reload()
    invalidateUser()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(10,10,11,0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px calc(40px + var(--safe-bottom))',
        textAlign: 'center',
      }}
    >
      <LifeOSMark size={72} />
      <h1 style={{ margin: '20px 0 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
        Триал закончился
      </h1>
      <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}>
        Чтобы продолжить пользоваться PLanner, оформи Premium.<br />
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>
          {price}⭐ за {days} дней
        </span>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28, width: '100%', maxWidth: 320 }}>
        {!sent ? (
          <button
            onClick={buy}
            disabled={busy}
            style={{
              padding: '16px', borderRadius: 16, border: 0, cursor: 'pointer',
              background: 'var(--accent)', color: '#0a0a0b',
              fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
              opacity: busy ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {busy ? 'Открываю…' : `⭐ Купить за ${price}⭐`}
          </button>
        ) : (
          <>
            <div style={{
              padding: '14px 16px', borderRadius: 14, background: 'var(--panel)',
              fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4,
            }}>
              📩 Счёт отправлен в чат с ботом.<br />
              Оплати в Telegram и нажми «Проверить» ниже.
            </div>
            <button
              onClick={onCheckPayment}
              style={{
                padding: '14px', borderRadius: 14, border: 0, cursor: 'pointer',
                background: 'var(--accent)', color: '#0a0a0b',
                fontSize: 14, fontWeight: 700,
              }}
            >
              ✓ Я оплатил — проверить
            </button>
          </>
        )}
        {err && (
          <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
            {err}
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="check" size={11} color="var(--good)" /> Безлимитный доступ ко всем разделам
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="check" size={11} color="var(--good)" /> ИИ-анализ настроения в дневнике
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="check" size={11} color="var(--good)" /> Ежедневные напоминания в Telegram
        </span>
      </div>
    </div>
  )
}
