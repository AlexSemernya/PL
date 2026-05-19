/**
 * Hook returning the user's friend list (incl. me) from the bot, with a
 * loading/error state.
 *
 * Refreshes on tab focus and exposes `reload()` for the invite flow to call
 * after a new friend joins. Lightweight — no global cache, the page-level
 * component owns the fetch.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, BotApiError, type FriendDTO } from './botApi'

interface State {
  data: FriendDTO[] | null
  loading: boolean
  error: string | null
}

export function useFriends() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await api.getFriends()
      if (!mounted.current) return
      setState({ data: res.friends, loading: false, error: null })
    } catch (e) {
      if (!mounted.current) return
      const msg = e instanceof BotApiError ? e.message : (e as Error)?.message || 'network error'
      setState({ data: null, loading: false, error: msg })
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void load()
    return () => { mounted.current = false }
  }, [load])

  return { ...state, reload: load }
}
