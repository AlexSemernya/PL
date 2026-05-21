/**
 * Friends — leaderboard rendered as a topographic mountain.
 *
 * Friend pct ∈ [0,1] maps to altitude (0 = base, 1 = summit). xJitter ∈ [-1,1]
 * spreads them horizontally so they don't pile up on the central spine.
 * The mountain itself is a stack of 28 noise-perturbed isolines (deterministic
 * via ridgeNoise so contours align across layers), with 5 highlighted ridges,
 * a compass base ring, and a dashed switchback trail.
 *
 * Data is still mocked — when the bot exposes /api/friends we'll swap FRIENDS
 * for a real fetch (same shape).
 */
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { CalendarHeader } from '../components/CalendarHeader'
import { Icon } from '../components/Icons'
import { TickRow } from '../components/Widgets'
import { haptic } from '../lib/haptic'
import { useFriends } from '../lib/useFriends'
import { api, type FriendDTO as Friend } from '../lib/botApi'

interface Props {
  selectedDate: string
  onDateChange: (d: string) => void
}

// ─── Mountain geometry ──────────────────────────────────────
const MTN_W = 362
const MTN_H = 280
const MTN_CX = MTN_W / 2
const SUMMIT_Y = 38
const BASE_Y = 230

// Multi-octave deterministic noise — fixed phase so ridges align across layers
function ridgeNoise(theta: number): number {
  return (
    Math.sin(theta * 2 + 0.8) * 0.11 +
    Math.sin(theta * 5 - 1.4) * 0.07 +
    Math.sin(theta * 9 + 2.1) * 0.04 +
    Math.sin(theta * 17 - 0.5) * 0.022 +
    Math.sin(theta * 23 + 1.7) * 0.014
  )
}

function mtnWidth(level: number): number {
  const baseHalfW = 154
  return baseHalfW * Math.pow(1 - level, 0.82)
}

function mountainPos(pct: number, xJitter: number): { x: number; y: number } {
  const y = BASE_Y - (BASE_Y - SUMMIT_Y) * pct
  const halfW = mtnWidth(pct)
  const x = MTN_CX + xJitter * halfW * 0.55
  return { x, y }
}

