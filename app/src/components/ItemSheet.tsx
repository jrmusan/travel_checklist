import { useEffect, useId, useState, type FormEvent } from 'react'
import { ITEM_LABEL_MAX } from '../store/catalog'
import type { MasterCategory } from '../types'
import { categoryLabel } from '../lib/catalog-art'
import { UiIcon } from './icons/UiIcon'

export interface ItemSheetValues {
  label: string
  categoryId: string
}

interface ItemSheetProps {
  mode: 'add' | 'edit'
  initial: ItemSheetValues
  categories: MasterCategory[]
  error?: string | null
  onSave: (values: ItemSheetValues) => void
  onClose: () => void
}

export function ItemSheet({ mode, initial, categories, error, onSave, onClose }: ItemSheetProps) {
  const titleId = useId()
  const [label, setLabel] = useState(initial.label)
  const [categoryId, setCategoryId] = useState(initial.categoryId)

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({ label, categoryId })
  }

  return (
    <div className="sheet-layer">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="sheet-grabber" aria-hidden />
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {mode === 'add' ? 'Add item' : 'Edit item'}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <UiIcon name="close" />
          </button>
        </div>
        <p className="sheet-lead">
          {mode === 'add'
            ? 'Saved to this trip type packing list — new trips get it too, unchecked.'
            : 'Rename it or move it to another category. Packed state stays put.'}
        </p>
        <form className="item-sheet-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Item name</span>
            <input
              name="itemLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Sunglasses"
              autoComplete="off"
              autoFocus
              required
              maxLength={ITEM_LABEL_MAX}
              aria-label="Item name"
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select
              name="itemCategory"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Category"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {categoryLabel(cat)}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="sheet-actions">
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              {mode === 'add' ? 'Add item' : 'Save'}
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ConfirmRemoveSheetProps {
  itemLabel: string
  categoryLabel: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmRemoveSheet({
  itemLabel,
  categoryLabel: catLabel,
  onConfirm,
  onClose,
}: ConfirmRemoveSheetProps) {
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

  return (
    <div className="sheet-layer">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="remove-item-title">
        <div className="sheet-grabber" aria-hidden />
        <div className="sheet-head">
          <h2 id="remove-item-title" className="sheet-title">
            Remove {itemLabel} from {catLabel}?
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <UiIcon name="close" />
          </button>
        </div>
        <p className="sheet-lead">
          Remove {itemLabel} from {catLabel}? It is dropped from this packing list and every trip.
        </p>
        <div className="sheet-actions">
          <button type="button" className="btn btn-primary btn-block btn-lg btn-danger-fill" onClick={onConfirm}>
            Remove
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={onClose}>
            Keep it
          </button>
        </div>
      </div>
    </div>
  )
}
