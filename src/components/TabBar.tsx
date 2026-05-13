import { TabId } from '../types'

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    id: 'habits',
    label: 'Привычки',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--color-accent)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    id: 'goals',
    label: 'Цели',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--color-accent)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'home',
    label: 'Главная',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'var(--color-accent)' : 'none'} stroke={a ? 'var(--color-accent)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" stroke={a ? 'var(--color-bg)' : 'var(--color-text-muted)'} />
      </svg>
    ),
  },
  {
    id: 'finance',
    label: 'Финансы',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--color-accent)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    id: 'diary',
    label: 'Дневник',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--color-accent)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
]

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around z-50" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(56px + env(safe-area-inset-bottom))' }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-14 transition-transform active:scale-90"
          >
            {tab.icon(isActive)}
            <span
              className="text-[10px] font-medium leading-none mt-0.5"
              style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
