import { useEffect, useRef } from 'react'
import { UiIcon } from './icons/UiIcon'

interface CheckAllProps {
  label: string
  packed: number
  total: number
  disabled?: boolean
  onChange: (checked: boolean) => void
}

/** Round header checkbox: checked when all items are packed, indeterminate when some are. */
export function CheckAll({ label, packed, total, disabled, onChange }: CheckAllProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const all = total > 0 && packed === total
  const partial = packed > 0 && !all

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = partial
  }, [partial])

  const state = all ? 'all' : partial ? 'partial' : 'none'

  return (
    <label className="check-all" data-state={state}>
      <input
        ref={inputRef}
        type="checkbox"
        className="visually-hidden"
        checked={all}
        disabled={disabled || total === 0}
        aria-label={`Mark all ${label} packed`}
        onChange={() => onChange(!all)}
      />
      <span className="check-circle" aria-hidden>
        {partial ? <span className="check-dash" /> : <UiIcon name="check" size={16} strokeWidth={3} />}
      </span>
    </label>
  )
}
