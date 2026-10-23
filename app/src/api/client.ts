export interface TeamInfo {
  id: string
  name: string
}

export interface ServerTripStatePayload {
  schemaVersion: number
  trips: import('../types').TripInstance[]
  activeTripId: string | null
  progressByTripId: Record<string, import('../types').TripProgress>
  /** Team catalog; omitted on first load so the client seeds from markdown. */
  catalog?: import('../types').MasterPool
  removedItemIds?: string[]
}

export interface TeamStateEnvelope {
  state: ServerTripStatePayload
  updatedAt: string | null
}

export class ConcurrentStateError extends Error {
  readonly status = 409
  readonly retry = true
  constructor(message = 'Could not save team state (concurrent writes).') {
    super(message)
    this.name = 'ConcurrentStateError'
  }
}

export function isConcurrentStateError(err: unknown): boolean {
  if (err instanceof ConcurrentStateError) return true
  if (!(err instanceof Error)) return false
  return err.name === 'ConcurrentStateError' || /concurrent writes/i.test(err.message)
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string; retry?: boolean }
  if (res.status === 409 || data.retry) {
    throw new ConcurrentStateError(data.error)
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }
  return data
}

const jsonHeaders = { 'Content-Type': 'application/json' }

export async function fetchMe(): Promise<TeamInfo | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  const data = await parseJson<{ team: TeamInfo }>(res)
  return data.team
}

export async function signIn(teamName: string, password: string): Promise<TeamInfo> {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ teamName, password }),
  })
  const data = await parseJson<{ team: TeamInfo }>(res)
  return data.team
}

export async function signUp(
  teamName: string,
  password: string,
  confirmPassword: string,
): Promise<TeamInfo> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ teamName, password, confirmPassword }),
  })
  const data = await parseJson<{ team: TeamInfo }>(res)
  return data.team
}

export async function signOut(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  await parseJson<{ ok: boolean }>(res)
}

export async function fetchTeamState(): Promise<TeamStateEnvelope> {
  const res = await fetch('/api/state', { credentials: 'include' })
  const data = await parseJson<{ state: ServerTripStatePayload; updatedAt?: string | null }>(res)
  return { state: data.state, updatedAt: data.updatedAt ?? null }
}

export async function saveTeamState(
  state: ServerTripStatePayload,
  opts?: { keepalive?: boolean; base?: ServerTripStatePayload },
): Promise<TeamStateEnvelope | void> {
  const res = await fetch('/api/state', {
    method: 'PUT',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ state, base: opts?.base, baseUpdatedAt: undefined }),
    keepalive: Boolean(opts?.keepalive),
  })
  try {
    const data = await parseJson<{ ok: boolean; state?: ServerTripStatePayload; updatedAt?: string | null }>(
      res,
    )
    return { state: data.state ?? state, updatedAt: data.updatedAt ?? null }
  } catch (err) {
    if (opts?.keepalive) return
    throw err
  }
}
