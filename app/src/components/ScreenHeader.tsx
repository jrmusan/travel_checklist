import type { ReactNode } from 'react'
import { UiIcon } from './icons/UiIcon'

interface ScreenHeaderProps {
  title: string
  subtitle?: ReactNode
  onBack?: () => void
  action?: ReactNode
  children?: ReactNode
}

/** Deep-forest header panel; the cream sheet below overlaps its rounded bottom. */
export function ScreenHeader({ title, subtitle, onBack, action, children }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header-row">
        {onBack && (
          <button type="button" className="icon-btn icon-btn--panel" aria-label="Back" onClick={onBack}>
            <UiIcon name="back" />
          </button>
        )}
        <div className="screen-header-titles">
          <h1 className="screen-title">{title}</h1>
          {subtitle && <p className="screen-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </header>
  )
}
