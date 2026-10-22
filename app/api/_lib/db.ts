import { sql } from '@vercel/postgres'

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
}

export async function getTeamTripState(teamId: string): Promise<ServerTripState> {
  const { rows } = await sql<{ state: ServerTripState }>`
    SELECT state FROM team_trip_state WHERE team_id = ${teamId}::uuid LIMIT 1
  `
  const raw = rows[0]?.state
  if (!raw || typeof raw !== 'object') {
    return emptyServerTripState()
  }
  return normalizeServerTripState(raw as ServerTripState)
}

export async function saveTeamTripState(teamId: string, state: ServerTripState): Promise<void> {
  const normalized = normalizeServerTripState(state)
  await sql`
    INSERT INTO team_trip_state (team_id, state, updated_at)
    VALUES (${teamId}::uuid, ${JSON.stringify(normalized)}::jsonb, NOW())
    ON CONFLICT (team_id) DO UPDATE
    SET state = EXCLUDED.state, updated_at = NOW()
  `
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
  }
}
