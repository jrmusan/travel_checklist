import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed } from '../_lib/http.js'
import { verifySession } from '../_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET'])
  }

  const session = await verifySession(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  return res.status(200).json({
    team: { id: session.teamId, name: session.teamName },
  })
}
