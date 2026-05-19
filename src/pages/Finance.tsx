import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon, type IconName } from '../components/Icons'
import { TickRow, Sparkline } from '../components/Widgets'
import { Sheet } from '../components/Sheet'
import { useFinanceStore } from '../store/financeStore'
import { haptic } from '../lib/haptic'
import type { FinanceCategory, FinanceType } from '../types'
import { Field, fieldInput } from './Habits'

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
}

const CAT_META: Record<FinanceCategory, { label: string; icon: IconName; color: string }> = {
  salary:         { label: 'Зарплата',  icon: 'card',   color: 'var(--good)' },
  project:        { label: 'Проекты',   icon: 'card',   color: 'var(--good)' },
  investment:     { label: 'Инвестиции',icon: 'card',   color: 'var(--good)' },
  other_income:   { label: 'Прочее',    icon: 'card',   color: 'var(--good)' },
  food:           { label: 'Продукты',  icon: 'food',   color: 'var(--accent)' },
  transport:      { label: 'Транспорт', icon: 'card',   color: 'var(--cyan)' },
  housing:        { label: 'Жильё',     icon: 'home',   color: 'var(--violet)' },
  shopping:       { label: 'Покупки',   icon: 'bag',    color: 'var(--pink)' },
  cafe:           { label: 'Кафе',      icon: 'coffee', color: 'var(--warn)' },
  subscriptions:  { label: 'Подписки',  icon: 'film',   color: 'var(--violet)' },
  entertainment:  { label: 'Развлечения', icon: 'star', color: 'var(--cyan)' },
  gifts:          { label: 'Подарки',   icon: 'gift',   color: 'var(--pink)' },
  other_expense:  { label: 'Прочее',    icon: 'gift',   color: 'var(--text-faint)' },
}

const INCOME_CATS: FinanceCategory[] = ['salary', 'project', 'investment', 'other_income']
const EXPENSE_CATS: FinanceCategory[] = ['food', 'transport', 'cafe', 'subscriptions', 'shopping', 'entertainment', 'housing', 'gifts', 'other_expense']

