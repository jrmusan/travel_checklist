import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTeamState, saveTeamState } from '../api/client'
import type { TeamInfo } from '../api/client'
import {
  extractServerSlice,
  mergeLegacyLocalIfNeeded,
  mergeServerIntoPersisted,
  serverStateIsEmpty,
} from '../store/server-sync'
import { createInitialState } from '../store/persistence'
import type { PersistedState } from '../types'

const SAVE_DEBOUNCE_MS = 400

export type PersistOptions = { flush?: boolean }

export function useTeamPersistedState(team: TeamInfo | null): [
  PersistedState,
  (updater: (prev: PersistedState) => PersistedState, options?: PersistOptions) => void,
  boolean,
  string | null,
  () => void,
] {
  const [state, setState] = useState<PersistedState>(() => createInitialState())
  const [hydrated, setHydrated] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)
  const teamRef = useRef(team)
  const hydratedRef = useRef(hydrated)
  const savingRef = useRef(false)
  const queuedRef = useRef(false)
  const queuedKeepaliveRef = useRef(false)

  useEffect(() => {
    stateRef.current = state
    teamRef.current = team
    hydratedRef.current = hydrated
  })

  const persist = useCallback((opts?: { keepalive?: boolean }) => {
    const run = (nextOpts?: { keepalive?: boolean }) => {
      if (!teamRef.current || !hydratedRef.current) return
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (savingRef.current) {
        queuedRef.current = true
        queuedKeepaliveRef.current = queuedKeepaliveRef.current || Boolean(nextOpts?.keepalive)
        return
      }
      savingRef.current = true
      const keepalive = Boolean(nextOpts?.keepalive)
      const slice = extractServerSlice(stateRef.current)
      void saveTeamState(slice, { keepalive })
        .catch((err) => {
          if (keepalive) return
          setSyncError(err instanceof Error ? err.message : 'Could not save changes')
        })
        .finally(() => {
          savingRef.current = false
          if (queuedRef.current) {
            queuedRef.current = false
            const nextKeepalive = queuedKeepaliveRef.current
            queuedKeepaliveRef.current = false
            run({ keepalive: nextKeepalive })
          }
        })
    }
    run(opts)
  }, [])

  useEffect(() => {
    if (!team) {
      setHydrated(false)
      return
    }

    let cancelled = false
    setHydrated(false)
    setSyncError(null)

    ;(async () => {
      try {
        const server = await fetchTeamState()
        const merged = mergeLegacyLocalIfNeeded(server)
        if (serverStateIsEmpty(server) && !serverStateIsEmpty(merged)) {
          await saveTeamState(merged)
        }
        if (cancelled) return
        const next = mergeServerIntoPersisted(merged)
        stateRef.current = next
        setState(next)
      } catch (err) {
        if (!cancelled) {
          setSyncError(err instanceof Error ? err.message : 'Could not load team data')
          setState(createInitialState())
        }
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [team?.id])

  useEffect(() => {
    if (!team || !hydrated) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(), SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, team, hydrated, persist])

  useEffect(() => {
    if (!team || !hydrated) return

    const flushHidden = () => persist({ keepalive: true })
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushHidden()
    }
    window.addEventListener('pagehide', flushHidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flushHidden)
      document.removeEventListener('visibilitychange', onVisibility)
      persist({ keepalive: true })
    }
  }, [team?.id, hydrated, persist])

  const update = useCallback(
    (updater: (prev: PersistedState) => PersistedState, options?: PersistOptions) => {
      setState((prev) => {
        const next = updater(prev)
        stateRef.current = next
        return next
      })
      if (options?.flush) persist()
    },
    [persist],
  )

  return [state, update, hydrated, syncError, persist]
}
