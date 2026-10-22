export function itemIdentityKey(item: {
  tripTypeId?: string
  categoryId?: string
  label?: string
}): string

export function emptyTeamSlice(): {
  schemaVersion: number
  trips: unknown[]
  activeTripId: string | null
  progressByTripId: Record<string, { checkedItemIds: string[] }>
  catalog: { categories: unknown[]; items: unknown[] }
  removedItemIds: string[]
}

export function collapseDuplicateItems(items: unknown[]): {
  items: unknown[]
  aliasToCanonical: Map<string, string>
  collapsedCanonicals: Set<string>
}

export function mergeTeamState(base: unknown, incoming: unknown, stored: unknown): {
  schemaVersion: number
  trips: unknown[]
  activeTripId: string | null
  progressByTripId: Record<string, { checkedItemIds: string[] }>
  catalog: { categories: unknown[]; items: unknown[] }
  removedItemIds: string[]
}
