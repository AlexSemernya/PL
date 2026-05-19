import { useEffect, useState } from 'react'
import 'dayjs/locale/ru'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { Icon } from './components/Icons'
import { TabBar } from './components/TabBar'
import { StorageIndicator } from './components/StorageIndicator'
import { Home } from './pages/Home'
import { Habits } from './pages/Habits'
import { Goals } from './pages/Goals'
import { Finance } from './pages/Finance'
import { Diary } from './pages/Diary'
// Migrations module is intentionally not imported — see migrations.ts comments.
import type { TabId } from './types'

dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)
dayjs.locale('ru')

export default function App() {
  const [tab, setTab] = useState<TabId>('home')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  // ─── Telegram WebApp init + viewport sync ───
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return
    try {
      tg.ready()
      tg.expand()
      tg.requestFullscreen?.()
      tg.setHeaderColor('#0a0a0b')
      tg.setBackgroundColor('#0a0a0b')
      tg.setBottomBarColor?.('#0a0a0b')
      tg.disableVerticalSwipes?.()

      const syncVH = () => {
        const h = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight
        document.documentElement.style.setProperty('--tg-vh', `${h}px`)
      }
      syncVH()
      tg.onEvent?.('viewportChanged', syncVH)
      window.addEventListener('resize', syncVH)
      return () => window.removeEventListener('resize', syncVH)
    } catch (e) {
      // graceful no-op outside Telegram
      console.warn('Telegram WebApp init failed', e)
    }
  }, [])

  // ─── Debug: log storage availability on boot (visible in Telegram dev tools) ───
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    console.log('[LifeOS] boot', {
      telegram: !!tg,
      cloudStorage: !!tg?.CloudStorage,
      version: (tg as any)?.version,
      platform: (tg as any)?.platform,
    })
  }, [])

  const pageProps = { selectedDate, onDateChange: setSelectedDate }

  return (
    <div className="planner-app">
      {tab === 'home' && <Home {...pageProps} onJumpTab={setTab} />}
      {tab === 'habits' && <Habits {...pageProps} />}
      {tab === 'goals' && <Goals {...pageProps} />}
      {tab === 'finance' && <Finance {...pageProps} />}
      {tab === 'diary' && <Diary {...pageProps} />}
      <TabBar active={tab} onChange={setTab} />
      <StorageIndicator />
    </div>
  )
}

export { Icon } // re-export so tree-shaking keeps it in initial chunk
