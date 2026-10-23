import { sql } from '@vercel/postgres'
import { emptyTeamSlice, mergeTeamState } from '../../shared/team-merge.mjs'

export interface TeamRow {
  id: string
  team_name: string
  password_hash: string
}

export async function findTeamByName(teamName: string): Promise<TeamRow | null> {
  const normalized = teamName.trim()
  if (!normalized) return null
  const { rows } = await sql<TeamRow>`
    SELECT id, team_name, password_hash
    FROM teams
    WHERE LOWER(team_name) = LOWER(${normalized})
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function createTeam(teamName: string, passwordHash: string): Promise<TeamRow> {
  const name = teamName.trim()
  const { rows } = await sql<TeamRow>`
    INSERT INTO teams (team_name, password_hash)
    VALUES (${name}, ${passwordHash})
    RETURNING id, team_name, password_hash
  `
  const row = rows[0]
  if (!row) {
    throw new Error('Failed to create team')
  }
  await sql`
    INSERT INTO team_trip_state (team_id, state)
    VALUES (${row.id}, ${JSON.stringify(emptyServerTripState())}::jsonb)
    ON CONFLICT (team_id) DO NOTHING
  `
  return row
}

export function emptyServerTripState() {
  return {
    schemaVersion: 2,
    trips: [],
    activeTripId: null,
    progressByTripId: {},
  }
}

export interface ServerCatalog {
  categories: unknown[]
  items: unknown[]
}

export interface ServerTripState {
  schemaVersion: number
  trips: unknown[]
  activeTripId: string | null
  progressByTripId: Record<string, { checkedItemIds: string[] }>
  catalog?: ServerCatalog
  removedItemIds?: string[]
  /** Monotonic write counter for CAS. Not a client-edited field. */
  revision?: number
}

export class ConcurrentStateError extends Error {
  readonly status = 409
  constructor() {
    super('Could not save team state (concurrent writes).')
    this.name = 'ConcurrentStateError'
  }
}

export interface TeamTripStateRow {
  state: ServerTripState
  updatedAt: string | null
}

function toIso(value: unknown): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export async function getTeamTripStateRow(teamId: string): Promise<TeamTripStateRow> {
  const { rows } = await sql<{ state: ServerTripState; updated_at: Date | string | null }>`
    SELECT state, updated_at FROM team_trip_state WHERE team_id = ${teamId}::uuid LIMIT 1
  `
  const row = rows[0]
  if (!row) {
    return { state: emptyServerTripState(), updatedAt: null }
  }
  const raw = row.state
  const state =
    raw && typeof raw === 'object' ? normalizeServerTripState(raw as ServerTripState) : emptyServerTripState()
  return { state, updatedAt: toIso(row.updated_at) }
}

export async function getTeamTripState(teamId: string): Promise<ServerTripState> {
  return (await getTeamTripStateRow(teamId)).state
}

export async function saveTeamTripState(teamId: string, state: ServerTripState): Promise<void> {
  await saveMergedTeamTripState(teamId, state, emptyTeamSlice())
}

function revisionOf(state: ServerTripState | undefined): number {
  const value = state?.revision
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function payloadWithoutRevision(state: ServerTripState): string {
  const { revision: _revision, ...rest } = state
  return JSON.stringify(rest)
}

export async function saveMergedTeamTripState(
  teamId: string,
  incoming: ServerTripState,
  base: ServerTripState | undefined,
): Promise<TeamTripStateRow> {
  const incomingNorm = normalizeServerTripState(incoming)
  const baseNorm = base ? normalizeServerTripState(base) : emptyServerTripState()

  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await getTeamTripStateRow(teamId)
    const stored = current.updatedAt ? current.state : emptyServerTripState()
    const expectedRev = revisionOf(current.state)
    const merged = normalizeServerTripState(
      mergeTeamState(baseNorm, incomingNorm, stored) as ServerTripState,
    )

    if (current.updatedAt && payloadWithoutRevision(merged) === payloadWithoutRevision(stored)) {
      return current
    }

    const toWrite: ServerTripState = { ...merged, revision: expectedRev + 1 }
    const payload = JSON.stringify(toWrite)

    if (!current.updatedAt) {
      const inserted = await sql<{ updated_at: Date | string }>`
        INSERT INTO team_trip_state (team_id, state, updated_at)
        VALUES (${teamId}::uuid, ${payload}::jsonb, NOW())
        ON CONFLICT (team_id) DO NOTHING
        RETURNING updated_at
      `
      if (inserted.rows[0]) {
        return { state: toWrite, updatedAt: toIso(inserted.rows[0].updated_at) }
      }
      continue
    }

    const updated = await sql<{ updated_at: Date | string }>`
      UPDATE team_trip_state
      SET state = ${payload}::jsonb, updated_at = NOW()
      WHERE team_id = ${teamId}::uuid
        AND COALESCE((state->>'revision')::int, 0) = ${expectedRev}
      RETURNING updated_at
    `
    if (updated.rows[0]) {
      return { state: toWrite, updatedAt: toIso(updated.rows[0].updated_at) }
    }
  }

  throw new ConcurrentStateError()
}

function normalizeCatalog(raw: ServerTripState['catalog']): ServerCatalog | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const categories = Array.isArray(raw.categories) ? raw.categories : []
  const items = Array.isArray(raw.items) ? raw.items : []
  if (categories.length === 0 && items.length === 0) return undefined
  return { categories, items }
}

function normalizeServerTripState(state: ServerTripState): ServerTripState {
  const catalog = normalizeCatalog(state.catalog)
  const removedItemIds = Array.isArray(state.removedItemIds)
    ? state.removedItemIds.filter((id) => typeof id === 'string')
    : []
  const revision = revisionOf(state)
  return {
    schemaVersion: 2,
    trips: Array.isArray(state.trips) ? state.trips : [],
    activeTripId: typeof state.activeTripId === 'string' ? state.activeTripId : null,
    progressByTripId:
      state.progressByTripId && typeof state.progressByTripId === 'object'
        ? state.progressByTripId
        : {},
    ...(catalog ? { catalog } : {}),
    removedItemIds,
    ...(revision ? { revision } : {}),
  }
}
