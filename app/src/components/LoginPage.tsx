import { useState, type FormEvent } from 'react'
import welcomeHero from '../assets/scenes/welcome-hero.webp'
import { UiIcon } from './icons/UiIcon'

type AuthMode = 'signin' | 'signup'

interface LoginPageProps {
  onSignIn: (teamName: string, password: string) => Promise<void>
  onSignUp: (teamName: string, password: string, confirmPassword: string) => Promise<void>
  error: string | null
  onClearError: () => void
}

export function LoginPage({ onSignIn, onSignUp, error, onClearError }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError ?? error

  function openMode(next: AuthMode | null) {
    setMode(next)
    setLocalError(null)
    onClearError()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    onClearError()
    setBusy(true)
    try {
      if (mode === 'signup') {
        await onSignUp(teamName, password, confirmPassword)
      } else {
        await onSignIn(teamName, password)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={mode ? 'welcome welcome--form' : 'welcome'}>
      <div className="welcome-hero">
        <img
          className="welcome-art"
          src={welcomeHero}
          alt=""
          width={720}
          height={1280}
          fetchPriority="high"
          decoding="async"
        />
        <div className="welcome-brand">
          <h1 className="wordmark">CampList</h1>
          <p className="welcome-tagline">
            Pack less worry,
            <br />
            more adventure.
          </p>
        </div>
      </div>

      {!mode ? (
        <div className="welcome-actions">
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => openMode('signup')}>
            Get Started
          </button>
          <button type="button" className="btn btn-ghost-light btn-block" onClick={() => openMode('signin')}>
            Sign In
          </button>
        </div>
      ) : (
        <section className="auth-sheet" aria-labelledby="auth-title">
          <div className="auth-sheet-head">
            <button
              type="button"
              className="icon-btn"
              aria-label="Back"
              onClick={() => openMode(null)}
            >
              <UiIcon name="back" />
            </button>
            <div className="segmented" role="tablist" aria-label="Account mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => openMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => openMode('signup')}
              >
                Create account
              </button>
            </div>
          </div>

          <h2 id="auth-title" className="auth-title">
            {mode === 'signup' ? 'Start your trip team' : 'Welcome back, camper'}
          </h2>
          <p className="auth-lead">
            Your team shares one packing list — check items off together from any phone.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Trip team name</span>
              <input
                type="text"
                name="teamName"
                autoComplete="username"
                autoCapitalize="words"
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
                placeholder="At least 8 characters"
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
              <p className="form-error" role="alert">
                {displayError}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create team account'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
