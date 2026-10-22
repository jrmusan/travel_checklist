import { percent } from '../lib/trips'

interface ProgressCardProps {
  packed: number
  total: number
  title?: string
  idle?: boolean
}

export function ProgressCard({ packed, total, title = 'Packing Progress', idle }: ProgressCardProps) {
  const pct = percent(packed, total)

  return (
    <div className="card progress-card">
      <div className="progress-card-top">
        <h2 className="card-title">{title}</h2>
        <span className="progress-pct">{idle ? '—' : `${pct}%`}</span>
      </div>
      <ProgressBar pct={idle ? 0 : pct} />
      <p className="progress-meta">
        {idle ? `Start a trip to pack ${total} items` : `${packed} / ${total} items`}
      </p>
    </div>
  )
}

export function ProgressBar({ pct, tone }: { pct: number; tone?: 'light' }) {
  return (
    <div
      className={tone === 'light' ? 'progress-track progress-track--light' : 'progress-track'}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Packing progress"
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
