import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  ConcurrentStateError,
  emptyServerTripState,
  getTeamTripStateRow,
  saveMergedTeamTripState,
  type ServerTripState,
} from './_lib/db.js'
import { methodNotAllowed, readJsonBody } from './_lib/http.js'
import { verifySession } from './_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await verifySession(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method === 'GET') {
    try {
      const row = await getTeamTripStateRow(session.teamId)
      return res.status(200).json({ state: row.state, updatedAt: row.updatedAt })
    } catch (err) {
      console.error('state GET error', err)
      return res.status(500).json({ error: 'Could not load team data.' })
    }
  }

  if (req.method === 'PUT') {
    const body = readJsonBody<{ state?: ServerTripState; base?: ServerTripState }>(req)
    if (!body?.state || typeof body.state !== 'object') {
      return res.status(400).json({ error: 'Missing state body.' })
    }

    try {
      const row = await saveMergedTeamTripState(
        session.teamId,
        body.state,
        body.base && typeof body.base === 'object' ? body.base : undefined,
      )
      return res.status(200).json({ ok: true, state: row.state, updatedAt: row.updatedAt })
    } catch (err) {
      if (err instanceof ConcurrentStateError) {
        return res.status(409).json({ error: err.message, retry: true })
      }
      console.error('state PUT error', err)
      return res.status(500).json({ error: 'Could not save team state.' })
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT'])
}

export { emptyServerTripState }
