import type { ServerTripStatePayload } from '../api/client'
import type { PersistedState } from '../types'
import { resolveTeamCatalog } from './catalog'
import { loadLegacyLocalTripSlice } from './persistence'

/** Team catalog lives on the same JSON blob as trips; seed if the team has none yet. */
export function mergeServerIntoPersisted(server: ServerTripStatePayload): PersistedState {
  const { masterPool, removedItemIds } = resolveTeamCatalog(server.catalog, server.removedItemIds)
  return {
    schemaVersion: server.schemaVersion,
    masterPool,
    removedItemIds,
    trips: server.trips,
    activeTripId: server.activeTripId,
    progressByTripId: server.progressByTripId,
  }
}

export function extractServerSlice(state: PersistedState): ServerTripStatePayload {
  return {
    schemaVersion: state.schemaVersion,
    trips: state.trips,
    activeTripId: state.activeTripId,
    progressByTripId: state.progressByTripId,
    catalog: state.masterPool,
    removedItemIds: state.removedItemIds,
  }
}

export function serverStateIsEmpty(server: ServerTripStatePayload): boolean {
  return (
    server.trips.length === 0 &&
    server.activeTripId === null &&
    Object.keys(server.progressByTripId).length === 0
  )
}

export function mergeLegacyLocalIfNeeded(server: ServerTripStatePayload): ServerTripStatePayload {
  if (!serverStateIsEmpty(server)) {
    return server
  }
  const legacy = loadLegacyLocalTripSlice()
  if (!legacy) {
    return server
  }
  return {
    ...server,
    schemaVersion: 2,
    trips: legacy.trips,
    activeTripId: legacy.activeTripId,
    progressByTripId: legacy.progressByTripId,
  }
}
