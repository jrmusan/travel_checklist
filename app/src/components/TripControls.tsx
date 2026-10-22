import type { TripInstance, TripTypeDefinition } from '../types'

interface TripControlsProps {
  tripType: TripTypeDefinition
  activeTrip: TripInstance | null
  onStart: () => void
  onEnd: () => void
  onStartNext: () => void
}

export function TripControls({
  tripType,
  activeTrip,
  onStart,
  onEnd,
  onStartNext,
}: TripControlsProps) {
  if (activeTrip) {
    const started = new Date(activeTrip.startedAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    return (
      <div className="trip-controls">
        <p className="trip-meta">
          Active {tripType.name.toLowerCase()} · started {started}
        </p>
        <div className="trip-actions">
          <button type="button" className="btn secondary" onClick={onEnd}>
            End trip
          </button>
          <button type="button" className="btn primary" onClick={onStartNext}>
            End &amp; start next
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="trip-controls">
      <p className="trip-meta">No active trip — start with everything unchecked.</p>
      <button type="button" className="btn primary" onClick={onStart}>
        Start {tripType.name.toLowerCase()}
      </button>
    </div>
  )
}
