import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  emptyServerTripState,
  getTeamTripState,
  saveTeamTripState,
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
      const state = await getTeamTripState(session.teamId)
      return res.status(200).json({ state })
    } catch (err) {
      console.error('state GET error', err)
      return res.status(500).json({ error: 'Could not load team state.' })
    }
  }

  if (req.method === 'PUT') {
    const body = readJsonBody<{ state?: ServerTripState }>(req)
    if (!body?.state || typeof body.state !== 'object') {
      return res.status(400).json({ error: 'Missing state body.' })
    }

    try {
      await saveTeamTripState(session.teamId, body.state)
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('state PUT error', err)
      return res.status(500).json({ error: 'Could not save team state.' })
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT'])
}

export { emptyServerTripState }
