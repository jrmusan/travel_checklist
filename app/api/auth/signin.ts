import bcrypt from 'bcryptjs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findTeamByName } from '../_lib/db.js'
import { methodNotAllowed, readJsonBody } from '../_lib/http.js'
import { createSessionToken, sessionCookieHeader } from '../_lib/session.js'

interface SigninBody {
  teamName?: string
  password?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST'])
  }

  const body = readJsonBody<SigninBody>(req)
  const teamName = body?.teamName?.trim() ?? ''
  const password = body?.password ?? ''

  if (!teamName || !password) {
    return res.status(400).json({ error: 'Team name and password are required.' })
  }

  try {
    const team = await findTeamByName(teamName)
    if (!team) {
      return res.status(401).json({ error: 'Invalid team name or password.' })
    }

    const ok = await bcrypt.compare(password, team.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid team name or password.' })
    }

    const token = await createSessionToken({ teamId: team.id, teamName: team.team_name })
    res.setHeader('Set-Cookie', sessionCookieHeader(token))
    return res.status(200).json({
      team: { id: team.id, name: team.team_name },
    })
  } catch (err) {
    console.error('signin error', err)
    return res.status(500).json({ error: 'Sign in failed. Check database configuration.' })
  }
}
