import type { PersistedState, TripTypeId } from '../types'
import { createEmptyProgress } from './persistence'

function newTripId(): string {
  return crypto.randomUUID()
}

export function startTrip(state: PersistedState, tripTypeId: TripTypeId): PersistedState {
  const id = newTripId()
  const trip = {
    id,
    tripTypeId,
    startedAt: new Date().toISOString(),
    status: 'active' as const,
  }

  const nextTrips = state.trips.map((t) =>
    t.tripTypeId === tripTypeId && t.status === 'active'
      ? { ...t, status: 'ended' as const, endedAt: new Date().toISOString() }
      : t,
  )

  return {
    ...state,
    trips: [...nextTrips, trip],
    activeTripId: id,
    progressByTripId: {
      ...state.progressByTripId,
      [id]: createEmptyProgress(),
    },
  }
}

export function endTrip(state: PersistedState, tripId: string): PersistedState {
  const endedAt = new Date().toISOString()
  return {
    ...state,
    activeTripId: state.activeTripId === tripId ? null : state.activeTripId,
    trips: state.trips.map((t) =>
      t.id === tripId ? { ...t, status: 'ended' as const, endedAt } : t,
    ),
  }
}

export function toggleItemChecked(
  state: PersistedState,
  tripId: string,
  itemId: string,
): PersistedState {
  const progress = state.progressByTripId[tripId] ?? createEmptyProgress()
  const set = new Set(progress.checkedItemIds)
  if (set.has(itemId)) {
    set.delete(itemId)
  } else {
    set.add(itemId)
  }
  return {
    ...state,
    progressByTripId: {
      ...state.progressByTripId,
      [tripId]: { checkedItemIds: [...set] },
    },
  }
}

/** Checks or unchecks a batch of items in one state change (one debounced save). */
export function setItemsChecked(
  state: PersistedState,
  tripId: string,
  itemIds: string[],
  checked: boolean,
): PersistedState {
  const progress = state.progressByTripId[tripId] ?? createEmptyProgress()
  const set = new Set(progress.checkedItemIds)
  for (const id of itemIds) {
    if (checked) set.add(id)
    else set.delete(id)
  }
  return {
    ...state,
    progressByTripId: {
      ...state.progressByTripId,
      [tripId]: { checkedItemIds: [...set] },
    },
  }
}

export function itemsForTripType(state: PersistedState, tripTypeId: TripTypeId) {
  const categories = state.masterPool.categories
    .filter((c) => c.tripTypeId === tripTypeId)
    .sort((a, b) => a.order - b.order)
  const items = state.masterPool.items.filter((i) => i.tripTypeId === tripTypeId)
  return { categories, items }
}
