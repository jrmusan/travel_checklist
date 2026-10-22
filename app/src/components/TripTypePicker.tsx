import type { TripTypeDefinition, TripTypeId } from '../types'

interface TripTypePickerProps {
  types: TripTypeDefinition[]
  selectedId: TripTypeId
  onSelect: (id: TripTypeId) => void
}

export function TripTypePicker({ types, selectedId, onSelect }: TripTypePickerProps) {
  return (
    <div className="trip-type-picker" role="tablist" aria-label="Trip type">
      {types.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === selectedId}
          className={t.id === selectedId ? 'trip-type-chip active' : 'trip-type-chip'}
          onClick={() => onSelect(t.id)}
        >
          <span className="chip-icon" aria-hidden>
            {t.icon}
          </span>
          {t.name}
        </button>
      ))}
    </div>
  )
}
