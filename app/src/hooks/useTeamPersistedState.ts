import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTeamState, isConcurrentStateError, saveTeamState } from '../api/client'
import type { TeamInfo } from '../api/client'
import {
  applyRemoteToLocal,
  extractServerSlice,
  mergeLegacyLocalIfNeeded,
  mergeServerIntoPersisted,
  serverStateIsEmpty,
  slicesEqual,
} from '../store/server-sync'
import { createInitialState } from '../store/persistence'
import type { PersistedState } from '../types'

const SAVE_DEBOUNCE_MS = 400
const POLL_MS = 18_000
const CLIENT_SAVE_RETRIES = 5

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
  const ackedRef = useRef<{ state: PersistedState; updatedAt: string | null }>({
    state: createInitialState(),
    updatedAt: null,
  })
  const chainRef = useRef(Promise.resolve())
  const persistRef = useRef<(opts?: { keepalive?: boolean }) => Promise<void>>(async () => {})
  const refreshRef = useRef<(opts?: { silent?: boolean }) => Promise<void>>(async () => {})

  useEffect(() => {
    stateRef.current = state
    teamRef.current = team
    hydratedRef.current = hydrated
  })

  const enqueue = useCallback((task: () => Promise<void>) => {
    const run = chainRef.current.then(task, task)
    chainRef.current = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }, [])

  const isDirty = useCallback(() => !slicesEqual(stateRef.current, ackedRef.current.state), [])

  const applyAcked = useCallback((remote: import('../api/client').ServerTripStatePayload, updatedAt: string | null) => {
    const sentBase = ackedRef.current.state
    const next = applyRemoteToLocal(sentBase, stateRef.current, remote)
    ackedRef.current = {
      state: mergeServerIntoPersisted(remote),
      updatedAt,
    }
    if (!slicesEqual(stateRef.current, next)) {
      stateRef.current = next
      setState(next)
    }
  }, [])

  const persist = useCallback(
    (opts?: { keepalive?: boolean }) => {
      if (!teamRef.current || !hydratedRef.current) return Promise.resolve()
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (!isDirty()) return Promise.resolve()

      return enqueue(async () => {
        if (!isDirty()) return
        const keepalive = Boolean(opts?.keepalive)
        for (let attempt = 0; attempt < CLIENT_SAVE_RETRIES; attempt++) {
          if (!isDirty()) return
          const sent = extractServerSlice(stateRef.current)
          const base = extractServerSlice(ackedRef.current.state)
          try {
            const result = await saveTeamState(sent, { keepalive, base })
            if (!result?.state) return
            applyAcked(result.state, result.updatedAt)
            return
          } catch (err) {
            if (keepalive) return
            if (isConcurrentStateError(err) && attempt < CLIENT_SAVE_RETRIES - 1) {
              try {
                const envelope = await fetchTeamState()
                applyAcked(envelope.state, envelope.updatedAt)
              } catch {
                /* retry PUT with current local */
              }
              continue
            }
            setSyncError(err instanceof Error ? err.message : 'Could not save changes')
            return
          }
        }
      })
    },
    [applyAcked, enqueue, isDirty],
  )

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!teamRef.current || !hydratedRef.current) return
      if (!opts?.silent) setRefreshing(true)
      try {
        await enqueue(async () => {
          const envelope = await fetchTeamState()
          if (opts?.silent && envelope.updatedAt && envelope.updatedAt === ackedRef.current.updatedAt) {
            return
          }
          applyAcked(envelope.state, envelope.updatedAt)
          setSyncError(null)
        })
        if (isDirty()) await persist()
      } catch (err) {
        if (!opts?.silent) {
          setSyncError(err instanceof Error ? err.message : 'Could not refresh team list')
        }
      } finally {
        if (!opts?.silent) setRefreshing(false)
      }
    },
    [applyAcked, enqueue, isDirty, persist],
  )

  useEffect(() => {
    persistRef.current = persist
    refreshRef.current = refresh
  }, [persist, refresh])

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
    if (!isDirty()) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void persistRef.current()
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, team, hydrated, isDirty])

  useEffect(() => {
    if (!team || !hydrated) return

    const flushHidden = () => {
      void persistRef.current({ keepalive: true })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushHidden()
      else void refreshRef.current({ silent: true })
    }
    const onPageShow = () => {
      void refreshRef.current({ silent: true })
    }
    window.addEventListener('pagehide', flushHidden)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('pagehide', flushHidden)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      void persistRef.current({ keepalive: true })
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
      if (options?.flush) void persistRef.current()
    },
    [],
  )

  const flush = useCallback(() => {
    void persistRef.current()
  }, [])

  const refreshNow = useCallback(() => refreshRef.current(), [])

  return [state, update, hydrated, syncError, flush, refreshNow, refreshing]
}
