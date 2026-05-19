import { useEffect, useState } from 'react'
import 'dayjs/locale/ru'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { Icon } from './components/Icons'
import { TabBar } from './components/TabBar'
import { StorageIndicator } from './components/StorageIndicator'
import { Paywall } from './components/Paywall'
import { PremiumSheet } from './components/PremiumSheet'
import { RemindersSheet } from './components/RemindersSheet'
import { Home } from './pages/Home'
import { Habits } from './pages/Habits'
import { Goals } from './pages/Goals'
import { Finance } from './pages/Finance'
import { Diary } from './pages/Diary'
import { Friends } from './pages/Friends'
import { useUser } from './lib/useUser'
import type { TabId } from './types'

dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)
dayjs.locale('ru')

export default function App() {
  const [tab, setTab] = useState<TabId>('home')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showPremium, setShowPremium] = useState(false)
  const [showReminders, setShowReminders] = useState(false)

  // Listen for in-app events triggered from CalendarHeader bell/avatar.
  useEffect(() => {
    const onOpenPremium = () => setShowPremium(true)
    const onOpenReminders = () => setShowReminders(true)
    window.addEventListener('lifeos-open-premium', onOpenPremium)
    window.addEventListener('lifeos-open-reminders', onOpenReminders)
    return () => {
      window.removeEventListener('lifeos-open-premium', onOpenPremium)
      window.removeEventListener('lifeos-open-reminders', onOpenReminders)
    }
  }, [])

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
      console.warn('Telegram WebApp init failed', e)
    }
  }, [])

  // ─── Boot diagnostics ───
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    console.log('[LifeOS] boot', {
      telegram: !!tg,
      cloudStorage: !!tg?.CloudStorage,
      version: (tg as any)?.version,
      platform: (tg as any)?.platform,
    })
  }, [])

  const { data: userData } = useUser()
  const pageProps = { selectedDate, onDateChange: setSelectedDate }
  const showPaywall = !!userData && !userData.user.has_access

  return (
    <div className="planner-app">
      {tab === 'home' && <Home {...pageProps} onJumpTab={setTab} />}
      {tab === 'habits' && <Habits {...pageProps} />}
      {tab === 'goals' && <Goals {...pageProps} />}
      {tab === 'finance' && <Finance {...pageProps} />}
      {tab === 'diary' && <Diary {...pageProps} />}
      {tab === 'friends' && <Friends {...pageProps} />}
      <TabBar active={tab} onChange={setTab} />
      <StorageIndicator />

      {/* Modal sheets — premium / reminders / paywall */}
      <PremiumSheet open={showPremium} onClose={() => setShowPremium(false)} />
      <RemindersSheet open={showReminders} onClose={() => setShowReminders(false)} />
      {showPaywall && <Paywall />}
    </div>
  )
}

export { Icon } // re-export so tree-shaking keeps it in initial chunk
