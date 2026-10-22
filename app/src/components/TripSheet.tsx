import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  DATE_INPUT_MAX,
  DATE_INPUT_MIN,
  TRIP_NAME_MAX,
  addDaysIso,
  defaultTripDates,
  formatDateLabel,
  inclusiveDays,
  tripDisplayName,
  tripScheduleLabel,
  validateTripPlan,
} from '../lib/trips'
import type { TripInstance, TripPlan, TripTypeDefinition, TripTypeId } from '../types'
import { UiIcon } from './icons/UiIcon'

interface TripSheetProps {
  tripTypes: TripTypeDefinition[]
  selectedTypeId: TripTypeId
  onSelectType: (id: TripTypeId) => void
  activeTrip: TripInstance | null
  typeName: string
  onStart: (plan: TripPlan) => void
  onUpdate: (plan: TripPlan) => void
  onEnd: () => void
  onStartNext: (plan: TripPlan) => void
  onClose: () => void
  /** When true, skip manage view and open the composer (hero edit / start next). */
  initialMode?: 'manage' | 'create' | 'edit' | 'next'
}

type SheetMode = 'manage' | 'create' | 'edit' | 'next'

function emptyForm(trip?: TripInstance | null) {
  const defaults = defaultTripDates()
  return {
    name: trip?.name ?? '',
    startDate: trip?.startDate ?? defaults.startDate,
    endDate: trip?.endDate ?? defaults.endDate,
  }
}

export function TripSheet({
  tripTypes,
  selectedTypeId,
  onSelectType,
  activeTrip,
  typeName,
  onStart,
  onUpdate,
  onEnd,
  onStartNext,
  onClose,
  initialMode,
}: TripSheetProps) {
  const [mode, setMode] = useState<SheetMode>(
    initialMode ?? (activeTrip ? 'manage' : 'create'),
  )
  const [form, setForm] = useState(() =>
    emptyForm(initialMode === 'edit' ? activeTrip : null),
  )
  const [error, setError] = useState<string | null>(null)

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
  const duration = useMemo(() => {
    try {
      return inclusiveDays(form.startDate, form.endDate)
    } catch {
      return 1
    }
  }, [form.startDate, form.endDate])

  function patch<K extends keyof typeof form>(key: K, value: string) {
    setError(null)
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'startDate' && next.endDate < value) next.endDate = value
      return next
    })
  }

  function setDays(daysRaw: string) {
    const days = Number(daysRaw)
    if (!Number.isFinite(days) || days < 1) return
    const endDate = addDaysIso(form.startDate, Math.min(366, Math.floor(days)) - 1)
    if (endDate) patch('endDate', endDate)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const plan = validateTripPlan(form)
    if (typeof plan === 'string') {
      setError(plan)
      return
    }
    if (mode === 'edit') onUpdate(plan)
    else if (mode === 'next') onStartNext(plan)
    else onStart(plan)
  }

  const title =
    mode === 'edit' ? 'Edit trip' : mode === 'manage' ? 'Trip in progress' : 'Start a new trip'

  return (
    <div className="sheet-layer">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="trip-sheet-title">
        <div className="sheet-grabber" aria-hidden />
        <div className="sheet-head">
          <h2 id="trip-sheet-title" className="sheet-title">
            {title}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <UiIcon name="close" />
          </button>
        </div>

        {mode === 'manage' && activeTrip ? (
          <>
            <p className="sheet-lead">
              {tripDisplayName(activeTrip, typeName)} · {tripScheduleLabel(activeTrip)}. Ending keeps
              this trip in history; a new one starts with a clean packing list.
            </p>
            <div className="sheet-actions">
              <button
                type="button"
                className="btn btn-primary btn-block btn-lg"
                onClick={() => {
                  setForm(emptyForm(activeTrip))
                  setError(null)
                  setMode('edit')
                }}
              >
                <UiIcon name="pencil" size={20} />
                Edit name or dates
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => {
                  setForm(emptyForm(null))
                  setError(null)
                  setMode('next')
                }}
              >
                <UiIcon name="restart" size={20} />
                End &amp; start fresh
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={onEnd}>
                <UiIcon name="flag" size={20} />
                End trip
              </button>
            </div>
          </>
        ) : (
          <form className="trip-plan-form" onSubmit={handleSubmit}>
            <p className="sheet-lead">
              {mode === 'next'
                ? 'Name the next trip. Packing starts unchecked.'
                : mode === 'edit'
                  ? 'Updates sync to everyone on the trip team.'
                  : 'Where are you going? Every item starts unchecked.'}
            </p>

            <label className="field">
              <span>Destination / trip name</span>
              <input
                name="tripName"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
                placeholder="e.g. Montana"
                autoComplete="off"
                autoCapitalize="words"
                autoFocus
                required
                maxLength={TRIP_NAME_MAX}
                aria-label="Destination"
              />
            </label>

            <div className="trip-date-grid">
              <label className="field">
                <span>Start</span>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  min={DATE_INPUT_MIN}
                  max={DATE_INPUT_MAX}
                  onChange={(e) => patch('startDate', e.target.value)}
                  required
                  aria-label="Start date"
                />
              </label>
              <label className="field">
                <span>End</span>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  min={form.startDate || DATE_INPUT_MIN}
                  max={DATE_INPUT_MAX}
                  onChange={(e) => patch('endDate', e.target.value)}
                  required
                  aria-label="End date"
                />
              </label>
            </div>

            <label className="field">
              <span>Length (days)</span>
              <input
                type="number"
                name="tripDays"
                inputMode="numeric"
                min={1}
                max={366}
                value={duration}
                onChange={(e) => setDays(e.target.value)}
                aria-label="Number of days"
              />
            </label>

            <p className="trip-duration-preview" aria-live="polite">
              {form.startDate && form.endDate
                ? durationPreview(form.startDate, form.endDate, duration)
                : 'Pick dates to see the trip length.'}
            </p>

            <div className="type-list" role="radiogroup" aria-label="Trip type">
              {tripTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={t.id === selectedTypeId}
                  className="type-option"
                  onClick={() => onSelectType(t.id)}
                  disabled={mode === 'edit'}
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

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="sheet-actions">
              <button type="submit" className="btn btn-primary btn-block btn-lg">
                <UiIcon name={mode === 'edit' ? 'check' : 'plus'} size={20} strokeWidth={2.4} />
                {mode === 'edit'
                  ? 'Save trip'
                  : `Start ${selected?.name.toLowerCase() ?? 'trip'}`}
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function durationPreview(start: string, end: string, days: number) {
  const a = formatDateLabel(start)
  const b = formatDateLabel(end)
  const range = a === b ? a : `${a} – ${b}`
  return `${range} · ${days} ${days === 1 ? 'day' : 'days'}`
}
