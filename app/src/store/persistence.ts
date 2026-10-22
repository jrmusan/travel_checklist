import { buildMasterPoolFromRegistry } from '../trip-types/registry'
import {
  SCHEMA_VERSION,
  type PersistedState,
  type TripProgress,
} from '../types'

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
  return {
    schemaVersion: SCHEMA_VERSION,
    masterPool: buildMasterPoolFromRegistry(),
    trips: [],
    activeTripId: null,
    progressByTripId: {},
  }
}

function mergeMasterPool(
  existing: PersistedState['masterPool'],
  seeded: PersistedState['masterPool'],
): PersistedState['masterPool'] {
  const categoryById = new Map(existing.categories.map((c) => [c.id, c]))
  for (const c of seeded.categories) {
    if (!categoryById.has(c.id)) {
      categoryById.set(c.id, c)
    }
  }

  const itemById = new Map(existing.items.map((i) => [i.id, i]))
  for (const i of seeded.items) {
    if (!itemById.has(i.id)) {
      itemById.set(i.id, i)
    }
  }

  return {
    categories: [...categoryById.values()].sort((a, b) => a.order - b.order),
    items: [...itemById.values()].sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        return a.categoryId.localeCompare(b.categoryId)
      }
      return a.order - b.order
    }),
  }
}

function migrate(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') {
    return createInitialState()
  }

  const obj = raw as Partial<PersistedState>
  const seeded = buildMasterPoolFromRegistry()

  if (obj.schemaVersion !== SCHEMA_VERSION) {
    return {
      schemaVersion: SCHEMA_VERSION,
      masterPool: seeded,
      trips: Array.isArray(obj.trips) ? obj.trips : [],
      activeTripId: typeof obj.activeTripId === 'string' ? obj.activeTripId : null,
      progressByTripId:
        obj.progressByTripId && typeof obj.progressByTripId === 'object'
          ? (obj.progressByTripId as Record<string, TripProgress>)
          : {},
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    masterPool: mergeMasterPool(
      obj.masterPool ?? { categories: [], items: [] },
      seeded,
    ),
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
