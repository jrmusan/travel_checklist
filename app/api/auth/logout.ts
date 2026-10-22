import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed } from '../_lib/http.js'
import { clearSessionCookieHeader } from '../_lib/session.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST'])
  }

  res.setHeader('Set-Cookie', clearSessionCookieHeader())
  return res.status(200).json({ ok: true })
}
