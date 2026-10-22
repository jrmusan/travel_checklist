import type { MasterItem, MasterPool, PersistedState, TripTypeId } from '../types'
import { buildMasterPoolFromRegistry } from '../trip-types/registry'

export const ITEM_LABEL_MAX = 80

export function normalizeItemLabel(raw: string): string | null {
  const label = raw.trim().replace(/\s+/g, ' ')
  if (!label || label.length > ITEM_LABEL_MAX) return null
  return label
}

export function newCustomItemId(categoryId: string): string {
  return `${categoryId}:custom:${crypto.randomUUID()}`
}

export function mergeMasterPool(
  existing: MasterPool,
  seeded: MasterPool,
  removedItemIds: Iterable<string> = [],
): MasterPool {
  const removed = new Set(removedItemIds)
  const categoryById = new Map(existing.categories.map((c) => [c.id, c]))
  for (const c of seeded.categories) {
    if (!categoryById.has(c.id)) categoryById.set(c.id, c)
  }

  const itemById = new Map(existing.items.filter((i) => !removed.has(i.id)).map((i) => [i.id, i]))
  for (const i of seeded.items) {
    if (removed.has(i.id) || itemById.has(i.id)) continue
    itemById.set(i.id, i)
  }

  return {
    categories: [...categoryById.values()].sort((a, b) => a.order - b.order),
    items: [...itemById.values()].sort(compareItems),
  }
}

function compareItems(a: MasterItem, b: MasterItem) {
  if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId)
  return a.order - b.order
}

export function resolveTeamCatalog(
  catalog: MasterPool | null | undefined,
  removedItemIds: string[] | undefined,
): { masterPool: MasterPool; removedItemIds: string[] } {
  const seeded = buildMasterPoolFromRegistry()
  const removed = Array.isArray(removedItemIds) ? removedItemIds.filter((id) => typeof id === 'string') : []
  const hasCatalog =
    catalog &&
    typeof catalog === 'object' &&
    ((catalog.categories?.length ?? 0) > 0 || (catalog.items?.length ?? 0) > 0)
  const existing = hasCatalog ? sanitizePool(catalog) : { categories: [], items: [] }

  return {
    masterPool: mergeMasterPool(existing, seeded, removed),
    removedItemIds: removed,
  }
}

function sanitizePool(pool: MasterPool): MasterPool {
  const categories = (Array.isArray(pool.categories) ? pool.categories : []).filter(
    (c) =>
      c &&
      typeof c.id === 'string' &&
      typeof c.tripTypeId === 'string' &&
      typeof c.name === 'string' &&
      typeof c.order === 'number',
  )
  const items = (Array.isArray(pool.items) ? pool.items : []).filter(
    (i) =>
      i &&
      typeof i.id === 'string' &&
      typeof i.tripTypeId === 'string' &&
      typeof i.categoryId === 'string' &&
      typeof i.label === 'string' &&
      typeof i.order === 'number',
  )
  return { categories, items }
}

export function addCatalogItem(
  state: PersistedState,
  input: { tripTypeId: TripTypeId; categoryId: string; label: string; id?: string },
): PersistedState | { error: string } {
  const label = normalizeItemLabel(input.label)
  if (!label) {
    return { error: `Name is required (1–${ITEM_LABEL_MAX} characters).` }
  }
  const category = state.masterPool.categories.find(
    (c) => c.id === input.categoryId && c.tripTypeId === input.tripTypeId,
  )
  if (!category) return { error: 'Pick a category.' }

  const id = input.id ?? newCustomItemId(category.id)
  if (state.masterPool.items.some((i) => i.id === id)) return state

  const siblings = state.masterPool.items.filter((i) => i.categoryId === category.id)
  const order = siblings.reduce((max, i) => Math.max(max, i.order), -1) + 1
  const item: MasterItem = {
    id,
    tripTypeId: input.tripTypeId,
    categoryId: category.id,
    label,
    order,
  }

  return {
    ...state,
    masterPool: {
      ...state.masterPool,
      items: [...state.masterPool.items, item].sort(compareItems),
    },
  }
}

export function updateCatalogItem(
  state: PersistedState,
  itemId: string,
  patch: { label?: string; categoryId?: string },
): PersistedState | { error: string } {
  const current = state.masterPool.items.find((i) => i.id === itemId)
  if (!current) return { error: 'That item is gone.' }

  let label = current.label
  if (patch.label !== undefined) {
    const next = normalizeItemLabel(patch.label)
    if (!next) return { error: `Name is required (1–${ITEM_LABEL_MAX} characters).` }
    label = next
  }

  let categoryId = current.categoryId
  let order = current.order
  if (patch.categoryId && patch.categoryId !== current.categoryId) {
    const category = state.masterPool.categories.find(
      (c) => c.id === patch.categoryId && c.tripTypeId === current.tripTypeId,
    )
    if (!category) return { error: 'Pick a category.' }
    categoryId = category.id
    const siblings = state.masterPool.items.filter((i) => i.categoryId === categoryId)
    order = siblings.reduce((max, i) => Math.max(max, i.order), -1) + 1
  }

  return {
    ...state,
    masterPool: {
      ...state.masterPool,
      items: state.masterPool.items
        .map((i) => (i.id === itemId ? { ...i, label, categoryId, order } : i))
        .sort(compareItems),
    },
  }
}

export function removeCatalogItem(state: PersistedState, itemId: string): PersistedState {
  const progressByTripId = Object.fromEntries(
    Object.entries(state.progressByTripId).map(([tripId, progress]) => [
      tripId,
      { checkedItemIds: progress.checkedItemIds.filter((id) => id !== itemId) },
    ]),
  )

  return {
    ...state,
    masterPool: {
      ...state.masterPool,
      items: state.masterPool.items.filter((i) => i.id !== itemId),
    },
    removedItemIds: state.removedItemIds.includes(itemId)
      ? state.removedItemIds
      : [...state.removedItemIds, itemId],
    progressByTripId,
  }
}

export function isCatalogError<T extends PersistedState>(
  result: T | { error: string },
): result is { error: string } {
  return 'error' in result
}