function topoContourPath(level: number): string {
  const y = BASE_Y - (BASE_Y - SUMMIT_Y) * level
  const halfW = mtnWidth(level)
  const halfH = halfW * 0.22 + 2

  const N = 84
  const pts: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2
    const damp = 0.55 + 0.45 * (1 - level)
    const r = 1 + ridgeNoise(theta) * damp
    const px = MTN_CX + Math.cos(theta) * halfW * r
    const py = y + Math.sin(theta) * halfH * r
    pts.push([px, py])
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`
  }
  return d + ' Z'
}

function ridgeLine(theta: number, fromLevel = 0, toLevel = 0.98): string {
  const pts: [number, number][] = []
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const level = fromLevel + (toLevel - fromLevel) * (i / steps)
    const y = BASE_Y - (BASE_Y - SUMMIT_Y) * level
    const halfW = mtnWidth(level)
    const halfH = halfW * 0.22 + 2
    const damp = 0.55 + 0.45 * (1 - level)
    const r = 1 + ridgeNoise(theta) * damp
    pts.push([MTN_CX + Math.cos(theta) * halfW * r, y + Math.sin(theta) * halfH * r])
  }
  return 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')
}

// ─── Mountain SVG ──────────────────────────────────────────
function MountainMap({ friends, focus, onFocus }: {
  friends: Friend[]
  focus: string
  onFocus: (id: string) => void
}) {
  const cx = MTN_CX

  // 28 contour levels, denser near base
  const N_CONTOURS = 28
  const contours: { level: number; path: string; idx: number }[] = []
  for (let i = 0; i < N_CONTOURS; i++) {
    const t = Math.pow(i / (N_CONTOURS - 1), 0.85)
    const level = 0.02 + t * 0.96
    contours.push({ level, path: topoContourPath(level), idx: i })
  }

  const ridges = [-Math.PI * 0.62, -Math.PI * 0.30, -Math.PI * 0.05, Math.PI * 0.22, Math.PI * 0.55]
    .map((theta) => ridgeLine(theta, 0.04, 0.94))

  // Trail — dotted from base to summit
  const trailLevels = [0.05, 0.18, 0.32, 0.46, 0.60, 0.74, 0.86, 0.97]
  const trailThetas = [-Math.PI*0.42, -Math.PI*0.55, -Math.PI*0.35, -Math.PI*0.48,
                       -Math.PI*0.32, -Math.PI*0.50, -Math.PI*0.40, -Math.PI*0.50]
  const trailPts: [number, number][] = trailLevels.map((lv, i) => {
    const y = BASE_Y - (BASE_Y - SUMMIT_Y) * lv
    const halfW = mtnWidth(lv)
    const halfH = halfW * 0.22 + 2
    const theta = trailThetas[i]
    const damp = 0.55 + 0.45 * (1 - lv)
    const r = 1 + ridgeNoise(theta) * damp
    return [cx + Math.cos(theta) * halfW * r, y + Math.sin(theta) * halfH * r]
  })
  const trailPath = trailPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${MTN_W} ${MTN_H}`} width="100%" preserveAspectRatio="xMidYMid meet"
         style={{ display: 'block' }} focusable="false" aria-hidden="true">
      <defs>
        <radialGradient id="mtnLight" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(198,248,78,0.10)" />
          <stop offset="55%" stopColor="rgba(198,248,78,0.02)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="mtnShadow" cx="75%" cy="70%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id="mtnMask">
          <path d={topoContourPath(0.01)} />
        </clipPath>
      </defs>

      <ellipse cx={cx} cy={150} rx={180} ry={140} fill="url(#mtnLight)" />

      <g>
        {contours.map((c) => {
          const isMajor = c.idx % 5 === 0
          const isTop = c.level > 0.85
          return (
            <path
              key={c.idx}
              d={c.path}
              fill="none"
              stroke={isTop ? 'rgba(198,248,78,0.55)' : (isMajor ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.13)')}
              strokeWidth={isTop ? 0.9 : (isMajor ? 0.7 : 0.4)}
            />
          )
        })}
      </g>

      <path d={topoContourPath(0.02)} fill="rgba(10,10,11,0.35)" opacity="0.5" />

      <g clipPath="url(#mtnMask)">
        <ellipse cx={cx + 80} cy={180} rx={140} ry={110} fill="url(#mtnShadow)" opacity="0.7" />
      </g>

      <g>
        {ridges.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.22)"
                strokeWidth={i === 2 ? 0.9 : 0.55} strokeLinecap="round" />
        ))}
      </g>

      {/* Compass base ring */}
      <ellipse cx={cx} cy={246} rx={166} ry={26} fill="none" stroke="url(#ringGrad)" strokeWidth="1.6" />
      <ellipse cx={cx} cy={246} rx={156} ry={22} fill="none" stroke="var(--cyan)" strokeWidth="0.5"
               opacity="0.5" strokeDasharray="2 3" />

      <g>
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2
          const rx = 166, ry = 26
          const x1 = cx + Math.cos(a) * rx
          const y1 = 246 + Math.sin(a) * ry
          const len = i % 4 === 0 ? 5 : 2.5
          const x2 = cx + Math.cos(a) * (rx + len)
          const y2 = 246 + Math.sin(a) * (ry + len * (ry / rx))
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                       stroke="var(--cyan)" strokeWidth="0.6" opacity={i % 4 === 0 ? 0.7 : 0.3} />
        })}
      </g>

      {[
        { l: 'S', x: cx, y: 282 },
        { l: 'W', x: cx - 184, y: 250 },
        { l: 'N', x: cx + 184, y: 250 },
      ].map((c) => (
        <text key={c.l} x={c.x} y={c.y} fill="var(--cyan)" fontSize="10"
              fontFamily="SF Mono, ui-monospace, monospace" fontWeight="700"
              textAnchor="middle" opacity="0.7" letterSpacing="0.1em">
          {c.l}
        </text>
      ))}

      <path d={trailPath} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.3"
            strokeDasharray="2 3" strokeLinecap="round" />

      {/* Summit flag */}
      <g transform={`translate(${cx + 1}, ${SUMMIT_Y - 4})`}>
        <line x1="0" y1="0" x2="0" y2="14" stroke="var(--accent)" strokeWidth="1.4" />
        <path d="M 0 0 L 10 3 L 0 6 Z" fill="var(--accent)" />
        <text y="-6" fill="var(--accent)" fontSize="8.5" textAnchor="middle"
              fontFamily="SF Mono, ui-monospace, monospace" fontWeight="700" letterSpacing="0.1em">
          СЕРИЯ
        </text>
      </g>

      {/* Base camp */}
      <g transform={`translate(${cx - 78}, ${236})`}>
        <circle r="10" fill="var(--panel-2)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
        <text y="3" fill="var(--text-dim)" fontSize="9" fontWeight="700" textAnchor="middle"
              fontFamily="SF Mono, ui-monospace, monospace">B</text>
      </g>

      {/* Friend pins — sorted so higher-on-mountain renders on top */}
      {[...friends].sort((a, b) => a.pct - b.pct).map((f) => {
        const { x, y } = mountainPos(f.pct, f.xJitter)
        const isFocus = focus === f.id
        return (
          <g key={f.id} onClick={() => { onFocus(f.id); haptic('select') }} style={{ cursor: 'pointer' }}>
            <line x1={x} y1={y + 2} x2={x} y2={y + 14}
                  stroke={f.color} strokeWidth="1.4" opacity="0.45" strokeDasharray="1 2" />
            <path d={`M ${x} ${y + 14} L ${x - 3.5} ${y + 7} L ${x + 3.5} ${y + 7} Z`}
                  fill={f.color} opacity="0.9" />
            {isFocus && <circle cx={x} cy={y - 5} r="19" fill={f.color} opacity="0.20" />}
            <circle cx={x} cy={y - 5} r={isFocus ? 14 : 12}
                    fill={f.color} stroke={f.you ? 'var(--accent)' : 'rgba(0,0,0,0.45)'}
                    strokeWidth={f.you ? 2 : 1.5} />
            <text x={x} y={y - 2} fill="#0a0a0b" fontSize="11" fontWeight="700"
                  textAnchor="middle" fontFamily="-apple-system, system-ui, sans-serif">
              {f.initial}
            </text>
            {isFocus && (
              <g transform={`translate(${x + 12}, ${y - 16})`}>
                <rect x="0" y="0" width="28" height="14" rx="7" fill="#0a0a0b" stroke={f.color} strokeWidth="1" />
                <text x="14" y="10" fill={f.color} fontSize="9" fontWeight="700"
                      textAnchor="middle" fontFamily="SF Mono, monospace">L{f.lvl}</text>
              </g>
            )}
          </g>
        )
      })}

      {/* Altitude markers */}
      {[
        { y: SUMMIT_Y,                                    l: '100%' },
        { y: BASE_Y - (BASE_Y - SUMMIT_Y) * 0.75,         l: '75%' },
        { y: BASE_Y - (BASE_Y - SUMMIT_Y) * 0.50,         l: '50%' },
        { y: BASE_Y - (BASE_Y - SUMMIT_Y) * 0.25,         l: '25%' },
      ].map((a) => (
        <g key={a.l} transform={`translate(0, ${a.y})`}>
          <text x="6" fill="var(--text-faint)" fontSize="8"
                fontFamily="SF Mono, ui-monospace, monospace" letterSpacing="0.04em">
            {a.l}
          </text>
          <line x1={28} y1="-3" x2={36} y2="-3" stroke="var(--line-2)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  )
}

// ─── Friend row in the list ────────────────────────────────
function FriendRow({ f, active, onClick }: { f: Friend; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lrow"
      style={{
        background: active ? 'var(--panel-2)' : 'var(--panel)',
        border: active ? '1px solid rgba(198,248,78,0.20)' : '1px solid transparent',
        textAlign: 'left',
      }}
    >
      <div className="avatar" style={{ background: f.color, color: '#0a0a0b', width: 38, height: 38, fontSize: 15 }}>
        {f.initial}
      </div>
      <div className="meta">
        <div className="w-row between">
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {f.name}
            {f.you && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>ты</span>}
          </span>
          <span className="num" style={{ fontSize: 11, fontWeight: 600, color: f.color }}>L{f.lvl}</span>
        </div>
        <div className="h-progress" style={{ height: 3, marginTop: 6, marginBottom: 6 }}>
          <span style={{ width: `${(f.xp / f.xpMax) * 100}%`, background: f.color }} />
        </div>
        <div className="w-row" style={{ gap: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon name="flame" size={10} color="var(--warn)" />{f.streak}
          </span>
          <span className="w-label" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="check" size={10} color="var(--text-faint)" />{f.habits}
          </span>
          <span className="w-label" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="target" size={10} color="var(--text-faint)" />{f.goals}
          </span>
          <span className="num" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)' }}>
            {f.xp.toLocaleString('ru-RU')} / {f.xpMax.toLocaleString('ru-RU')} XP
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: f.trend > 0 ? 'var(--good)' : f.trend < 0 ? 'var(--red)' : 'var(--text-faint)',
          }}>
            {f.trend > 0 ? '↑' : f.trend < 0 ? '↓' : '·'}{Math.abs(f.trend) || ''}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── Screen ─────────────────────────────────────────────────
async function shareInviteLink() {
  try {
    haptic('medium')
    const inv = await api.createInvite()
    const tg = window.Telegram?.WebApp as any
    // Prefer Telegram's native share sheet if available
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(inv.share_url)
    } else if (navigator.share) {
      await navigator.share({ url: inv.invite_link, text: 'Давай вместе в LifeOS' })
    } else {
      await navigator.clipboard.writeText(inv.invite_link)
      alert('Ссылка скопирована — отправь её другу в Telegram.')
    }
  } catch (e) {
    haptic('error')
    alert(`Не получилось создать приглашение: ${(e as Error).message}`)
  }
}

export function Friends({ selectedDate, onDateChange }: Props) {
  const { data: friends, loading, error, reload } = useFriends()
  const [focus, setFocus] = useState<string | null>(null)
  const [seg, setSeg] = useState<'Гора' | 'Лига'>('Гора')

  const list: Friend[] = friends ?? []
  const ranked = useMemo(() => [...list].sort((a, b) => b.pct - a.pct), [list])
  const me = list.find((f) => f.you) ?? list[0]
  const friendsCount = list.filter((f) => !f.you).length
  const myRank = ranked.findIndex((f) => f.you) + 1 || 1
  const focused = list.find((f) => f.id === focus) ?? me
  const monthLabel = dayjs(selectedDate).format('MMMM').toUpperCase()

  return (
    <>
      <CalendarHeader selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="scroll screen-enter">
        <div className="w-row between" style={{ padding: '4px 4px 14px' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Друзья</div>
            <div className="w-sub">
              {friendsCount > 0
                ? `${friendsCount} друзей · ты #${myRank} из ${list.length}`
                : 'У тебя пока нет друзей — пригласи первого'}
            </div>
          </div>
          <button className="fab" style={{ width: 'auto', padding: '10px 14px', borderRadius: 14 }}
                  onClick={shareInviteLink}>
            <Icon name="plus" size={14} color="#0a0a0b" stroke={2.6} />
          </button>
        </div>

        {loading && !friends && (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            Загружаю друзей…
          </div>
        )}
        {error && (
          <div className="widget" style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>
            Не получилось: {error}
            <button className="a" style={{ marginLeft: 8 }} onClick={() => reload()}>повторить</button>
          </div>
        )}

        {/* Mountain card */}
        <div className="widget" style={{ marginBottom: 8, padding: '14px 12px 12px' }}>
          <div className="w-head" style={{ paddingLeft: 4 }}>
            <div className="w-title accent">◆ ВОСХОЖДЕНИЕ · {monthLabel}</div>
            <div className="segmented">
              <button className={seg === 'Гора' ? 'on' : ''}
                      onClick={() => { setSeg('Гора'); haptic('select') }}>Гора</button>
              <button className={seg === 'Лига' ? 'on' : ''}
                      onClick={() => { setSeg('Лига'); haptic('select') }}>Лига</button>
            </div>
          </div>

          {seg === 'Гора' ? (
            <>
              <MountainMap friends={list} focus={focus ?? me?.id ?? ''} onFocus={setFocus} />
              {/* Tier hint: explains weighted XP so users understand the climb math */}
              <div style={{
                marginTop: 8, padding: '8px 10px', borderRadius: 10,
                background: 'var(--panel-2)',
                fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4,
              }}>
                Высота на горе = XP. Цели и привычки дают XP по сложности:
                <span style={{ color: '#6be99a', fontWeight: 600 }}> лёгкая</span>,
                <span style={{ color: '#c6f84e', fontWeight: 600 }}> обычная</span>,
                <span style={{ color: '#ff8a3d', fontWeight: 600 }}> сложная</span>,
                <span style={{ color: '#b59cff', fontWeight: 600 }}> эпическая</span>.
                Марафон ≠ поход в магазин.
              </div>
              {/* Focused friend bar */}
              {focused && (
                <div className="w-row" style={{
                  marginTop: 8, padding: '10px 12px',
                  background: 'var(--panel-2)', borderRadius: 14, gap: 12,
                }}>
                  <div className="avatar" style={{
                    background: focused.color, color: '#0a0a0b', width: 36, height: 36, fontSize: 14,
                  }}>{focused.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="w-row between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {focused.name}
                        {focused.you && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)' }}>· это ты</span>}
                      </span>
                      <span className="num" style={{ fontSize: 12, fontWeight: 600, color: focused.color }}>
                        L{focused.lvl} · {Math.round(focused.pct * 100)}%
                      </span>
                    </div>
                    <div className="h-progress" style={{ height: 4 }}>
                      <span style={{ width: `${focused.pct * 100}%`, background: focused.color }} />
                    </div>
                  </div>
                  <Icon name="arrow-r" size={16} color="var(--text-faint)" />
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '8px 4px 4px' }}>
              {ranked.map((f, i) => (
                <div key={f.id} className="w-row" style={{
                  padding: '10px 8px', gap: 12,
                  borderBottom: i < ranked.length - 1 ? '1px dashed var(--line)' : 'none',
                }}>
                  <span className="num" style={{ width: 22, fontSize: 13, fontWeight: 700,
                    color: i < 3 ? 'var(--accent)' : 'var(--text-faint)' }}>
                    {i === 0 ? '★' : `#${i + 1}`}
                  </span>
                  <div className="avatar" style={{ background: f.color, color: '#0a0a0b', width: 28, height: 28 }}>
                    {f.initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="w-row between">
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</span>
                      <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>
                        {f.xp.toLocaleString('ru-RU')} XP
                      </span>
                    </div>
                    <div className="w-row" style={{ gap: 6, marginTop: 2 }}>
                      <span className="w-label">L{f.lvl}</span>
                      <span className="w-label">·</span>
                      <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Icon name="flame" size={9} color="var(--warn)" />{f.streak}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                        color: f.trend > 0 ? 'var(--good)' : f.trend < 0 ? 'var(--red)' : 'var(--text-faint)' }}>
                        {f.trend > 0 ? '↑' : f.trend < 0 ? '↓' : '·'} {Math.abs(f.trend) || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KPI 2-up */}
        <div className="w-grid c2">
          <div className="widget tight">
            <div className="w-title accent">◆ ТВОЙ РАНГ</div>
            <div className="w-row baseline" style={{ gap: 4, marginTop: 8, marginBottom: 6 }}>
              <span className="w-big">{myRank}</span>
              <span className="w-unit">/ {list.length || 1}</span>
            </div>
            <div className="w-label">
              {me ? `XP: ${me.xp.toLocaleString('ru-RU')}` : '—'}
            </div>
            <div className="h-progress" style={{ height: 4, marginTop: 10 }}>
              <span style={{ width: `${me ? me.pct * 100 : 0}%` }} />
            </div>
          </div>
          <div className="widget tight">
            <div className="w-title cyan">
              <Icon name="star" size={11} color="var(--cyan)" /> ДО L{(me?.lvl ?? 0) + 1}
            </div>
            <div className="w-row baseline" style={{ gap: 4, marginTop: 8, marginBottom: 6 }}>
              <span className="w-big">{me ? Math.max(0, me.xpMax - me.xp) : 0}</span>
              <span className="w-unit">XP</span>
            </div>
            <div className="w-label">Чтобы получить новый уровень</div>
            <TickRow values={[200, 320, 180, 260, 340, 200, 290]} color="var(--accent)" height={20} />
          </div>
        </div>

        {/* Invite CTA card — friends are private now, no Discover.
            Reward for inviting: +3 days of free access per new friend (cap 30d). */}
        <div
          onClick={shareInviteLink}
          style={{
            marginTop: 4, marginBottom: 8,
            padding: 14, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(198,248,78,0.15), rgba(76,214,255,0.10))',
            border: '1px solid rgba(198,248,78,0.35)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--accent)', color: '#0a0a0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="users" size={20} color="#0a0a0b" stroke={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              Пригласи друга — +3 дня бесплатно
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.35 }}>
              За каждого, кто перейдёт по твоей ссылке (до 30 дней)
            </div>
          </div>
          <Icon name="arrow-r" size={18} color="var(--accent)" />
        </div>

        {/* List */}
        <div className="sec-h">
          <span className="t">Все друзья</span>
          <button className="a" onClick={shareInviteLink}>пригласить →</button>
        </div>

        {ranked.length === 0 && !loading ? (
          <div className="widget" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 24 }}>
            Пока никого нет.
            <div style={{ marginTop: 6, fontSize: 12 }}>
              Пригласи друга — увидите прогресс друг друга на горе.
              <br />Никто другой не увидит твой профиль.
            </div>
          </div>
        ) : (
          ranked.map((f) => (
            <FriendRow key={f.id} f={f} active={f.id === (focus ?? me?.id)} onClick={() => { setFocus(f.id); haptic('select') }} />
          ))
        )}

        <button className="fab ghost" style={{ marginTop: 14 }} onClick={shareInviteLink}>
          <Icon name="plus" size={14} /> Пригласить друга
        </button>
      </div>
    </>
  )
}
