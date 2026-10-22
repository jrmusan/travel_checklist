import bannerCoast from '../assets/scenes/banner-coast.webp'
import bannerGorge from '../assets/scenes/banner-gorge.webp'
import bannerLake from '../assets/scenes/banner-mountain-lake.webp'
import type { MasterItem, PersistedState, TripInstance, TripPlan } from '../types'

const BANNERS = [bannerLake, bannerGorge, bannerCoast]

export const TRIP_NAME_MAX = 80

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Explicit bounds so iOS Safari does not treat an omitted min as “today only”. */
export const DATE_INPUT_MIN = '1900-01-01'
export const DATE_INPUT_MAX = '2100-12-31'

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

/** Stable per-trip banner so a trip keeps its picture across sessions. */
export function tripBanner(trip: TripInstance | null): string {
  if (!trip) return bannerLake
  let hash = 0
  for (const ch of trip.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return BANNERS[hash % BANNERS.length]
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso(now = new Date()): string {
  return toIsoDate(now)
}

export function parseDateOnly(iso: string): Date | null {
  if (!ISO_DATE.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

export function addDaysIso(iso: string, days: number): string | null {
  const date = parseDateOnly(iso)
  if (!date) return null
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export const TRIP_NIGHTS_MAX = 366

/** Calendar nights (same start and end → 0). Oct 24–Oct 31 → 7. */
export function nightsBetween(startIso: string, endIso: string): number {
  const start = parseDateOnly(startIso)
  const end = parseDateOnly(endIso)
  if (!start || !end) return 0
  const ms = end.getTime() - start.getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

export function formatNightsLabel(nights: number): string {
  if (nights <= 0) return 'day trip'
  return nights === 1 ? '1 night' : `${nights} nights`
}

export function defaultTripDates(now = new Date()): { startDate: string; endDate: string } {
  const startDate = todayIso(now)
  const endDate = addDaysIso(startDate, 6) ?? startDate
  return { startDate, endDate }
}

export function normalizeTripName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!name || name.length > TRIP_NAME_MAX) return null
  return name
}

export function validateTripPlan(input: { name: string; startDate: string; endDate: string }): TripPlan | string {
  const name = normalizeTripName(input.name)
  if (!name) return `Destination is required (1–${TRIP_NAME_MAX} characters).`
  const start = parseDateOnly(input.startDate)
  const end = parseDateOnly(input.endDate)
  if (!start) return 'Pick a start date.'
  if (!end) return 'Pick an end date.'
  if (end.getTime() < start.getTime()) return 'End date cannot be before the start.'
  return { name, startDate: input.startDate, endDate: input.endDate }
}

export function tripDisplayName(trip: TripInstance, typeName: string): string {
  const name = trip.name?.trim()
  return name || typeName
}

export function formatDateLabel(iso: string): string {
  const date = parseDateOnly(iso)
  return date ? shortDate.format(date) : iso
}

export function tripDateRange(trip: TripInstance): string {
  if (trip.startDate) {
    const start = formatDateLabel(trip.startDate)
    if (!trip.endDate || trip.endDate === trip.startDate) return start
    return `${start} – ${formatDateLabel(trip.endDate)}`
  }
  const start = shortDate.format(new Date(trip.startedAt))
  if (!trip.endedAt) return `${start} – now`
  const end = shortDate.format(new Date(trip.endedAt))
  return start === end ? start : `${start} – ${end}`
}

export function tripNightCount(trip: TripInstance): number {
  if (trip.startDate && trip.endDate) return nightsBetween(trip.startDate, trip.endDate)
  const start = toIsoDate(new Date(trip.startedAt))
  const end = toIsoDate(trip.endedAt ? new Date(trip.endedAt) : new Date())
  return nightsBetween(start, end)
}

export function tripScheduleLabel(trip: TripInstance): string {
  return `${tripDateRange(trip)} · ${formatNightsLabel(tripNightCount(trip))}`
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
