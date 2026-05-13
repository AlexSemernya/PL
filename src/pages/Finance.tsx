import { useState } from 'react'
import { useFinanceStore } from '../store/financeStore'
import CalendarHeader from '../components/CalendarHeader'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { FinanceType, FinanceCategory } from '../types'
import dayjs from 'dayjs'

interface FinanceProps {
  selectedDate: string
  onDateChange: (d: string) => void
}

const INCOME_CATEGORIES: { id: FinanceCategory; label: string }[] = [
  { id: 'salary', label: 'Зарплата' },
  { id: 'project', label: 'Проект' },
  { id: 'investment', label: 'Инвестиции' },
  { id: 'other_income', label: 'Другое' },
]

const EXPENSE_CATEGORIES: { id: FinanceCategory; label: string }[] = [
  { id: 'food', label: 'Еда' },
  { id: 'transport', label: 'Транспорт' },
  { id: 'housing', label: 'Жилье' },
  { id: 'shopping', label: 'Покупки' },
  { id: 'entertainment', label: 'Развлечения' },
  { id: 'other_expense', label: 'Другое' },
]

export default function Finance({ selectedDate, onDateChange }: FinanceProps) {
  const { entries, addEntry, removeEntry, getBalance, getStreak, getChartData } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [type, setType] = useState<FinanceType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<FinanceCategory>('food')
  const [note, setNote] = useState('')

  const balance = getBalance()
  const streak = getStreak()
  const chartData = getChartData()

  const handleAdd = () => {
    const num = parseFloat(amount.replace(',', '.'))
    if (isNaN(num) || num <= 0) return
    addEntry({ type, amount: num, category, note: note || undefined, date: selectedDate })
    setAmount('')
    setNote('')
    setShowAdd(false)
  }

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  // Записи за выбранный день
  const dayEntries = entries
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="animate-slide-up">
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="page-scroll px-4 pt-4 pb-4">
        {/* Баланс + график */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="card">
            <span className="text-xs text-text-secondary font-medium">Баланс</span>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {balance.toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="card overflow-hidden p-2">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F7FFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F7FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="#4F7FFF" strokeWidth={1.5} fill="url(#finGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Серия без трат */}
        {streak > 0 && (
          <div className="card mb-3">
            <p className="text-xs text-text-secondary font-medium">Финансовая серия</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{streak} дней</p>
            <p className="text-xs text-text-secondary">без лишних трат</p>
          </div>
        )}

        {/* Финансовые цели — placeholder */}
        <div className="card mb-3 text-center py-6 text-text-secondary text-sm">
          Финансовые цели
        </div>

        {/* Записи дня */}
        {dayEntries.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {dayEntries.map((entry) => {
              const cats = entry.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
              const cat = cats.find((c) => c.id === entry.category)
              return (
                <div key={entry.id} className="card flex items-center justify-between py-3">
                  <div>
                    <p className="text-[15px] font-medium text-text-primary">
                      {cat?.label || entry.category}
                    </p>
                    {entry.note && <p className="text-xs text-text-secondary mt-0.5">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-semibold ${entry.type === 'income' ? 'text-green-500' : 'text-red-400'}`}>
                      {entry.type === 'income' ? '+' : '−'}{entry.amount.toLocaleString('ru-RU')}
                    </span>
                    <button onClick={() => removeEntry(entry.id)} className="text-text-muted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Форма добавления */}
        {showAdd ? (
          <div className="card flex flex-col gap-3">
            {/* Доход / Расход */}
            <div className="flex bg-icon-bg rounded-full p-1">
              {(['income', 'expense'] as FinanceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setCategory(t === 'income' ? 'salary' : 'food') }}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${type === t ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-text-muted)]'}`}
                >
                  {t === 'income' ? 'Доход' : 'Расход'}
                </button>
              ))}
            </div>

            {/* Сумма */}
            <input
              autoFocus
              type="number"
              placeholder="Введите сумму"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xl font-bold outline-none bg-transparent text-text-primary placeholder:text-text-muted"
              inputMode="decimal"
            />

            {/* Категории */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${category === c.id ? 'bg-[var(--color-accent)] text-white border-transparent' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Заметка */}
            <input
              type="text"
              placeholder="Комментарий (необязательно)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm outline-none bg-transparent text-text-primary placeholder:text-text-muted border-t border-border pt-2"
            />

            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-[var(--color-accent)] text-white rounded-full py-3 text-sm font-semibold">
                Подтвердить
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-full py-3 text-sm font-medium text-[var(--color-text-muted)]">
                Отменить
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="btn-add">
            + Записать операцию
          </button>
        )}
      </div>
    </div>
  )
}
