import { resolveTeamCatalog } from './catalog'
import { SCHEMA_VERSION, type PersistedState, type TripProgress } from '../types'

const STORAGE_KEY = 'travel-checklist:v1'

export interface LegacyLocalTripSlice {
  trips: PersistedState['trips']
  activeTripId: PersistedState['activeTripId']
  progressByTripId: PersistedState['progressByTripId']
}

/** One-time read of pre-auth browser trip data for migration after login. */
export function loadLegacyLocalTripSlice(): LegacyLocalTripSlice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (!Array.isArray(parsed.trips)) return null
    return {
      trips: parsed.trips,
      activeTripId: typeof parsed.activeTripId === 'string' ? parsed.activeTripId : null,
      progressByTripId:
        parsed.progressByTripId && typeof parsed.progressByTripId === 'object'
          ? parsed.progressByTripId
          : {},
    }
  } catch {
    return null
  }
}

export function createEmptyProgress(): TripProgress {
  return { checkedItemIds: [] }
}

export function createInitialState(): PersistedState {
  const { masterPool, removedItemIds } = resolveTeamCatalog(null, [])
  return {
    schemaVersion: SCHEMA_VERSION,
    masterPool,
    removedItemIds,
    trips: [],
    activeTripId: null,
    progressByTripId: {},
  }
}

function migrate(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') {
    return createInitialState()
  }

  const obj = raw as Partial<PersistedState>
  const { masterPool, removedItemIds } = resolveTeamCatalog(
    obj.masterPool,
    obj.removedItemIds,
  )

  return {
    schemaVersion: SCHEMA_VERSION,
    masterPool,
    removedItemIds,
    trips: Array.isArray(obj.trips) ? obj.trips : [],
    activeTripId: typeof obj.activeTripId === 'string' ? obj.activeTripId : null,
    progressByTripId:
      obj.progressByTripId && typeof obj.progressByTripId === 'object'
        ? (obj.progressByTripId as Record<string, TripProgress>)
        : {},
  }
}

export function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createInitialState()
    }
    return migrate(JSON.parse(raw))
  } catch {
    return createInitialState()
  }
}

export function savePersistedState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
