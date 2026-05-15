// @ts-nocheck
import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import CalendarHeader from '../components/CalendarHeader'
import { useHabitsStore } from '../store/habitsStore'

dayjs.locale('ru')

function AddHabitModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const emojis = ['✅','🏃','📚','💧','🧘','💪','🥗','😴','🎯','✍️']
  return (
    <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'flex-end'}} onClick={onClose}>
      <div style={{width:'100%',background:'var(--color-card)',borderRadius:'20px 20px 0 0',padding:'20px 16px 40px'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,borderRadius:2,background:'var(--color-border)',margin:'0 auto 20px'}}/>
        <div style={{fontSize:17,fontWeight:700,color:'var(--color-text)',marginBottom:20}}>Новая привычка</div>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {emojis.map(e=>(
            <button key={e} onClick={()=>setEmoji(e)} style={{width:40,height:40,borderRadius:10,border:'none',background:emoji===e?'var(--color-accent)':'var(--color-background)',fontSize:20,cursor:'pointer'}}>{e}</button>
          ))}
        </div>
        <input autoFocus placeholder="Название привычки…" value={name} onChange={e=>setName(e.target.value)}
          style={{width:'100%',padding:'14px 16px',borderRadius:14,border:'1.5px solid var(--color-border)',background:'var(--color-background)',color:'var(--color-text)',fontSize:15,outline:'none',boxSizing:'border-box',marginBottom:16}}/>
        <button disabled={!name.trim()} onClick={()=>{if(name.trim()){onAdd(name.trim(),emoji);onClose()}}}
          style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:name.trim()?'var(--color-accent)':'var(--color-border)',color:name.trim()?'#fff':'var(--color-text-muted)',fontSize:15,fontWeight:600,cursor:name.trim()?'pointer':'default'}}>
          Добавить
        </button>
      </div>
    </div>
  )
}

function HabitItem({ habit, date, onToggle }) {
  const done = habit.completions?.includes(date)
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid var(--color-border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:22}}>{habit.emoji||'✅'}</span>
        <div>
          <div style={{fontSize:15,fontWeight:500,color:'var(--color-text)'}}>{habit.name}</div>
          {habit.streak>0&&<div style={{fontSize:12,color:'var(--color-text-muted)',marginTop:2}}>🔥 {habit.streak} дней подряд</div>}
        </div>
      </div>
      <button onClick={onToggle} style={{width:28,height:28,borderRadius:8,border:done?'none':'2px solid var(--color-border)',background:done?'var(--color-accent)':'var(--color-background)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {done&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </button>
    </div>
  )
}

function HabitsAchievementChart({ habits }) {
  const data = [
    {month:'Сент.',value:2},{month:'Окт.',value:3},{month:'Нояб.',value:3},
    {month:'Дек.',value:5},{month:'Янв.',value:3}
  ]
  return (
    <div style={{background:'var(--color-card)',borderRadius:18,padding:'16px 8px 8px 0',marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:500,color:'var(--color-text-muted)',marginLeft:16,marginBottom:12}}>Достижение цели по привычкам</div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{top:4,right:16,left:0,bottom:0}}>
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false}/>
          <XAxis dataKey="month" tick={{fontSize:9,fill:'var(--color-text-muted)'}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:9,fill:'var(--color-text-muted)'}} axisLine={false} tickLine={false} domain={[0,10]} width={18}/>
          <Tooltip contentStyle={{background:'var(--color-card)',border:'none',borderRadius:10,fontSize:12}} labelStyle={{color:'var(--color-text-muted)'}} itemStyle={{color:'var(--color-accent)'}}/>
          <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} fill="url(#hg)" dot={false} activeDot={{r:4,fill:'var(--color-accent)'}}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Habits({ selectedDate, onDateChange } = {}) {
  const [showModal, setShowModal] = useState(false)
  const habits = useHabitsStore(s => s.habits)
  const addHabit = useHabitsStore(s => s.addHabit)
  const toggleHabit = useHabitsStore(s => s.toggleCompletion)
  const today = selectedDate || dayjs().format('YYYY-MM-DD')
  return (
    <div className="animate-slide-up">
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange}/>
      <div className="page-scroll px-3 pt-3 pb-4">
        <div style={{background:'var(--color-card)',borderRadius:18,marginBottom:10,overflow:'hidden',minHeight:habits.length===0?120:undefined}}>
          {habits.length===0
            ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,color:'var(--color-text-muted)',fontSize:14}}>Привычек нет</div>
            :habits.map(h=><HabitItem key={h.id} habit={h} date={today} onToggle={()=>toggleHabit(h.id,today)}/>)
          }
        </div>
        <button onClick={()=>setShowModal(true)} style={{width:'100%',background:'var(--color-card)',borderRadius:18,border:'none',padding:'14px',marginBottom:10,fontSize:15,color:'var(--color-text-muted)',cursor:'pointer',textAlign:'center'}}>
          + Добавить привычку
        </button>
        <HabitsAchievementChart habits={habits}/>
      </div>
      {showModal&&<AddHabitModal onClose={()=>setShowModal(false)} onAdd={(n,e)=>addHabit({name:n,emoji:e})}/>}
    </div>
  )
}
