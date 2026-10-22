import type { View } from '../lib/views'
import { UiIcon, type UiIconName } from './icons/UiIcon'

interface BottomNavProps {
  view: View
  onNavigate: (view: View) => void
  onPlus: () => void
  plusLabel: string
}

const LEFT: [View, string, UiIconName][] = [
  ['home', 'Home', 'home'],
  ['checklist', 'Checklist', 'list'],
]
const RIGHT: [View, string, UiIconName][] = [
  ['trips', 'Trips', 'map'],
  ['settings', 'More', 'more'],
]

export function BottomNav({ view, onNavigate, onPlus, plusLabel }: BottomNavProps) {
  const active: View = view === 'categories' ? 'checklist' : view

  const tab = ([id, label, icon]: [View, string, UiIconName]) => (
    <button
      key={id}
      type="button"
      className="tab"
      aria-current={active === id ? 'page' : undefined}
      onClick={() => onNavigate(id)}
    >
      <UiIcon name={icon} size={24} />
      <span>{label}</span>
    </button>
  )

  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav-inner">
        {LEFT.map(tab)}
        <div className="tab-plus-slot">
          <button type="button" className="tab-plus" aria-label={plusLabel} onClick={onPlus}>
            <UiIcon name="plus" size={28} strokeWidth={2.4} />
          </button>
        </div>
        {RIGHT.map(tab)}
      </div>
    </nav>
  )
}
