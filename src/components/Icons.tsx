type IconProps = {
  name: IconName
  size?: number
  color?: string
  stroke?: number
}

export type IconName =
  | 'home' | 'check' | 'target' | 'wallet' | 'book' | 'plus'
  | 'chev-l' | 'chev-r' | 'flame' | 'drop' | 'moon' | 'book2'
  | 'run' | 'bell' | 'edit' | 'mic' | 'arrow-r' | 'arrow-u' | 'arrow-d'
  | 'dots' | 'star' | 'coffee' | 'mood' | 'food' | 'bag' | 'card'
  | 'gift' | 'film' | 'note' | 'shoe' | 'x' | 'trash' | 'users'

export function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8 }: IconProps) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'home':    return <svg {...p}><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"/></svg>
    case 'check':   return <svg {...p}><path d="M9 11l3 3 7-7M5 19h14"/></svg>
    case 'target':  return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/></svg>
    case 'wallet':  return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M17 15h2"/></svg>
    case 'book':    return <svg {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 0 3 3"/></svg>
    case 'plus':    return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>
    case 'chev-l':  return <svg {...p}><path d="M15 18l-6-6 6-6"/></svg>
    case 'chev-r':  return <svg {...p}><path d="M9 18l6-6-6-6"/></svg>
    case 'flame':   return <svg {...p}><path d="M12 3s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s0 2 2 2-1-5 1-8z"/></svg>
    case 'drop':    return <svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>
    case 'moon':    return <svg {...p}><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/></svg>
    case 'book2':   return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5z"/><path d="M8 7h7M8 11h7M8 15h5"/></svg>
    case 'run':     return <svg {...p}><circle cx="13" cy="4.5" r="1.6"/><path d="M9 21l3-5 3 1.5 2-5"/><path d="M12 16l-2.5-2.5 3-5 3.5 2 2.5-1"/><path d="M7.5 11l3-1"/></svg>
    case 'bell':    return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8zM10 21a2 2 0 0 0 4 0"/></svg>
    case 'edit':    return <svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
    case 'mic':     return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
    case 'arrow-r': return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    case 'arrow-u': return <svg {...p}><path d="M7 14l5-5 5 5"/></svg>
    case 'arrow-d': return <svg {...p}><path d="M7 10l5 5 5-5"/></svg>
    case 'dots':    return <svg {...p}><circle cx="6" cy="12" r="1.6" fill={color}/><circle cx="12" cy="12" r="1.6" fill={color}/><circle cx="18" cy="12" r="1.6" fill={color}/></svg>
    case 'star':    return <svg {...p}><path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5 9.5 9z"/></svg>
    case 'coffee':  return <svg {...p}><path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zM17 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2M15 3v2"/></svg>
    case 'mood':    return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01"/></svg>
    case 'food':    return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a9 9 0 0 1 0 18M12 3a9 9 0 0 0 0 18"/></svg>
    case 'bag':     return <svg {...p}><path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2"/></svg>
    case 'card':    return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
    case 'gift':    return <svg {...p}><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M12 8s-3-5-5-3 1 3 5 3zM12 8s3-5 5-3-1 3-5 3z"/></svg>
    case 'film':    return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>
    case 'note':    return <svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>
    case 'shoe':    return <svg {...p}><path d="M3 18l1-3 3-1 2-4 4 1 1 3 6 2v3H3z"/></svg>
    case 'x':       return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>
    case 'trash':   return <svg {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
    case 'users':   return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    default: return null
  }
}
