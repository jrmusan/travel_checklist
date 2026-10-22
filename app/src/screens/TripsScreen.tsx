import { useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { TripCard } from '../components/TripCard'
import { ArtIcon } from '../components/icons/ArtIcon'
import { UiIcon } from '../components/icons/UiIcon'
import { percent, tripDateRange } from '../lib/trips'
import type { TripInstance, TripTypeDefinition } from '../types'

interface TripsScreenProps {
  trips: TripInstance[]
  tripTypes: TripTypeDefinition[]
  progressFor: (trip: TripInstance) => { packed: number; total: number }
  onOpenTrip: (trip: TripInstance) => void
  onNewTrip: () => void
}

type Tab = 'active' | 'past'

export function TripsScreen({ trips, tripTypes, progressFor, onOpenTrip, onNewTrip }: TripsScreenProps) {
  const [tab, setTab] = useState<Tab>('active')
  const typeName = (trip: TripInstance) =>
    tripTypes.find((t) => t.id === trip.tripTypeId)?.name ?? 'Trip'

  const active = trips.filter((t) => t.status === 'active')
  const past = trips
    .filter((t) => t.status === 'ended')
    .sort((a, b) => (b.endedAt ?? b.startedAt).localeCompare(a.endedAt ?? a.startedAt))
  const shown = tab === 'active' ? active : past

  return (
    <div className="screen screen--trips">
      <ScreenHeader
        title="Trips"
        action={
          <button type="button" className="btn btn-panel btn-sm" onClick={onNewTrip}>
            <UiIcon name="plus" size={18} strokeWidth={2.4} />
            New Trip
          </button>
        }
      >
        <div className="segmented segmented--panel" role="tablist" aria-label="Trip list">
          <button type="button" role="tab" aria-selected={tab === 'active'} onClick={() => setTab('active')}>
            Active
          </button>
          <button type="button" role="tab" aria-selected={tab === 'past'} onClick={() => setTab('past')}>
            Past
          </button>
        </div>
      </ScreenHeader>

      <div className="sheet-surface trip-list">
        {shown.length === 0 ? (
          <div className="empty-state">
            <ArtIcon name={tab === 'active' ? 'tent' : 'compass'} size={64} />
            <p>{tab === 'active' ? 'No trip underway yet.' : 'Finished trips will show up here.'}</p>
            {tab === 'active' && (
              <button type="button" className="btn btn-primary" onClick={onNewTrip}>
                Start a trip
              </button>
            )}
          </div>
        ) : (
          shown.map((trip) => {
            const { packed, total } = progressFor(trip)
            return (
              <TripCard
                key={trip.id}
                trip={trip}
                size="list"
                title={typeName(trip)}
                dates={tripDateRange(trip)}
                badge={
                  <span className="chip chip--on-art">
                    {packed}/{total} packed · {percent(packed, total)}%
                  </span>
                }
                onClick={trip.status === 'active' ? () => onOpenTrip(trip) : undefined}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
