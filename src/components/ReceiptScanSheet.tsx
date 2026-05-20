import { useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Sheet } from './Sheet'
import { Icon } from './Icons'
import { haptic } from '../lib/haptic'
import { api, type ReceiptParse } from '../lib/botApi'
import { useFinanceStore } from '../store/financeStore'
import type { FinanceCategory } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Three states: idle (file picker) → parsing (spinner) → preview (confirm form).
 * On confirm we write the expense to the finance store.
 */
type Stage = 'idle' | 'parsing' | 'preview' | 'error'

// Resize image before sending so we stay well under both aiohttp's body limit
// and Claude's input cap. 1280px @ q=0.75 is fine for OCR — receipt text
// remains crisp, and a typical photo ends up ~150-300 KB before base64.
async function fileToBase64Resized(file: File): Promise<{ b64: string; type: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('FileReader failed'))
    r.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('image decode failed'))
    i.src = dataUrl
  })

  const MAX = 1280
  const scale = Math.min(1, MAX / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(img, 0, 0, w, h)
  const jpeg = canvas.toDataURL('image/jpeg', 0.75)
  const b64 = jpeg.split(',')[1]
  return { b64, type: 'image/jpeg' }
}

export function ReceiptScanSheet({ open, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const addEntry = useFinanceStore((s) => s.addEntry)

  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ReceiptParse | null>(null)
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [category, setCategory] = useState<FinanceCategory>('food')

  const reset = () => {
    setStage('idle'); setError(null); setParsed(null)
    setAmount(0); setNote(''); setDate(dayjs().format('YYYY-MM-DD'))
    setCategory('food')
    if (fileRef.current) fileRef.current.value = ''
  }

  const onPickFile = async (file: File) => {
    setStage('parsing'); setError(null); haptic('medium')
    try {
      const { b64, type } = await fileToBase64Resized(file)
      console.log('[receipt] resized payload', { bytes: b64.length, type, originalKB: Math.round(file.size / 1024) })
      const res = await api.parseReceipt(b64, type)
      if (res.error) {
        setError(`Сервер: ${res.error}`)
        setStage('error')
        haptic('error')
        return
      }
      if (!res.amount || (res.confidence ?? 0) < 0.3) {
        setError(res.note || 'Не удалось распознать чек. Попробуй ещё раз с лучшим освещением.')
        setStage('error')
        haptic('error')
        return
      }
      setParsed(res)
      setAmount(Math.round(res.amount))
      setNote(res.vendor || '')
      setDate(res.date && res.date.length === 10 ? res.date : dayjs().format('YYYY-MM-DD'))
      setCategory(((res.category as FinanceCategory) || 'food'))
      setStage('preview')
      haptic('success')
    } catch (e) {
      const msg = (e as Error)?.message || String(e)
      // iOS Safari shows "Load failed" for any network-level fetch failure.
      // Map it to something human-readable so user knows what to try.
      const friendly =
        msg.includes('Load failed') || msg.includes('NetworkError') || msg.includes('Failed to fetch')
          ? 'Не удалось отправить фото. Проверь интернет или попробуй фото поменьше.'
          : msg
      setError(friendly)
      setStage('error')
      haptic('error')
    }
  }

  const handleSave = () => {
    if (!amount) return
    addEntry({ type: 'expense', amount, category, note: note || undefined, date })
    haptic('success')
    reset()
    onClose()
  }

  return (
    <Sheet open={open} onClose={() => { reset(); onClose() }} title="Сканировать чек">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stage === 'idle' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Сделай фото чека или загрузи готовое — ИИ распознает сумму, дату и категорию.
              Перед сохранением можно подправить вручную.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onPickFile(f)
              }}
            />
            <button
              className="fab"
              onClick={() => fileRef.current?.click()}
            >
              📷 Сфотографировать
            </button>
            <button
              className="fab ghost"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute('capture')
                  fileRef.current.click()
                  // restore capture for next time
                  setTimeout(() => fileRef.current?.setAttribute('capture', 'environment'), 100)
                }
              }}
            >
              🖼 Загрузить из галереи
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginTop: 4 }}>
              Доступно только в Premium и триале
            </div>
          </>
        )}

        {stage === 'parsing' && (
          <div style={{
            padding: 30, textAlign: 'center',
            color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            Распознаю чек…<br/>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>обычно 3-5 секунд</span>
          </div>
        )}

        {stage === 'error' && (
          <>
            <div style={{
              padding: 14, borderRadius: 14,
              background: 'rgba(255,82,82,0.10)', border: '1px solid var(--red)',
              color: 'var(--text)', fontSize: 13, lineHeight: 1.5,
            }}>
              <b>Не получилось.</b><br/>
              {error}
            </div>
            <button className="fab" onClick={reset}>Попробовать ещё раз</button>
          </>
        )}

        {stage === 'preview' && (
          <>
            <div style={{
              padding: 14, borderRadius: 14, background: 'var(--panel)',
              fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5,
            }}>
              ✓ Распознано. Проверь и сохрани — или подправь поля.
              {parsed?.note && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                  Заметка ИИ: {parsed.note}
                </div>
              )}
            </div>

            <Field label="Сумма ₽">
              <input
                type="text"
                inputMode="numeric"
                value={amount > 0 ? amount.toLocaleString('ru-RU') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '')
                  setAmount(raw ? +raw : 0)
                }}
                style={fieldInput}
              />
            </Field>

            <Field label="Дата">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldInput} />
            </Field>

            <Field label="Комментарий">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} style={fieldInput} />
            </Field>

            <Field label="Категория">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['food', 'cafe', 'transport', 'shopping', 'entertainment', 'subscriptions', 'housing', 'gifts', 'other_expense'] as FinanceCategory[]).map((c) => {
                  const on = category === c
                  return (
                    <button key={c} onClick={() => setCategory(c)}
                            style={{
                              padding: '8px 12px', borderRadius: 12, border: 0, cursor: 'pointer',
                              background: on ? 'var(--accent)' : 'var(--panel)',
                              color: on ? '#0a0a0b' : 'var(--text)',
                              fontSize: 12, fontWeight: 600,
                            }}>
                      {c === 'food' ? 'Продукты' : c === 'cafe' ? 'Кафе' :
                       c === 'transport' ? 'Транспорт' : c === 'shopping' ? 'Покупки' :
                       c === 'entertainment' ? 'Развлеч.' : c === 'subscriptions' ? 'Подписки' :
                       c === 'housing' ? 'Жильё' : c === 'gifts' ? 'Подарки' : 'Прочее'}
                    </button>
                  )
                })}
              </div>
            </Field>

            <button className="fab" disabled={!amount} onClick={handleSave}>
              <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} /> Сохранить
            </button>
            <button className="fab ghost" onClick={reset}>
              ↺ Распознать другой чек
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// Reuse the small Field/fieldInput utility style from Habits.tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  )
}

const fieldInput: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 14,
  background: 'var(--panel)', border: '1px solid var(--line)',
  color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'inherit',
}
