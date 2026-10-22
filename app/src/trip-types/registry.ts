import type { MasterPool, TripTypeDefinition, TripTypeId } from '../types'
import { camperTripType, loadCamperMasterPool } from './camper'

export interface TripTypeRegistryEntry {
  definition: TripTypeDefinition
  loadMasterPool: () => MasterPool
}

/** Add new trip types here — UI reads this list; no hardcoded single-type assumptions elsewhere. */
const ENTRIES: TripTypeRegistryEntry[] = [
  {
    definition: camperTripType,
    loadMasterPool: loadCamperMasterPool,
  },
]

const byId = new Map<TripTypeId, TripTypeRegistryEntry>(
  ENTRIES.map((e) => [e.definition.id, e]),
)

export function listTripTypes(): TripTypeDefinition[] {
  return ENTRIES.map((e) => e.definition)
}

export function getTripType(id: TripTypeId): TripTypeRegistryEntry | undefined {
  return byId.get(id)
}

export function buildMasterPoolFromRegistry(): MasterPool {
  const categories: MasterPool['categories'] = []
  const items: MasterPool['items'] = []
  for (const entry of ENTRIES) {
    const pool = entry.loadMasterPool()
    categories.push(...pool.categories)
    items.push(...pool.items)
  }
  return { categories, items }
}
