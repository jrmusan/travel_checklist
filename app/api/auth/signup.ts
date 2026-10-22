import bcrypt from 'bcryptjs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createTeam, findTeamByName } from '../_lib/db.js'
import { methodNotAllowed, readJsonBody } from '../_lib/http.js'
import { createSessionToken, sessionCookieHeader } from '../_lib/session.js'

interface SignupBody {
  teamName?: string
  password?: string
  confirmPassword?: string
}

const BCRYPT_ROUNDS = 12

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST'])
  }

  const body = readJsonBody<SignupBody>(req)
  const teamName = body?.teamName?.trim() ?? ''
  const password = body?.password ?? ''
  const confirmPassword = body?.confirmPassword ?? ''

  if (teamName.length < 2 || teamName.length > 64) {
    return res.status(400).json({ error: 'Team name must be 2–64 characters.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' })
  }

  try {
    const existing = await findTeamByName(teamName)
    if (existing) {
      return res.status(409).json({ error: 'That team name is already taken.' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const team = await createTeam(teamName, passwordHash)
    const token = await createSessionToken({ teamId: team.id, teamName: team.team_name })

    res.setHeader('Set-Cookie', sessionCookieHeader(token))
    return res.status(201).json({
      team: { id: team.id, name: team.team_name },
    })
  } catch (err) {
    console.error('signup error', err)
    const message = err instanceof Error ? err.message : 'Signup failed'
    if (message.includes('unique') || message.includes('duplicate')) {
      return res.status(409).json({ error: 'That team name is already taken.' })
    }
    return res.status(500).json({ error: 'Could not create account. Check database configuration.' })
  }
}
