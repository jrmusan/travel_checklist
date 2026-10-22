import { useEffect, useRef } from 'react'
import nightCampfire from '../assets/scenes/night-campfire.webp'
import { UiIcon } from './icons/UiIcon'

interface CompleteScreenProps {
  onView: () => void
  onPlan: () => void
}

export function CompleteScreen({ onView, onPlan }: CompleteScreenProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onView()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onView])

  return (
    <div className="complete" role="dialog" aria-modal="true" aria-labelledby="complete-title">
      <img className="complete-art" src={nightCampfire} alt="" width={720} height={1280} decoding="async" />
      <div className="complete-body">
        <span className="complete-badge" aria-hidden>
          <UiIcon name="check" size={34} strokeWidth={2.6} />
        </span>
        <h2 id="complete-title" className="complete-title">
          Checklist Complete!
        </h2>
        <p className="complete-lead">You’re all set for adventure.</p>
        <div className="complete-actions">
          <button ref={primaryRef} type="button" className="btn btn-primary btn-block btn-lg" onClick={onView}>
            View Checklist
          </button>
          <button type="button" className="btn btn-ghost-light btn-block btn-lg" onClick={onPlan}>
            Plan Another Trip
          </button>
        </div>
      </div>
    </div>
  )
}
