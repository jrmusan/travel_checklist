import { ProgressCard } from '../components/ProgressCard'
import { TripCard } from '../components/TripCard'
import { ArtIcon, type ArtName } from '../components/icons/ArtIcon'
import { UiIcon } from '../components/icons/UiIcon'
import { greeting, tripDisplayName, tripScheduleLabel } from '../lib/trips'
import type { TripInstance, TripTypeDefinition } from '../types'

interface HomeScreenProps {
  teamName: string
  tripType: TripTypeDefinition
  activeTrip: TripInstance | null
  packed: number
  total: number
  onOpenChecklist: () => void
  onOpenRemaining: () => void
  onOpenCategories: () => void
  onOpenTrips: () => void
  onOpenSearch: () => void
  onOpenSettings: () => void
  onStartTrip: () => void
  onEditTrip: () => void
}

export function HomeScreen({
  teamName,
  tripType,
  activeTrip,
  packed,
  total,
  onOpenChecklist,
  onOpenRemaining,
  onOpenCategories,
  onOpenTrips,
  onOpenSearch,
  onOpenSettings,
  onStartTrip,
  onEditTrip,
}: HomeScreenProps) {
  const remaining = total - packed
  const tiles: { label: string; art: ArtName; onClick: () => void; meta?: string }[] = [
    { label: 'Checklist', art: 'paper', onClick: onOpenChecklist },
    {
      label: 'Still to pack',
      art: 'backpack',
      onClick: onOpenRemaining,
      meta: activeTrip ? (remaining > 0 ? `${remaining} left` : 'Done') : undefined,
    },
    { label: 'Categories', art: 'tent', onClick: onOpenCategories },
    { label: 'Trips', art: 'compass', onClick: onOpenTrips },
    { label: 'Search', art: 'lantern', onClick: onOpenSearch },
    { label: 'Settings', art: 'mug', onClick: onOpenSettings },
  ]

  return (
    <div className="screen screen--home">
      <header className="home-header">
        <div className="home-greeting">
          <p className="home-hello">{greeting()},</p>
          <h1 className="home-name">{teamName}</h1>
          <p className="home-tagline">
            {activeTrip
              ? `${tripScheduleLabel(activeTrip)}`
              : 'Next adventure is calling!'}
          </p>
        </div>
        <button type="button" className="avatar" aria-label="Team settings" onClick={onOpenSettings}>
          <span>{teamName.trim().charAt(0).toUpperCase() || '⛺'}</span>
        </button>
      </header>

      <div className="home-hero">
        {activeTrip ? (
          <>
            <TripCard
              trip={activeTrip}
              title={tripDisplayName(activeTrip, tripType.name)}
              dates={tripScheduleLabel(activeTrip)}
              badge={<span className="chip chip--on-art">{tripType.name}</span>}
              onClick={onOpenChecklist}
            />
            <button
              type="button"
              className="trip-card-edit"
              aria-label="Edit trip name or dates"
              onClick={onEditTrip}
            >
              <UiIcon name="pencil" size={20} />
            </button>
          </>
        ) : (
          <TripCard trip={null} title="No trip underway" dates="Ready when you are">
            <button type="button" className="btn btn-primary trip-card-cta" onClick={onStartTrip}>
              <UiIcon name="plus" size={18} strokeWidth={2.4} />
              Start {tripType.name.toLowerCase()}
            </button>
          </TripCard>
        )}
      </div>

      <div className="sheet-surface">
        <ProgressCard packed={packed} total={total} idle={!activeTrip} />

        <div className="tile-grid tile-grid--actions">
          {tiles.map((t) => (
            <button key={t.label} type="button" className="tile" onClick={t.onClick}>
              <ArtIcon name={t.art} size={40} />
              <span className="tile-label">{t.label}</span>
              {t.meta && <span className="tile-meta">{t.meta}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
