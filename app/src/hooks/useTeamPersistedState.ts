import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTeamState, saveTeamState } from '../api/client'
import type { TeamInfo } from '../api/client'
import {
  applyRemoteToLocal,
  extractServerSlice,
  mergeLegacyLocalIfNeeded,
  mergeServerIntoPersisted,
  serverStateIsEmpty,
} from '../store/server-sync'
import { createInitialState } from '../store/persistence'
import type { PersistedState } from '../types'

const SAVE_DEBOUNCE_MS = 400
const POLL_MS = 18_000

export type PersistOptions = { flush?: boolean }

export function useTeamPersistedState(team: TeamInfo | null): [
  PersistedState,
  (updater: (prev: PersistedState) => PersistedState, options?: PersistOptions) => void,
  boolean,
  string | null,
  () => void,
  () => Promise<void>,
  boolean,
] {
  const [state, setState] = useState<PersistedState>(() => createInitialState())
  const [hydrated, setHydrated] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  const teamRef = useRef(team)
  const hydratedRef = useRef(hydrated)
  const savingRef = useRef(false)
  const queuedRef = useRef(false)
  const queuedKeepaliveRef = useRef(false)
  const ackedRef = useRef<{ state: PersistedState; updatedAt: string | null }>({
    state: createInitialState(),
    updatedAt: null,
  })
  const persistRef = useRef<(opts?: { keepalive?: boolean }) => void>(() => {})
  const refreshRef = useRef<(opts?: { silent?: boolean }) => Promise<void>>(async () => {})

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
      const sent = extractServerSlice(stateRef.current)
      const base = extractServerSlice(ackedRef.current.state)
      void saveTeamState(sent, { keepalive, base })
        .then((result) => {
          if (!result?.state) return
          const remote = result.state
          ackedRef.current = {
            state: mergeServerIntoPersisted(remote),
            updatedAt: result.updatedAt,
          }
          const next = applyRemoteToLocal(mergeServerIntoPersisted(sent), stateRef.current, remote)
          if (JSON.stringify(extractServerSlice(stateRef.current)) === JSON.stringify(extractServerSlice(next))) {
            return
          }
          stateRef.current = next
          setState(next)
        })
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

  persistRef.current = persist

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!teamRef.current || !hydratedRef.current) return
    if (savingRef.current) return
    if (!opts?.silent) setRefreshing(true)
    try {
      const envelope = await fetchTeamState()
      if (opts?.silent && envelope.updatedAt && envelope.updatedAt === ackedRef.current.updatedAt) {
        return
      }
      const next = applyRemoteToLocal(ackedRef.current.state, stateRef.current, envelope.state)
      ackedRef.current = {
        state: mergeServerIntoPersisted(envelope.state),
        updatedAt: envelope.updatedAt,
      }
      stateRef.current = next
      setState(next)
      setSyncError(null)
    } catch (err) {
      if (!opts?.silent) {
        setSyncError(err instanceof Error ? err.message : 'Could not refresh team list')
      }
    } finally {
      if (!opts?.silent) setRefreshing(false)
    }
  }, [])

  refreshRef.current = refresh

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
        const envelope = await fetchTeamState()
        const merged = mergeLegacyLocalIfNeeded(envelope.state)
        if (serverStateIsEmpty(envelope.state) && !serverStateIsEmpty(merged)) {
          const saved = await saveTeamState(merged)
          if (saved?.updatedAt) envelope.updatedAt = saved.updatedAt
          if (saved?.state) Object.assign(merged, saved.state)
        }
        if (cancelled) return
        const next = mergeServerIntoPersisted(merged)
        stateRef.current = next
        ackedRef.current = { state: next, updatedAt: envelope.updatedAt }
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
    saveTimer.current = setTimeout(() => persistRef.current(), SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, team, hydrated])

  useEffect(() => {
    if (!team || !hydrated) return

    const flushHidden = () => persistRef.current({ keepalive: true })
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushHidden()
      else void refreshRef.current({ silent: true })
    }
    const onPageShow = () => void refreshRef.current({ silent: true })
    window.addEventListener('pagehide', flushHidden)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('pagehide', flushHidden)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      persistRef.current({ keepalive: true })
    }
  }, [team?.id, hydrated])

  useEffect(() => {
    if (!team || !hydrated) return

    const startPoll = () => {
      if (pollTimer.current) return
      pollTimer.current = setInterval(() => {
        if (document.visibilityState === 'hidden') return
        void refreshRef.current({ silent: true })
      }, POLL_MS)
    }
    const stopPoll = () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current)
        pollTimer.current = null
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stopPoll()
      else startPoll()
    }
    if (document.visibilityState !== 'hidden') startPoll()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stopPoll()
    }
  }, [team?.id, hydrated])

  const update = useCallback(
    (updater: (prev: PersistedState) => PersistedState, options?: PersistOptions) => {
      setState((prev) => {
        const next = updater(prev)
        stateRef.current = next
        return next
      })
      if (options?.flush) persistRef.current()
    },
    [],
  )

  const refreshNow = useCallback(() => refreshRef.current(), [])

  return [state, update, hydrated, syncError, persist, refreshNow, refreshing]
}
