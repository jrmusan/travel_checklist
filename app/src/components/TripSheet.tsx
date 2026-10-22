import { useEffect } from 'react'
import { tripDateRange } from '../lib/trips'
import type { TripInstance, TripTypeDefinition, TripTypeId } from '../types'
import { UiIcon } from './icons/UiIcon'

interface TripSheetProps {
  tripTypes: TripTypeDefinition[]
  selectedTypeId: TripTypeId
  onSelectType: (id: TripTypeId) => void
  activeTrip: TripInstance | null
  onStart: () => void
  onEnd: () => void
  onStartNext: () => void
  onClose: () => void
}

export function TripSheet({
  tripTypes,
  selectedTypeId,
  onSelectType,
  activeTrip,
  onStart,
  onEnd,
  onStartNext,
  onClose,
}: TripSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const selected = tripTypes.find((t) => t.id === selectedTypeId)

  return (
    <div className="sheet-layer">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="trip-sheet-title">
        <div className="sheet-grabber" aria-hidden />
        <div className="sheet-head">
          <h2 id="trip-sheet-title" className="sheet-title">
            {activeTrip ? 'Trip in progress' : 'Start a new trip'}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <UiIcon name="close" />
          </button>
        </div>

        {activeTrip ? (
          <p className="sheet-lead">
            {selected?.name} · {tripDateRange(activeTrip)}. Ending the trip keeps its history; starting
            fresh unchecks everything for the next run.
          </p>
        ) : (
          <p className="sheet-lead">Pick a trip type. Every item starts unchecked.</p>
        )}

        <div className="type-list" role="radiogroup" aria-label="Trip type">
          {tripTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={t.id === selectedTypeId}
              className="type-option"
              onClick={() => onSelectType(t.id)}
            >
              <span className="type-option-icon" aria-hidden>
                {t.icon}
              </span>
              <span className="type-option-text">
                <strong>{t.name}</strong>
                <small>{t.description}</small>
              </span>
              <span className="check-dot" aria-hidden>
                {t.id === selectedTypeId && <UiIcon name="check" size={16} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          {activeTrip ? (
            <>
              <button type="button" className="btn btn-primary btn-block btn-lg" onClick={onStartNext}>
                <UiIcon name="restart" size={20} />
                End &amp; start fresh
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={onEnd}>
                <UiIcon name="flag" size={20} />
                End trip
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={onStart}>
              <UiIcon name="plus" size={20} strokeWidth={2.4} />
              Start {selected?.name.toLowerCase() ?? 'trip'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
