import { SignJWT, jwtVerify } from 'jose'
import type { VercelRequest } from '@vercel/node'
import { requireEnv } from './http.js'

const COOKIE_NAME = 'tc_session'
const MAX_AGE_SEC = 60 * 60 * 24 * 30

function secretKey() {
  return new TextEncoder().encode(requireEnv('SESSION_SECRET'))
}

export interface SessionPayload {
  teamId: string
  teamName: string
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ teamId: payload.teamId, teamName: payload.teamName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey())
}

export function sessionCookieHeader(token: string): string {
  const secure =
    process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${MAX_AGE_SEC}`,
  ]
  if (secure) {
    parts.push('Secure')
  }
  return parts.join('; ')
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

function parseCookie(req: VercelRequest): string | null {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(`${COOKIE_NAME}=`)) {
      return trimmed.slice(COOKIE_NAME.length + 1)
    }
  }
  return null
}

export async function verifySession(req: VercelRequest): Promise<SessionPayload | null> {
  const token = parseCookie(req)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    const teamId = payload.teamId
    const teamName = payload.teamName
    if (typeof teamId !== 'string' || typeof teamName !== 'string') {
      return null
    }
    return { teamId, teamName }
  } catch {
    return null
  }
}
