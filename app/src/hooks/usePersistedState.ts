import { useCallback, useEffect, useState } from 'react'
import { loadPersistedState, savePersistedState } from '../store/persistence'
import type { PersistedState } from '../types'

export function usePersistedState(): [
  PersistedState,
  (updater: (prev: PersistedState) => PersistedState) => void,
  boolean,
] {
  const [state, setState] = useState<PersistedState>(() => loadPersistedState())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadPersistedState())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      savePersistedState(state)
    }
  }, [state, hydrated])

  const update = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    setState((prev) => updater(prev))
  }, [])

  return [state, update, hydrated]
}
