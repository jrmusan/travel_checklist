import { useMemo, useState } from 'react'
import { HeaderArt } from './components/HeaderArt'
import { LoginPage } from './components/LoginPage'
import { PackView } from './components/PackView'
import { TripControls } from './components/TripControls'
import { TripTypePicker } from './components/TripTypePicker'
import { useAuth } from './hooks/useAuth'
import { useTeamPersistedState } from './hooks/useTeamPersistedState'
import { endTrip, itemsForTripType, startTrip, toggleItemChecked } from './store/trip-actions'
import { listTripTypes } from './trip-types/registry'
import type { TripTypeId } from './types'
import './App.css'

function App() {
  const { team, loading: authLoading, error: authError, setError, login, register, logout } =
    useAuth()
  const tripTypes = listTripTypes()
  const [selectedTypeId, setSelectedTypeId] = useState<TripTypeId>(tripTypes[0]?.id ?? 'camper')
  const [state, update, hydrated, syncError] = useTeamPersistedState(team)

  const selectedType = tripTypes.find((t) => t.id === selectedTypeId) ?? tripTypes[0]

  const activeTrip = useMemo(() => {
    if (!state.activeTripId) return null
    const trip = state.trips.find((t) => t.id === state.activeTripId)
    return trip?.status === 'active' ? trip : null
  }, [state.activeTripId, state.trips])

  const activeForSelected =
    activeTrip && activeTrip.tripTypeId === selectedTypeId ? activeTrip : null

  const { categories, items } = itemsForTripType(state, selectedTypeId)

  const checkedIds = useMemo(() => {
    if (!activeForSelected) return new Set<string>()
    const progress = state.progressByTripId[activeForSelected.id]
    return new Set(progress?.checkedItemIds ?? [])
  }, [activeForSelected, state.progressByTripId])

  if (authLoading) {
    return (
      <div className="app-shell loading">
        <p>Loading checklist…</p>
      </div>
    )
  }

  if (!team) {
    return (
      <LoginPage
        error={authError}
        onClearError={() => setError(null)}
        onSignIn={async (teamName, password) => {
          await login(teamName, password)
        }}
        onSignUp={async (teamName, password, confirmPassword) => {
          await register(teamName, password, confirmPassword)
        }}
      />
    )
  }

  if (!hydrated || !selectedType) {
    return (
      <div className="app-shell loading">
        <p>Loading team packing list…</p>
      </div>
    )
  }

  return (
    <div className="app-shell" data-trip-type={selectedTypeId}>
      <header className="app-header">
        <div className="header-brand">
          <HeaderArt />
          <div className="header-text">
            <h1>
              <span className="title-trail" aria-hidden>
                ◆
              </span>
              <span className="title-accent">Trail</span> checklist
            </h1>
            <p className="subtitle">{selectedType.description}</p>
          </div>
        </div>
        <div className="header-session">
          <p className="team-badge">
            Trip team: <strong>{team.name}</strong>
          </p>
          <button type="button" className="btn secondary btn-sm" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      {syncError && (
        <p className="sync-banner" role="status">
          Sync issue: {syncError}
        </p>
      )}

      <TripTypePicker
        types={tripTypes}
        selectedId={selectedTypeId}
        onSelect={setSelectedTypeId}
      />

      <TripControls
        tripType={selectedType}
        activeTrip={activeForSelected}
        onStart={() => update((s) => startTrip(s, selectedTypeId))}
        onEnd={() => {
          if (activeForSelected) {
            update((s) => endTrip(s, activeForSelected.id))
          }
        }}
        onStartNext={() => {
          update((s) => {
            const ended = activeForSelected ? endTrip(s, activeForSelected.id) : s
            return startTrip(ended, selectedTypeId)
          })
        }}
      />

      <PackView
        categories={categories}
        items={items}
        checkedIds={checkedIds}
        disabled={!activeForSelected}
        onToggle={(itemId) => {
          if (!activeForSelected) return
          update((s) => toggleItemChecked(s, activeForSelected.id, itemId))
        }}
      />

      <footer className="app-footer">
        <span>{items.length} items in master list</span>
        <span>Schema v{state.schemaVersion}</span>
      </footer>
    </div>
  )
}

export default App
