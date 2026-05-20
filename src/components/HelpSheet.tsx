import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icons'
import { haptic } from '../lib/haptic'

interface QA {
  q: string
  a: string
}

const FAQ: QA[] = [
  {
    q: 'Где сохраняются мои данные?',
    a: 'Все привычки, цели, финансы и дневник сохраняются в облаке Telegram (CloudStorage) — синхронизируются между всеми твоими устройствами автоматически. Дополнительно дублируются в IndexedDB и localStorage браузера на случай оффлайна.',
  },
  {
    q: 'Как работает Premium?',
    a: 'Первые 7 дней — бесплатный триал, потом доступ блокируется. Premium-подписка (100⭐ ≈ $2) разблокирует приложение на 30 дней + открывает ИИ-психолога в дневнике. Дни можно продлевать заранее — они прибавятся к текущему сроку.',
  },
  {
    q: 'Что такое Telegram Stars и как платить?',
    a: 'Stars — внутренняя валюта Telegram, аналог жетонов. Купить можно прямо в Telegram (в меню «Настройки» → «Telegram Stars») картой или через Apple/Google Pay. Раз купив пакет Stars, ты используешь их в любом боте.',
  },
  {
    q: 'Как добавить друга?',
    a: 'Два способа: (1) тап на «+» в шапке «Друзей» откроет share-меню — отправь ссылку нужному человеку, он жмёт Start и вы автоматически становитесь друзьями. (2) В разделе «Кто ещё в LifeOS» можно одним тапом добавить любого активного пользователя.',
  },
  {
    q: 'Как настроить напоминания?',
    a: 'Тапни иконку 🔔 в шапке любого экрана. Можно задать время утреннего пинга (отметить привычки), вечернего (записать день) и воскресного (обзор целей). Бот будет писать тебе в чат в указанное время по Москве.',
  },
  {
    q: 'Анализ настроения от ИИ — это безопасно?',
    a: 'Записи отправляются на Claude Haiku (Anthropic) только при нажатии «Проанализировать», только за последние 7-30 дней. Anthropic не использует их для обучения. Мы не храним результаты — они показываются один раз и не сохраняются.',
  },
  {
    q: 'Можно ли экспортировать данные?',
    a: 'Пока нет, но в планах. Если очень нужно — напиши в поддержку, поможем вручную.',
  },
  {
    q: 'Как удалить аккаунт?',
    a: 'Напиши в поддержку «удалите мой аккаунт» с твоего Telegram-аккаунта. Удалим все данные в течение 24 часов.',
  },
]

const TG_SUPPORT_URL = 'https://t.me/OS_of_life_bot'

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const openSupport = () => {
    haptic('medium')
    const tg = window.Telegram?.WebApp as any
    try {
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(TG_SUPPORT_URL)
      } else {
        window.open(TG_SUPPORT_URL, '_blank')
      }
    } catch { /* noop */ }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Помощь">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FAQ.map((qa, i) => {
          const isOpen = openIdx === i
          return (
            <div key={i} style={{
              background: 'var(--panel)', borderRadius: 14, overflow: 'hidden',
            }}>
              <button
                onClick={() => { setOpenIdx(isOpen ? null : i); haptic('select') }}
                style={{
                  width: '100%', padding: '14px 16px', border: 0, background: 'transparent',
                  color: 'var(--text)', textAlign: 'left', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}
              >
                <span style={{ flex: 1 }}>{qa.q}</span>
                <span style={{
                  flexShrink: 0, color: 'var(--text-faint)',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}>
                  <Icon name="chev-r" size={14} />
                </span>
              </button>
              {isOpen && (
                <div style={{
                  padding: '0 16px 14px',
                  fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.55,
                }}>
                  {qa.a}
                </div>
              )}
            </div>
          )
        })}

        <div style={{
          marginTop: 8, padding: 14, borderRadius: 14, background: 'var(--panel-2)',
          fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5,
        }}>
          Не нашёл ответ? Напиши в поддержку — отвечу в течение суток.
        </div>

        <button className="fab" onClick={openSupport}>
          <Icon name="edit" size={14} color="#0a0a0b" stroke={2.6} /> Написать в поддержку
        </button>
      </div>
    </Sheet>
  )
}
