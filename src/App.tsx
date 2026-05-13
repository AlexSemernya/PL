import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/ru'

import TabBar from './components/TabBar'
import Home from './pages/Home'
import Habits from './pages/Habits'
import Goals from './pages/Goals'
import Finance from './pages/Finance'
import Diary from './pages/Diary'
import { TabId } from './types'

dayjs.extend(isoWeek)
dayjs.locale('ru')

// Инициализация Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        HapticFeedback: { impactOccurred: (style: string) => void }
        initDataUnsafe?: { user?: { id: number; first_name: string } }
      }
    }
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  tg.setBackgroundColor(isDark ? '#111118' : '#F0F0F5')
  tg.setHeaderColor(isDark ? '#111118' : '#F0F0F5')
      tg.setHeaderColor('#F0F0F5')
    }
  }, [])

  const handleTabChange = (tab: TabId) => {
    // Тактильный отклик при смене вкладки
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
    setActiveTab(tab)
  }

  const pageProps = { selectedDate, onDateChange: setSelectedDate }

  return (
    <div className="relative h-full w-full bg-bg overflow-hidden">
      {/* Контент */}
      <div className="h-full">
        {activeTab === 'home'    && <Home    {...pageProps} />}
        {activeTab === 'habits'  && <Habits  {...pageProps} />}
        {activeTab === 'goals'   && <Goals   {...pageProps} />}
        {activeTab === 'finance' && <Finance {...pageProps} />}
        {activeTab === 'diary'   && <Diary   {...pageProps} />}
      </div>

      {/* Таб-бар */}
      <TabBar active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
