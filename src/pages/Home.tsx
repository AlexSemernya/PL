// @ts-nocheck
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { CalendarHeader } from '../components/CalendarHeader'
import ActivityRings from '../components/ActivityRings'
import GoalsCard from '../components/GoalsCard'
import HabitHeatmap from '../components/HabitHeatmap'
import SpendingWaveform from '../components/SpendingWaveform'

dayjs.locale('ru')

export default function Home() {
  return (
    <div className="animate-slide-up">
      <CalendarHeader />
      <div className="page-scroll px-3 pt-3 pb-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <ActivityRings />
          <GoalsCard />
        </div>
        <HabitHeatmap />
        <SpendingWaveform />
      </div>
    </div>
  )
}