export function Finance({ selectedDate, onDateChange }: Props) {
  const entries = useFinanceStore((s) => s.entries)
  const addEntry = useFinanceStore((s) => s.addEntry)
  const removeEntry = useFinanceStore((s) => s.removeEntry)

  const [range, setRange] = useState<'Месяц' | 'Год'>('Месяц')
  const [openAdd, setOpenAdd] = useState(false)

  // Range filter — Month uses selectedDate's month; Year uses its year.
  const selDay = dayjs(selectedDate)
  const isToday = selDay.isSame(dayjs(), 'day')
  const periodPrefix = range === 'Месяц' ? selDay.format('YYYY-MM') : selDay.format('YYYY')

  // Entries that fall inside the active period (month or year).
  const periodEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(periodPrefix)),
    [entries, periodPrefix],
  )
  // Entries for the selected day (used by "today" total under spending)
  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate],
  )

  // Balance = ALL-time, not period-filtered.
  const balance = entries.reduce((acc, e) => (e.type === 'income' ? acc + e.amount : acc - e.amount), 0)

  const income = periodEntries.filter((e) => e.type === 'income').reduce((a, e) => a + e.amount, 0)
  const expense = periodEntries.filter((e) => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  const dayExpense = dayEntries.filter((e) => e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  const dayIncome = dayEntries.filter((e) => e.type === 'income').reduce((a, e) => a + e.amount, 0)

  // Category breakdown for the active period
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {}
    periodEntries.filter((e) => e.type === 'expense').forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount
    })
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [periodEntries])

  // Running balance sparkline — window depends on range
  const sparkValues = useMemo(() => {
    const windowLen = range === 'Год' ? 365 : 30
    const days = Array.from({ length: windowLen }, (_, i) => selDay.subtract(windowLen - 1 - i, 'day').format('YYYY-MM-DD'))
    let running = 0
    return days.map((d) => {
      entries.filter((e) => e.date === d).forEach((e) => (running += e.type === 'income' ? e.amount : -e.amount))
      return running
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, range, selectedDate])

  // Recent income/expense — for the period
  const recentIncomeAmounts = periodEntries.filter((e) => e.type === 'income').slice(-5).map((e) => e.amount)
  const weekExpenses = Array.from({ length: 7 }, (_, i) => {
    const d = selDay.subtract(6 - i, 'day').format('YYYY-MM-DD')
    return entries.filter((e) => e.date === d && e.type === 'expense').reduce((a, e) => a + e.amount, 0)
  })

  const totalExpense = breakdown.reduce((a, c) => a + c.amount, 0) || 1
  // Operations: in period, latest first
  const recent = [...periodEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)

  return (
    <>
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="scroll screen-enter">
        <div className="w-row between" style={{ padding: '4px 4px 14px' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Финансы</div>
            <div className="w-sub">
              {range === 'Месяц' ? selDay.format('MMMM YYYY') : selDay.format('YYYY')}
              {isToday ? '' : ` · ${selDay.format('D MMM')}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="segmented">
              {(['Месяц', 'Год'] as const).map((r) => (
                <button key={r} className={range === r ? 'on' : ''}
                        onClick={() => { setRange(r); haptic('select') }}>{r}</button>
              ))}
            </div>
            <button
              className="fab"
              style={{ width: 'auto', padding: '10px 14px', borderRadius: 14 }}
              onClick={() => { setOpenAdd(true); haptic('medium') }}
              aria-label="Добавить операцию"
            >
              <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} />
            </button>
          </div>
        </div>

        {/* Balance hero */}
        <div className="widget" style={{ marginBottom: 8 }}>
          <div className="w-head">
            <div className="w-title accent">◆ ОСТАТОК</div>
            <span className="w-label">{selDay.format('D MMM')}</span>
          </div>
          <div className="w-row baseline" style={{ gap: 6, marginBottom: 4 }}>
            <span className="w-big">{formatN(balance)}</span>
            <span className="w-unit">₽</span>
          </div>
          <div className="w-row" style={{ gap: 6, fontSize: 11, marginBottom: 14 }}>
            <span style={{ color: 'var(--good)' }}>↑ {formatN(income)} ₽</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span style={{ color: 'var(--warn)' }}>↓ {formatN(expense)} ₽</span>
            {(dayExpense > 0 || dayIncome > 0) && (
              <>
                <span style={{ color: 'var(--text-faint)' }}>·</span>
                <span style={{ color: 'var(--text-dim)' }}>
                  {isToday ? 'сегодня' : selDay.format('D MMM')}: {formatN(dayIncome - dayExpense)} ₽
                </span>
              </>
            )}
          </div>
          <Sparkline values={sparkValues.length > 1 ? sparkValues : [0, 0]} color="var(--accent)" height={56} />
          <div className="w-row between" style={{ marginTop: 8 }}>
            <span className="w-label">{range === 'Год' ? '365 дней назад' : '30 дней назад'}</span>
            <span className="w-label">{isToday ? 'сегодня' : selDay.format('D MMM')}</span>
          </div>
        </div>

        {/* Income / Expense */}
        <div className="w-grid c2">
          <div className="widget tight">
            <div className="w-title good"><Icon name="arrow-d" size={11} color="var(--good)" /> ДОХОД</div>
            <div className="w-row baseline" style={{ gap: 4, marginTop: 8, marginBottom: 8 }}>
              <span className="w-mid">{formatN(income / 1000, 1)}</span>
              <span className="w-unit">к ₽</span>
            </div>
            <TickRow values={recentIncomeAmounts.length ? recentIncomeAmounts : [0]} color="var(--good)" height={24} />
            <div className="w-label" style={{ marginTop: 6 }}>{recentIncomeAmounts.length} поступлений</div>
          </div>
          <div className="widget tight">
            <div className="w-title red"><Icon name="arrow-u" size={11} color="var(--red)" /> РАСХОД</div>
            <div className="w-row baseline" style={{ gap: 4, marginTop: 8, marginBottom: 8 }}>
              <span className="w-mid">{formatN(expense / 1000, 1)}</span>
              <span className="w-unit">к ₽</span>
            </div>
            <TickRow values={weekExpenses.length ? weekExpenses : [0]} color="var(--pink)" height={24} />
            <div className="w-label" style={{ marginTop: 6 }}>за 7 дней</div>
          </div>
        </div>

        {/* Categories */}
        {breakdown.length > 0 && (
          <>
            <div className="sec-h"><span className="t">Категории</span></div>
            <div className="widget">
              <div style={{ display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                {breakdown.map((c, i) => (
                  <div key={i} style={{ width: `${(c.amount / totalExpense) * 100}%`, background: CAT_META[c.category as FinanceCategory]?.color ?? 'var(--text-faint)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {breakdown.map((c) => {
                  const meta = CAT_META[c.category as FinanceCategory]
                  if (!meta) return null
                  const pct = c.amount / totalExpense
                  return (
                    <div key={c.category} className="w-row" style={{ gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--panel-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={meta.icon} size={14} color={meta.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="w-row between" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                          <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>
                            {c.amount.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        <div className="h-progress" style={{ height: 3 }}>
                          <span style={{ width: `${pct * 100}%`, background: meta.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Recent transactions */}
        <div className="sec-h">
          <span className="t">Последние операции</span>
        </div>
        {recent.length === 0 ? (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 24 }}>
            Операций пока нет.
            <br />
            <button className="fab" style={{ marginTop: 14, width: 'auto', padding: '10px 16px', borderRadius: 14, display: 'inline-flex' }}
                    onClick={() => { setOpenAdd(true); haptic('medium') }}>
              <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} /> Добавить
            </button>
          </div>
        ) : (
          recent.map((e) => {
            const meta = CAT_META[e.category]
            const pos = e.type === 'income'
            return (
              <button key={e.id} className="lrow"
                      onClick={() => { if (confirm('Удалить операцию?')) { removeEntry(e.id); haptic('warning') } }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--panel-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={meta?.icon ?? 'card'} size={16} color={pos ? 'var(--good)' : 'var(--text-dim)'} />
                </div>
                <div className="meta">
                  <div className="t1">{e.note || meta?.label}</div>
                  <div className="t2">{meta?.label} · {dayjs(e.date).format('D MMM')}</div>
                </div>
                <span className="num" style={{
                  fontSize: 14, fontWeight: 600,
                  color: pos ? 'var(--good)' : 'var(--text)',
                }}>
                  {pos ? '+' : '−'}{Math.abs(e.amount).toLocaleString('ru-RU')} ₽
                </span>
              </button>
            )
          })
        )}

        {recent.length > 0 && (
          <button className="fab ghost" style={{ marginTop: 14 }}
                  onClick={() => { setOpenAdd(true); haptic('medium') }}>
            <Icon name="plus" size={14} /> Добавить операцию
          </button>
        )}
      </div>

      <Sheet open={openAdd} onClose={() => setOpenAdd(false)} title="Новая операция">
        <FinanceForm
          onSubmit={(data) => {
            addEntry(data)
            haptic('success')
            setOpenAdd(false)
          }}
        />
      </Sheet>
    </>
  )
}

function FinanceForm({
  onSubmit,
}: {
  onSubmit: (e: { type: FinanceType; amount: number; category: FinanceCategory; note?: string; date: string }) => void
}) {
  const [type, setType] = useState<FinanceType>('expense')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState<FinanceCategory>('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  // Reset category when switching type so we don't pass an "income" cat to an "expense" entry
  const switchType = (t: FinanceType) => {
    setType(t)
    setCategory(t === 'income' ? 'salary' : 'food')
  }

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Тип">
        <div className="segmented" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button className={type === 'expense' ? 'on' : ''} onClick={() => switchType('expense')}>− Расход</button>
          <button className={type === 'income' ? 'on' : ''} onClick={() => switchType('income')}>+ Доход</button>
        </div>
      </Field>
      <Field label="Сумма ₽">
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={amount > 0 ? amount.toLocaleString('ru-RU') : ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '')
            setAmount(raw ? +raw : 0)
          }}
          placeholder="0"
          style={fieldInput}
        />
      </Field>
      <Field label="Категория">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cats.map((c) => {
            const meta = CAT_META[c]
            const on = category === c
            return (
              <button key={c} onClick={() => setCategory(c)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 12, border: 0, cursor: 'pointer',
                        background: on ? 'var(--accent)' : 'var(--panel)',
                        color: on ? '#0a0a0b' : 'var(--text)',
                        fontSize: 13, fontWeight: 600,
                      }}>
                <Icon name={meta.icon} size={14} color={on ? '#0a0a0b' : meta.color} /> {meta.label}
              </button>
            )
          })}
        </div>
      </Field>
      <Field label="Комментарий">
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
               placeholder={type === 'income' ? 'Например — зарплата' : 'Например — продукты'} style={fieldInput} />
      </Field>
      <Field label="Дата">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldInput} />
      </Field>
      {amount > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--panel-2)', fontSize: 12, color: 'var(--text-dim)' }}>
          {type === 'income' ? '+' : '−'}{amount.toLocaleString('ru-RU')} ₽
        </div>
      )}
      <button className="fab" disabled={!amount}
              onClick={() => onSubmit({ type, amount, category, note: note || undefined, date })}>
        <Icon name="check" size={14} color="#0a0a0b" stroke={2.6} /> Добавить
      </button>
    </div>
  )
}

function formatN(v: number, frac = 0): string {
  return v.toLocaleString('ru-RU', { maximumFractionDigits: frac, minimumFractionDigits: 0 })
}
