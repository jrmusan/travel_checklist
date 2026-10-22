import type { ServerTripStatePayload } from '../api/client'
import type { PersistedState } from '../types'
import { createInitialState, loadLegacyLocalTripSlice } from './persistence'

/** Master pool always comes from the client seed; trips/progress from the server. */
export function mergeServerIntoPersisted(
  server: ServerTripStatePayload,
  masterPool = createInitialState().masterPool,
): PersistedState {
  return {
    schemaVersion: server.schemaVersion,
    masterPool,
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
    schemaVersion: 2,
    trips: legacy.trips,
    activeTripId: legacy.activeTripId,
    progressByTripId: legacy.progressByTripId,
  }
}
