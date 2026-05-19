type Kind = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'select' | 'success' | 'warning' | 'error'

export function haptic(kind: Kind = 'light') {
  try {
    const h = window.Telegram?.WebApp?.HapticFeedback
    if (!h) return
    if (kind === 'select') h.selectionChanged()
    else if (kind === 'success' || kind === 'warning' || kind === 'error') h.notificationOccurred(kind)
    else h.impactOccurred(kind)
  } catch {
    /* noop */
  }
}
