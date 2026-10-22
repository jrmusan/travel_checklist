import { useState, type FormEvent } from 'react'

type AuthMode = 'signin' | 'signup'

interface LoginPageProps {
  onSignIn: (teamName: string, password: string) => Promise<void>
  onSignUp: (teamName: string, password: string, confirmPassword: string) => Promise<void>
  error: string | null
  onClearError: () => void
}

export function LoginPage({ onSignIn, onSignUp, error, onClearError }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError ?? error

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    onClearError()
    setBusy(true)
    try {
      if (mode === 'signin') {
        await onSignIn(teamName, password)
      } else {
        await onSignUp(teamName, password, confirmPassword)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <header className="auth-header">
          <p className="auth-kicker">
            <span aria-hidden>◆</span> Trail checklist
          </p>
          <h1>Sign in to your trip team</h1>
          <p className="auth-lead">
            Your team shares one packing list — check items off together across phones and browsers.
          </p>
        </header>

        <div className="auth-mode-toggle" role="tablist" aria-label="Account mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => {
              setMode('signin')
              setLocalError(null)
              onClearError()
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup')
              setLocalError(null)
              onClearError()
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Trip team name</span>
            <input
              type="text"
              name="teamName"
              autoComplete="username"
              placeholder="e.g. Redwood crew"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              minLength={2}
              maxLength={64}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>

          {mode === 'signup' && (
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
          )}

          {displayError && (
            <p className="auth-error" role="alert">
              {displayError}
            </p>
          )}

          <button type="submit" className="btn primary auth-submit" disabled={busy}>
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create team account'}
          </button>
        </form>
      </div>
    </div>
  )
}
