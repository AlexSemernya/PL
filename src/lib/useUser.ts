/**
 * Singleton-style hook returning {profile, loading, error, reload} for the
 * current user. Fetched once on app boot via `/api/me`, refreshable after
 * a payment.
 */
import { useEffect, useState, useCallback } from 'react'
import { api, type MeResponse } from './botApi'

let cached: MeResponse | null = null
let inflight: Promise<MeResponse> | null = null
const listeners = new Set<(v: MeResponse | null) => void>()

function broadcast(v: MeResponse | null) {
  cached = v
  listeners.forEach((fn) => fn(v))
}

async function load(force = false): Promise<MeResponse | null> {
  if (cached && !force) return cached
  if (inflight) return inflight
  inflight = api.me()
  try {
    const v = await inflight
    broadcast(v)
    return v
  } catch {
    broadcast(null)
    return null
  } finally {
    inflight = null
  }
}

export function useUser() {
  const [data, setData] = useState<MeResponse | null>(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    const listener = (v: MeResponse | null) => {
      setData(v)
      setLoading(false)
    }
    listeners.add(listener)
    if (!cached) {
      setLoading(true)
      load().finally(() => setLoading(false))
    }
    return () => { listeners.delete(listener) }
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    return load(true).finally(() => setLoading(false))
  }, [])

  return { data, loading, reload }
}

/** Force the next useUser() consumer to refetch — call after a successful payment. */
export function invalidateUser() { void load(true) }
