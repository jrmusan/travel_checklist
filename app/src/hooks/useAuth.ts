import { useCallback, useEffect, useState } from 'react'
import { fetchMe, signIn, signOut, signUp, type TeamInfo } from '../api/client'

export function useAuth() {
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await fetchMe()
        if (!cancelled) setTeam(me)
      } catch {
        if (!cancelled) setTeam(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (teamName: string, password: string) => {
    setError(null)
    const info = await signIn(teamName, password)
    setTeam(info)
    return info
  }, [])

  const register = useCallback(
    async (teamName: string, password: string, confirmPassword: string) => {
      setError(null)
      const info = await signUp(teamName, password, confirmPassword)
      setTeam(info)
      return info
    },
    [],
  )

  const logout = useCallback(async () => {
    await signOut()
    setTeam(null)
  }, [])

  return { team, loading, error, setError, login, register, logout }
}
