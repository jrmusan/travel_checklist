/**
 * In-memory stand-in for the /api routes so `npm run dev` works without Postgres.
 * Same request/response shapes as api/; data resets when the process exits.
 *
 *   npm run mock-api   # port 3000, which the Vite dev proxy targets
 */
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { emptyTeamSlice, mergeTeamState } from '../shared/team-merge.mjs'

const PORT = Number(process.env.PORT ?? 3000)
const COOKIE = 'tc_mock_session'

const teams = new Map() // lowercased name -> { id, name, password }
const sessions = new Map() // token -> teamId
const states = new Map() // teamId -> { state, updatedAt }

const emptyState = () => ({ schemaVersion: 2, trips: [], activeTripId: null, progressByTripId: {} })

function nowIso() {
  return new Date().toISOString()
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function sessionTeam(req) {
  const match = (req.headers.cookie ?? '').match(new RegExp(`${COOKIE}=([^;]+)`))
  const teamId = match && sessions.get(match[1])
  return teamId ? [...teams.values()].find((t) => t.id === teamId) : null
}

function startSession(team) {
  const token = randomUUID()
  sessions.set(token, team.id)
  return { 'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax` }
}

function rowFor(teamId) {
  return states.get(teamId) ?? { state: emptyState(), updatedAt: null }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const route = `${req.method} ${url.pathname}`
  const team = sessionTeam(req)

  switch (route) {
    case 'GET /api/auth/me':
      return team
        ? send(res, 200, { team: { id: team.id, name: team.name } })
        : send(res, 401, { error: 'Not authenticated' })

    case 'POST /api/auth/signup': {
      const { teamName = '', password = '', confirmPassword = '' } = await readBody(req)
      const name = teamName.trim()
      if (name.length < 2 || name.length > 64) return send(res, 400, { error: 'Team name must be 2–64 characters.' })
      if (password.length < 8) return send(res, 400, { error: 'Password must be at least 8 characters.' })
      if (password !== confirmPassword) return send(res, 400, { error: 'Passwords do not match.' })
      if (teams.has(name.toLowerCase())) return send(res, 409, { error: 'That team name is already taken.' })
      const created = { id: randomUUID(), name, password }
      teams.set(name.toLowerCase(), created)
      states.set(created.id, { state: emptyState(), updatedAt: nowIso() })
      return send(res, 201, { team: { id: created.id, name } }, startSession(created))
    }

    case 'POST /api/auth/signin': {
      const { teamName = '', password = '' } = await readBody(req)
      const found = teams.get(teamName.trim().toLowerCase())
      if (!found || found.password !== password) {
        return send(res, 401, { error: 'Invalid team name or password.' })
      }
      return send(res, 200, { team: { id: found.id, name: found.name } }, startSession(found))
    }

    case 'POST /api/auth/logout':
      return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0` })

    case 'GET /api/state': {
      if (!team) return send(res, 401, { error: 'Not authenticated' })
      const row = rowFor(team.id)
      return send(res, 200, { state: row.state, updatedAt: row.updatedAt })
    }

    case 'PUT /api/state': {
      if (!team) return send(res, 401, { error: 'Not authenticated' })
      const { state, base } = await readBody(req)
      if (!state || typeof state !== 'object') return send(res, 400, { error: 'Missing state body.' })
      const current = rowFor(team.id)
      const merged = mergeTeamState(base ?? emptyTeamSlice(), state, current.state ?? emptyState())
      const updatedAt = nowIso()
      states.set(team.id, { state: merged, updatedAt })
      return send(res, 200, { ok: true, state: merged, updatedAt })
    }

    default:
      return send(res, 404, { error: 'Not found' })
  }
}).listen(PORT, () => {
  console.log(`Mock API on http://127.0.0.1:${PORT} (in-memory, no database)`)
})
