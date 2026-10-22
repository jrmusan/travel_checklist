interface ProgressHeaderProps {
  packed: number
  total: number
}

export function ProgressHeader({ packed, total }: ProgressHeaderProps) {
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100)

  return (
    <div className="progress-header">
      <div className="progress-labels">
        <span>{packed} packed</span>
        <span>{total - packed} to go</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-pct">{pct}% packed</p>
    </div>
  )
}
