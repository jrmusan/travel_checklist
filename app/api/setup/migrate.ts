import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runSchemaMigration } from '../_lib/migrate.js'
import { methodNotAllowed } from '../_lib/http.js'

/**
 * One-time / emergency schema apply. GET /api/setup/migrate?secret=…
 * Requires SETUP_SECRET env (same value as query param).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET'])
  }

  const expected = process.env.SETUP_SECRET
  if (!expected || expected.length < 16) {
    return res.status(503).json({
      error: 'Setup migration is disabled. Set SETUP_SECRET (≥16 chars) on the project.',
    })
  }

  const secret = typeof req.query.secret === 'string' ? req.query.secret : ''
  if (!secret || secret !== expected) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await runSchemaMigration()
    return res.status(200).json({ ok: true, message: 'Schema applied (idempotent).' })
  } catch (err) {
    console.error('setup migrate error', err)
    return res.status(500).json({ error: 'Migration failed. Check function logs and POSTGRES_URL.' })
  }
}
