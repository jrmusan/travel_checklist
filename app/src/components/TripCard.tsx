import type { ReactNode } from 'react'
import { tripBanner } from '../lib/trips'
import type { TripInstance } from '../types'
import { UiIcon } from './icons/UiIcon'

interface TripCardProps {
  trip: TripInstance | null
  title: string
  dates?: string
  badge?: ReactNode
  onClick?: () => void
  size?: 'hero' | 'list'
  children?: ReactNode
}

/** Illustrated banner card used for the active-trip hero and the trips list. */
export function TripCard({ trip, title, dates, badge, onClick, size = 'hero', children }: TripCardProps) {
  const body = (
    <>
      <img
        className="trip-card-art"
        src={tripBanner(trip)}
        alt=""
        width={800}
        height={450}
        loading={size === 'hero' ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className="trip-card-scrim" />
      {badge && <div className="trip-card-badge">{badge}</div>}
      <div className="trip-card-body">
        <div className="trip-card-text">
          <h3 className="trip-card-title">{title}</h3>
          {dates && (
            <p className="trip-card-dates">
              <UiIcon name="calendar" size={16} />
              {dates}
            </p>
          )}
          {children}
        </div>
        {onClick && (
          <span className="trip-card-go" aria-hidden>
            <UiIcon name="chevronRight" size={20} />
          </span>
        )}
      </div>
    </>
  )

  const className = `trip-card trip-card--${size}`
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
