import bannerCoast from '../assets/scenes/banner-coast.webp'
import bannerGorge from '../assets/scenes/banner-gorge.webp'
import bannerLake from '../assets/scenes/banner-mountain-lake.webp'
import type { MasterItem, PersistedState, TripInstance } from '../types'

const BANNERS = [bannerLake, bannerGorge, bannerCoast]

/** Stable per-trip banner so a trip keeps its picture across sessions. */
export function tripBanner(trip: TripInstance | null): string {
  if (!trip) return bannerLake
  let hash = 0
  for (const ch of trip.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return BANNERS[hash % BANNERS.length]
}

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

export function tripDateRange(trip: TripInstance): string {
  const start = shortDate.format(new Date(trip.startedAt))
  if (!trip.endedAt) return `${start} – now`
  const end = shortDate.format(new Date(trip.endedAt))
  return start === end ? start : `${start} – ${end}`
}

export function tripDayCount(trip: TripInstance): number {
  const end = trip.endedAt ? new Date(trip.endedAt) : new Date()
  const ms = end.getTime() - new Date(trip.startedAt).getTime()
  return Math.max(1, Math.ceil(ms / 86_400_000))
}

export function tripProgress(state: PersistedState, trip: TripInstance, items: MasterItem[]) {
  const checked = new Set(state.progressByTripId[trip.id]?.checkedItemIds ?? [])
  const packed = items.filter((i) => checked.has(i.id)).length
  return { packed, total: items.length }
}

export function percent(packed: number, total: number): number {
  return total === 0 ? 0 : Math.round((packed / total) * 100)
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
