import nightCampfire from '../assets/scenes/night-campfire.webp'
import bannerLake from '../assets/scenes/banner-mountain-lake.webp'
import welcomeHero from '../assets/scenes/welcome-hero.webp'
import { ScreenHeader } from '../components/ScreenHeader'
import { UiIcon } from '../components/icons/UiIcon'
import type { ThemeName } from '../hooks/useTheme'

interface SettingsScreenProps {
  teamName: string
  theme: ThemeName
  onTheme: (theme: ThemeName) => void
  itemCount: number
  tripCount: number
  schemaVersion: number
  syncError: string | null
  onLogout: () => void
}

const THEME_CHOICES: { id: ThemeName; label: string; art: string; position: string }[] = [
  { id: 'forest', label: 'Forest', art: bannerLake, position: '20% 60%' },
  { id: 'sunset', label: 'Sunset', art: welcomeHero, position: '50% 45%' },
  { id: 'night', label: 'Night', art: nightCampfire, position: '70% 18%' },
]

export function SettingsScreen({
  teamName,
  theme,
  onTheme,
  itemCount,
  tripCount,
  schemaVersion,
  syncError,
  onLogout,
}: SettingsScreenProps) {
  return (
    <div className="screen screen--settings">
      <ScreenHeader title="Settings" />
      <div className="sheet-surface">
        <section className="card settings-card">
          <div className="team-row">
            <span className="avatar avatar--static" aria-hidden>
              <span>{teamName.trim().charAt(0).toUpperCase() || '⛺'}</span>
            </span>
            <div>
              <p className="team-name">{teamName}</p>
              <p className="team-meta">
                <UiIcon name="cloud" size={16} />
                {syncError ? 'Sync issue — changes kept on this device' : 'Synced with your trip team'}
              </p>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-label">Theme</h2>
          <div className="theme-grid" role="radiogroup" aria-label="Theme">
            {THEME_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={theme === choice.id}
                className="theme-option"
                onClick={() => onTheme(choice.id)}
              >
                <span className="theme-thumb">
                  <img
                    src={choice.art}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: choice.position }}
                  />
                  {theme === choice.id && (
                    <span className="theme-check" aria-hidden>
                      <UiIcon name="check" size={14} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="theme-label">{choice.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-label">Packing list</h2>
          <dl className="card stat-list">
            <div>
              <dt>Items in master list</dt>
              <dd>{itemCount}</dd>
            </div>
            <div>
              <dt>Trips logged</dt>
              <dd>{tripCount}</dd>
            </div>
            <div>
              <dt>Data schema</dt>
              <dd>v{schemaVersion}</dd>
            </div>
          </dl>
        </section>

        <button type="button" className="btn btn-outline btn-block btn-danger" onClick={onLogout}>
          <UiIcon name="logout" size={20} />
          Log out
        </button>
      </div>
    </div>
  )
}
