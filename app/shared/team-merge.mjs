/** 3-way merge for team packing state. Safe for Node (mock API), Vercel, and Vite. */

export function itemIdentityKey(item) {
  const tripTypeId = String(item?.tripTypeId ?? '')
  const categoryId = String(item?.categoryId ?? '')
  const label = String(item?.label ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
  return `${tripTypeId}\0${categoryId}\0${label}`
}

export function emptyTeamSlice() {
  return {
    schemaVersion: 2,
    trips: [],
    activeTripId: null,
    progressByTripId: {},
    catalog: { categories: [], items: [] },
    removedItemIds: [],
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === 'object' ? value : {}
}

function itemMap(slice) {
  const map = new Map()
  for (const item of asArray(slice?.catalog?.items)) {
    if (item && typeof item.id === 'string') map.set(item.id, item)
  }
  return map
}

function categoryMap(slice) {
  const map = new Map()
  for (const cat of asArray(slice?.catalog?.categories)) {
    if (cat && typeof cat.id === 'string') map.set(cat.id, cat)
  }
  return map
}

function tripMap(slice) {
  const map = new Map()
  for (const trip of asArray(slice?.trips)) {
    if (trip && typeof trip.id === 'string') map.set(trip.id, trip)
  }
  return map
}

function tripChanged(a, b) {
  if (!a || !b) return a !== b
  return (
    a.name !== b.name ||
    a.startDate !== b.startDate ||
    a.endDate !== b.endDate ||
    a.status !== b.status ||
    a.endedAt !== b.endedAt
  )
}

function idSet(ids) {
  return new Set(asArray(ids).filter((id) => typeof id === 'string'))
}

function compareItems(a, b) {
  if (a.categoryId !== b.categoryId) return String(a.categoryId).localeCompare(String(b.categoryId))
  return (a.order ?? 0) - (b.order ?? 0)
}

/**
 * Collapse items that share trip type + category + normalized name.
 * Returns alias→canonical and canonical ids that were collapsed from distinct ids
 * (those should be marked checked).
 */
export function collapseDuplicateItems(items) {
  const aliasToCanonical = new Map()
  const canonicalByKey = new Map()
  const collapsedCanonicals = new Set()
  const kept = []

  const sorted = [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)))
  for (const item of sorted) {
    if (!item || typeof item.id !== 'string') continue
    const key = itemIdentityKey(item)
    const existing = canonicalByKey.get(key)
    if (!existing) {
      canonicalByKey.set(key, item)
      aliasToCanonical.set(item.id, item.id)
      kept.push(item)
      continue
    }
    aliasToCanonical.set(item.id, existing.id)
    if (item.id !== existing.id) collapsedCanonicals.add(existing.id)
  }

  kept.sort(compareItems)
  return { items: kept, aliasToCanonical, collapsedCanonicals }
}

function remapChecked(ids, aliasToCanonical) {
  const next = new Set()
  for (const id of ids) next.add(aliasToCanonical.get(id) ?? id)
  return next
}

function mergeProgress(base, incoming, stored, aliasToCanonical, forceChecked) {
  const keys = new Set([
    ...Object.keys(asObject(base?.progressByTripId)),
    ...Object.keys(asObject(incoming?.progressByTripId)),
    ...Object.keys(asObject(stored?.progressByTripId)),
  ])
  const progressByTripId = {}
  for (const tripId of keys) {
    const b = idSet(base?.progressByTripId?.[tripId]?.checkedItemIds)
    const i = idSet(incoming?.progressByTripId?.[tripId]?.checkedItemIds)
    const s = idSet(stored?.progressByTripId?.[tripId]?.checkedItemIds)
    const added = [...i].filter((id) => !b.has(id))
    const removed = [...b].filter((id) => !i.has(id))
    const result = new Set(s)
    for (const id of added) result.add(id)
    for (const id of removed) result.delete(id)
    const remapped = remapChecked(result, aliasToCanonical)
    for (const id of forceChecked) remapped.add(id)
    progressByTripId[tripId] = { checkedItemIds: [...remapped] }
  }
  return progressByTripId
}

