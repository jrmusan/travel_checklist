import { UiIcon } from './icons/UiIcon'

interface RefreshButtonProps {
  onClick: () => void
  busy?: boolean
  variant?: 'panel' | 'home'
}

export function RefreshButton({ onClick, busy, variant = 'panel' }: RefreshButtonProps) {
  return (
    <button
      type="button"
      className={
        variant === 'home'
          ? 'icon-btn icon-btn--panel home-refresh'
          : 'icon-btn icon-btn--panel'
      }
      aria-label="Refresh list"
      aria-busy={busy ? true : undefined}
      disabled={busy}
      onClick={onClick}
    >
      <UiIcon name="refresh" className={busy ? 'is-spinning' : undefined} />
    </button>
  )
}
