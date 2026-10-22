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

export function useTeamPersistedState(team: TeamInfo | null): [
  PersistedState,
  (updater: (prev: PersistedState) => PersistedState) => void,
  boolean,
  string | null,
] {
  const [state, setState] = useState<PersistedState>(() => createInitialState())
  const [hydrated, setHydrated] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        setState(mergeServerIntoPersisted(merged))
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

    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
    }

    saveTimer.current = setTimeout(() => {
      saveTeamState(extractServerSlice(state)).catch((err) => {
        setSyncError(err instanceof Error ? err.message : 'Could not save changes')
      })
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, team, hydrated])

  const update = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    setState((prev) => updater(prev))
  }, [])

  return [state, update, hydrated, syncError]
}
