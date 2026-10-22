import { useCallback, useEffect, useMemo, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { CompleteScreen } from './components/CompleteScreen'
import { LoginPage } from './components/LoginPage'
import { TripSheet } from './components/TripSheet'
import { useAuth } from './hooks/useAuth'
import { useTeamPersistedState } from './hooks/useTeamPersistedState'
import { useTheme } from './hooks/useTheme'
import { tripProgress } from './lib/trips'
import { isView, type View } from './lib/views'
import { CategoriesScreen } from './screens/CategoriesScreen'
import { ChecklistScreen } from './screens/ChecklistScreen'
import { HomeScreen } from './screens/HomeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TripsScreen } from './screens/TripsScreen'
import { endTrip, itemsForTripType, startTrip, toggleItemChecked } from './store/trip-actions'
import { listTripTypes } from './trip-types/registry'
import type { PackFilter, TripInstance, TripTypeId } from './types'

function useHistoryView(): [View, (next: View) => void] {
  const [view, setView] = useState<View>(() =>
    isView(window.history.state?.view) ? window.history.state.view : 'home',
  )

  useEffect(() => {
    if (!isView(window.history.state?.view)) {
      window.history.replaceState({ view: 'home' }, '')
    }
    const onPop = (e: PopStateEvent) => setView(isView(e.state?.view) ? e.state.view : 'home')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: View) => {
    if (window.history.state?.view !== next) {
      window.history.pushState({ view: next }, '')
    }
    setView(next)
    window.scrollTo({ top: 0 })
  }, [])

  return [view, navigate]
}

function App() {
  const { theme, setTheme } = useTheme()
  const { team, loading: authLoading, error: authError, setError, login, register, logout } =
    useAuth()
  const tripTypes = listTripTypes()
  const [selectedTypeId, setSelectedTypeId] = useState<TripTypeId>(tripTypes[0]?.id ?? 'camper')
  const [state, update, hydrated, syncError] = useTeamPersistedState(team)

  const [view, navigate] = useHistoryView()
  const [packFilter, setPackFilter] = useState<PackFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [focusSearch, setFocusSearch] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showComplete, setShowComplete] = useState(false)

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

  const packed = items.filter((i) => checkedIds.has(i.id)).length

  const closeSheet = useCallback(() => setSheetOpen(false), [setSheetOpen])
  const closeComplete = useCallback(() => setShowComplete(false), [setShowComplete])

  if (authLoading) {
    return <Splash message="Loading checklist…" />
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
    return <Splash message="Loading team packing list…" />
  }

  const openChecklist = (opts: { pack?: PackFilter; category?: string | null; search?: boolean } = {}) => {
    setPackFilter(opts.pack ?? 'all')
    setCategoryFilter(opts.category ?? null)
    setFocusSearch(Boolean(opts.search))
    navigate('checklist')
  }

  const handleStart = () => {
    update((s) => startTrip(s, selectedTypeId))
    setSheetOpen(false)
    openChecklist()
  }

  const handleToggle = (itemId: string) => {
    if (!activeForSelected) return
    if (!checkedIds.has(itemId) && packed + 1 === items.length) {
      setShowComplete(true)
    }
    update((s) => toggleItemChecked(s, activeForSelected.id, itemId))
  }

  let screen
  switch (view) {
    case 'checklist':
      screen = (
        <ChecklistScreen
          tripType={selectedType}
          activeTrip={activeForSelected}
          categories={categories}
          items={items}
          checkedIds={checkedIds}
          onToggle={handleToggle}
          onBack={() => navigate('home')}
          onStartTrip={() => setSheetOpen(true)}
          packFilter={packFilter}
          onPackFilter={setPackFilter}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
          focusSearch={focusSearch}
        />
      )
      break
    case 'categories':
      screen = (
        <CategoriesScreen
          categories={categories}
          items={items}
          checkedIds={checkedIds}
          tracking={Boolean(activeForSelected)}
          onBack={() => navigate('home')}
          onOpenCategory={(id) => openChecklist({ category: id })}
        />
      )
      break
    case 'trips':
      screen = (
        <TripsScreen
          trips={state.trips}
          tripTypes={tripTypes}
          progressFor={(trip: TripInstance) =>
            tripProgress(state, trip, itemsForTripType(state, trip.tripTypeId).items)
          }
          onOpenTrip={(trip) => {
            setSelectedTypeId(trip.tripTypeId)
            openChecklist()
          }}
          onNewTrip={() => setSheetOpen(true)}
        />
      )
      break
    case 'settings':
      screen = (
        <SettingsScreen
          teamName={team.name}
          theme={theme}
          onTheme={setTheme}
          itemCount={items.length}
          tripCount={state.trips.length}
          schemaVersion={state.schemaVersion}
          syncError={syncError}
          onLogout={() => {
            navigate('home')
            void logout()
          }}
        />
      )
      break
    default:
      screen = (
        <HomeScreen
          teamName={team.name}
          tripType={selectedType}
          activeTrip={activeForSelected}
          packed={packed}
          total={items.length}
          onOpenChecklist={() => openChecklist()}
          onOpenRemaining={() => openChecklist({ pack: 'remaining' })}
          onOpenCategories={() => navigate('categories')}
          onOpenTrips={() => navigate('trips')}
          onOpenSearch={() => openChecklist({ search: true })}
          onOpenSettings={() => navigate('settings')}
          onStartTrip={() => setSheetOpen(true)}
        />
      )
  }

  return (
    <div className="app" data-trip-type={selectedTypeId}>
      {syncError && (
        <p className="sync-banner" role="status">
          Sync issue: {syncError}
        </p>
      )}

      <main className="app-main">{screen}</main>

      <BottomNav
        view={view}
        onNavigate={(next) => (next === 'checklist' ? openChecklist() : navigate(next))}
        onPlus={() => setSheetOpen(true)}
        plusLabel={activeForSelected ? 'Manage trip' : 'Start a trip'}
      />

      {sheetOpen && (
        <TripSheet
          tripTypes={tripTypes}
          selectedTypeId={selectedTypeId}
          onSelectType={setSelectedTypeId}
          activeTrip={activeForSelected}
          onStart={handleStart}
          onEnd={() => {
            if (activeForSelected) update((s) => endTrip(s, activeForSelected.id))
            setSheetOpen(false)
          }}
          onStartNext={() => {
            update((s) => {
              const ended = activeForSelected ? endTrip(s, activeForSelected.id) : s
              return startTrip(ended, selectedTypeId)
            })
            setSheetOpen(false)
            openChecklist()
          }}
          onClose={closeSheet}
        />
      )}

      {showComplete && (
        <CompleteScreen
          onView={closeComplete}
          onPlan={() => {
            setShowComplete(false)
            setSheetOpen(true)
          }}
        />
      )}
    </div>
  )
}

function Splash({ message }: { message: string }) {
  return (
    <div className="splash" role="status">
      <span className="wordmark wordmark--sm">CampList</span>
      <span className="splash-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <p>{message}</p>
    </div>
  )
}

export default App
