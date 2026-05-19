import type { TabId } from '../types'
import { Icon } from './Icons'
import type { IconName } from './Icons'
import { haptic } from '../lib/haptic'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'habits', label: 'Привычки', icon: 'check' },
  { id: 'goals', label: 'Цели', icon: 'target' },
  { id: 'finance', label: 'Финансы', icon: 'wallet' },
  { id: 'diary', label: 'Дневник', icon: 'book2' },
  { id: 'friends', label: 'Друзья', icon: 'users' },
]

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="tabbar">
      <div className="tabbar-inner">
        {TABS.map((t) => {
          const on = active === t.id
          return (
            <button
              key={t.id}
              className={`tab ${on ? 'on' : ''}`}
              onClick={() => {
                if (on) return
                onChange(t.id)
                haptic('select')
              }}
            >
              <Icon
                name={t.icon}
                size={22}
                color={on ? 'var(--accent)' : 'var(--text-faint)'}
                stroke={on ? 2.2 : 1.8}
              />
              <span style={{ marginTop: 4 }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
