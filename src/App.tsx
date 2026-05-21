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
import { HelpSheet } from './components/HelpSheet'
import { Home } from './pages/Home'
import { Habits } from './pages/Habits'
import { Goals } from './pages/Goals'
import { Finance } from './pages/Finance'
import { Diary } from './pages/Diary'
import { Friends } from './pages/Friends'
import { useUser } from './lib/useUser'
import { api } from './lib/botApi'
import { computeStatsSnapshot } from './lib/computeStats'
import { consumeStartParam } from './lib/startParam'
import { useHabitsStore } from './store/habitsStore'
import { useGoalsStore } from './store/goalsStore'
import { useDiaryStore } from './store/diaryStore'
import type { TabId } from './types'

dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)
dayjs.locale('ru')

export default function App() {
  const [tab, setTab] = useState<TabId>('home')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showPremium, setShowPremium] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Listen for in-app events triggered from CalendarHeader bell/avatar etc.
  useEffect(() => {
    const onOpenPremium = () => setShowPremium(true)
    const onOpenReminders = () => setShowReminders(true)
    const onOpenHelp = () => setShowHelp(true)
    window.addEventListener('lifeos-open-premium', onOpenPremium)
    window.addEventListener('lifeos-open-reminders', onOpenReminders)
    window.addEventListener('lifeos-open-help', onOpenHelp)
    return () => {
      window.removeEventListener('lifeos-open-premium', onOpenPremium)
      window.removeEventListener('lifeos-open-reminders', onOpenReminders)
      window.removeEventListener('lifeos-open-help', onOpenHelp)
    }
  }, [])

  // ─── Handle inline-deep-link from bot (`?startapp=ch_<b64>` / `cg_...`) ───
  // The bot encodes a "create habit X" or "create goal X" intent in start_param.
  // We switch to the right tab and emit an event that the page picks up to
  // open its create sheet with title prefilled. Fired once on first render.
  useEffect(() => {
    const intent = consumeStartParam()
    if (!intent) return
    const eventName =
      intent.kind === 'create_habit' ? 'lifeos-create-habit'
      : 'lifeos-create-goal'
    // Switch tab BEFORE dispatching so the listener on the destination page
    // is already mounted when the event fires.
    setTab(intent.kind === 'create_habit' ? 'habits' : 'goals')
    // Defer one frame so the page mounts and registers its listener.
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(eventName, { detail: { title: intent.title } }))
    })
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

  // ─── Push stats snapshot to the bot so friends see fresh numbers.
  //     Debounced — fires 1s after the last store change. Also fires on boot.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        api.pushStats(computeStatsSnapshot()).catch(() => { /* silent */ })
      }, 1000)
    }
    // initial push
    schedule()
    // subscribe to store changes
    const unsubs = [
      useHabitsStore.subscribe(schedule),
      useGoalsStore.subscribe(schedule),
      useDiaryStore.subscribe(schedule),
    ]
    return () => {
      if (timer) clearTimeout(timer)
      unsubs.forEach((u) => u())
    }
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
      <HelpSheet open={showHelp} onClose={() => setShowHelp(false)} />
      {showPaywall && <Paywall />}
    </div>
  )
}

export { Icon } // re-export so tree-shaking keeps it in initial chunk
