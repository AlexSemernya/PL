import { useState } from 'react'
import { useDiaryStore } from '../store/diaryStore'
import CalendarHeader from '../components/CalendarHeader'
import { MoodLevel } from '../types'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

interface DiaryProps {
  selectedDate: string
  onDateChange: (d: string) => void
}

const MOODS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: '😔', label: 'Плохо' },
  { level: 2, emoji: '😕', label: 'Так себе' },
  { level: 3, emoji: '😐', label: 'Нормально' },
  { level: 4, emoji: '🙂', label: 'Хорошо' },
  { level: 5, emoji: '😊', label: 'Отлично' },
]

export default function Diary({ selectedDate, onDateChange }: DiaryProps) {
  const { entries, addEntry, updateEntry, getByDate, getRecentEntries } = useDiaryStore()
  const existing = getByDate(selectedDate)
  const recent = getRecentEntries(5)

  const [mood, setMood] = useState<MoodLevel>(existing?.mood ?? 3)
  const [moodNote, setMoodNote] = useState(existing?.moodNote ?? '')
  const [text, setText] = useState(existing?.text ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (existing) {
      updateEntry(existing.id, { mood, moodNote, text })
    } else {
      addEntry({ date: selectedDate, mood, moodNote, text })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const moodObj = MOODS.find((m) => m.level === mood)

  return (
    <div className="animate-slide-up">
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="page-scroll px-4 pt-4 pb-4">
        {/* Запись за день */}
        <div className="card mb-3">
          <p className="text-sm text-text-secondary font-medium mb-3">
            Хочешь зафиксировать сегодняшний день?
          </p>

          {/* Настроение */}
          <div className="flex justify-between mb-3">
            {MOODS.map((m) => (
              <button
                key={m.level}
                onClick={() => setMood(m.level)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                  mood === m.level ? 'bg-accent-light' : ''
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className={`text-[10px] font-medium ${mood === m.level ? 'text-accent' : 'text-text-muted'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Почему такое настроение */}
          <p className="text-xs text-text-secondary mb-2">Почему настроение именно такое?</p>
          <input
            type="text"
            placeholder="Напиши причину..."
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            className="w-full text-sm outline-none bg-gray-50 rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted mb-3"
          />

          {/* Текст дня */}
          <textarea
            placeholder="Запись дня (необязательно)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full text-sm outline-none bg-gray-50 rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted resize-none mb-3"
          />

          <button
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              saved ? 'bg-green-100 text-green-600' : 'bg-accent text-white'
            }`}
          >
            {saved ? '✓ Сохранено!' : 'Сохранить'}
          </button>
        </div>

        {/* История записей */}
        {recent.length > 0 && (
          <div>
            <p className="text-xs text-text-secondary font-semibold mb-2 px-1">История</p>
            <div className="flex flex-col gap-2">
              {recent.map((entry) => {
                const m = MOODS.find((x) => x.level === entry.mood)
                return (
                  <div key={entry.id} className="card flex items-start gap-3 py-3">
                    <span className="text-2xl mt-0.5">{m?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary font-medium">
                          {dayjs(entry.date).format('D MMM')}
                        </span>
                        <span className="text-xs text-accent font-medium">{m?.label}</span>
                      </div>
                      {entry.moodNote && (
                        <p className="text-sm text-text-primary mt-0.5 truncate">{entry.moodNote}</p>
                      )}
                      {entry.text && (
                        <p className="text-xs text-text-secondary mt-0.5 truncate">{entry.text}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