/**
 * 3-way merge: `base` is the last snapshot the writer had, `incoming` is their
 * desired state, `stored` is the current server (or remote GET) blob.
 * Check ids: last write per id; different ids union. Duplicate catalog names collapse.
 */
export function mergeTeamState(base, incoming, stored) {
  const baseSlice = base && typeof base === 'object' ? base : emptyTeamSlice()
  const incomingSlice = incoming && typeof incoming === 'object' ? incoming : emptyTeamSlice()
  const storedSlice = stored && typeof stored === 'object' ? stored : emptyTeamSlice()

  const baseRemoved = idSet(baseSlice.removedItemIds)
  const incomingRemoved = idSet(incomingSlice.removedItemIds)
  const storedRemoved = idSet(storedSlice.removedItemIds)
  const removedAdded = [...incomingRemoved].filter((id) => !baseRemoved.has(id))
  const removed = new Set([...storedRemoved, ...removedAdded])

  const baseItems = itemMap(baseSlice)
  const incomingItems = itemMap(incomingSlice)
  const storedItems = itemMap(storedSlice)

  const deletedItemIds = [...baseItems.keys()].filter((id) => !incomingItems.has(id))
  for (const id of deletedItemIds) removed.add(id)

  const itemById = new Map(storedItems)
  for (const [id, item] of incomingItems) {
    if (deletedItemIds.includes(id) || removed.has(id)) continue
    if (!itemById.has(id)) itemById.set(id, item)
  }
  for (const id of deletedItemIds) itemById.delete(id)
  for (const id of removed) itemById.delete(id)

  for (const [id, item] of incomingItems) {
    const prior = baseItems.get(id)
    if (!prior || !itemById.has(id)) continue
    if (item.label !== prior.label || item.categoryId !== prior.categoryId || item.order !== prior.order) {
      itemById.set(id, item)
    }
  }

  const baseCats = categoryMap(baseSlice)
  const incomingCats = categoryMap(incomingSlice)
  const storedCats = categoryMap(storedSlice)
  const categoryById = new Map(storedCats)
  for (const [id, cat] of incomingCats) {
    if (!baseCats.has(id) || JSON.stringify(cat) !== JSON.stringify(baseCats.get(id))) {
      categoryById.set(id, cat)
    } else if (!categoryById.has(id)) {
      categoryById.set(id, cat)
    }
  }

  const { items, aliasToCanonical, collapsedCanonicals } = collapseDuplicateItems([...itemById.values()])
  const categories = [...categoryById.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const baseTrips = tripMap(baseSlice)
  const incomingTrips = tripMap(incomingSlice)
  const storedTrips = tripMap(storedSlice)
  const tripById = new Map(storedTrips)
  for (const [id, trip] of incomingTrips) {
    const prior = baseTrips.get(id)
    const current = tripById.get(id)
    if (!prior) tripById.set(id, trip)
    else if (tripChanged(prior, trip)) tripById.set(id, current ? { ...current, ...trip } : trip)
  }
  const trips = [...tripById.values()]

  const activeTripId =
    incomingSlice.activeTripId !== baseSlice.activeTripId
      ? incomingSlice.activeTripId ?? null
      : (storedSlice.activeTripId ?? null)

  const progressByTripId = mergeProgress(
    baseSlice,
    incomingSlice,
    storedSlice,
    aliasToCanonical,
    collapsedCanonicals,
  )

  const liveIds = new Set(items.map((i) => i.id))
  for (const tripId of Object.keys(progressByTripId)) {
    progressByTripId[tripId] = {
      checkedItemIds: progressByTripId[tripId].checkedItemIds.filter((id) => liveIds.has(id) || collapsedCanonicals.has(id)),
    }
  }

  return {
    schemaVersion: 2,
    trips,
    activeTripId,
    progressByTripId,
    catalog: { categories, items },
    removedItemIds: [...removed],
  }
}
