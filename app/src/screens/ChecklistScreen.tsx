import { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressBar } from '../components/ProgressCard'
import { CheckAll } from '../components/CheckAll'
import { ConfirmRemoveSheet, ItemSheet } from '../components/ItemSheet'
import { ScreenHeader } from '../components/ScreenHeader'
import { ArtIcon } from '../components/icons/ArtIcon'
import { UiIcon } from '../components/icons/UiIcon'
import { useAutoCollapseOnComplete, useCategoryExpanded } from '../hooks/useCategoryExpanded'
import { categoryArt, categoryLabel, itemArt } from '../lib/catalog-art'
import { percent, tripDisplayName, tripScheduleLabel } from '../lib/trips'
import type { MasterCategory, MasterItem, PackFilter, TripInstance, TripTypeDefinition } from '../types'

interface ChecklistScreenProps {
  tripType: TripTypeDefinition
  activeTrip: TripInstance | null
  categories: MasterCategory[]
  items: MasterItem[]
  checkedIds: Set<string>
  onToggle: (itemId: string) => void
  onSetChecked: (itemIds: string[], checked: boolean) => void
  onAddItem: (input: { categoryId: string; label: string }) => string | null
  onUpdateItem: (itemId: string, input: { label: string; categoryId: string }) => string | null
  onRemoveItem: (itemId: string) => void
  onBack: () => void
  onStartTrip: () => void
  packFilter: PackFilter
  onPackFilter: (filter: PackFilter) => void
  categoryFilter: string | null
  onCategoryFilter: (categoryId: string | null) => void
  focusSearch: boolean
}

export function ChecklistScreen({
  tripType,
  activeTrip,
  categories,
  items,
  checkedIds,
  onToggle,
  onSetChecked,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onBack,
  onStartTrip,
  packFilter,
  onPackFilter,
  categoryFilter,
  onCategoryFilter,
  focusSearch,
}: ChecklistScreenProps) {
  const [query, setQuery] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [itemSheet, setItemSheet] = useState<
    | { mode: 'add'; categoryId: string }
    | { mode: 'edit'; itemId: string }
    | null
  >(null)
  const [removeItem, setRemoveItem] = useState<MasterItem | null>(null)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const disabled = !activeTrip

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories])
  const {
    expandedById,
    isExpanded,
    toggleExpanded,
    expand,
    scheduleCollapse,
    cancelScheduledCollapse,
  } = useCategoryExpanded(categoryIds)

  useEffect(() => {
    if (focusSearch) searchRef.current?.focus()
  }, [focusSearch])

  useEffect(() => {
    if (categoryFilter) expand(categoryFilter)
  }, [categoryFilter, expand])

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MasterItem[]>()
    for (const item of items) {
      const list = map.get(item.categoryId) ?? []
      list.push(item)
      map.set(item.categoryId, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order)
    }
    return map
  }, [items])

  const normalizedQuery = query.trim().toLowerCase()

  const sections = useMemo(() => {
    return categories
      .filter((cat) => !categoryFilter || cat.id === categoryFilter)
      .map((cat) => {
        const all = itemsByCategory.get(cat.id) ?? []
        const visible = all.filter((item) => {
          if (normalizedQuery && !item.label.toLowerCase().includes(normalizedQuery)) return false
          // Only "Still to pack" may hide checked items. All + category chips keep them.
          if (packFilter === 'remaining' && checkedIds.has(item.id)) return false
          return true
        })
        const listed = packFilter === 'remaining' ? visible : all.filter((item) => {
          if (normalizedQuery && !item.label.toLowerCase().includes(normalizedQuery)) return false
          return true
        })
        const packedCount = all.filter((i) => checkedIds.has(i.id)).length
        return { cat, all, visible, listed, total: all.length, packedCount, ...categoryArt(cat) }
      })
      .filter((s) => {
        if (normalizedQuery || packFilter === 'remaining') return s.visible.length > 0
        return true
      })
  }, [categories, categoryFilter, itemsByCategory, normalizedQuery, packFilter, checkedIds])

  const completions = useMemo(
    () =>
      categories.map((cat) => {
        const all = itemsByCategory.get(cat.id) ?? []
        const packedCount = all.filter((i) => checkedIds.has(i.id)).length
        return { id: cat.id, complete: all.length > 0 && packedCount === all.length }
      }),
    [categories, itemsByCategory, checkedIds],
  )

  useAutoCollapseOnComplete(
    activeTrip?.id ?? 'none',
    completions,
    expandedById,
    scheduleCollapse,
    cancelScheduledCollapse,
  )

  const total = items.length
  const packed = items.filter((i) => checkedIds.has(i.id)).length
  const pct = percent(packed, total)

  const subtitle = activeTrip ? tripScheduleLabel(activeTrip) : 'No trip underway'
  const heading = activeTrip ? tripDisplayName(activeTrip, tripType.name) : tripType.name

  return (
    <div className="screen screen--checklist">
      <ScreenHeader title={heading} subtitle={subtitle} onBack={onBack}>
        <div className="header-progress">
          <ProgressBar pct={activeTrip ? pct : 0} tone="light" />
          <span>{activeTrip ? `${packed} / ${total}` : `${total} items`}</span>
        </div>
        <label className="search-pill">
          <UiIcon name="search" size={18} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search items…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search checklist items"
            enterKeyHint="search"
          />
        </label>

        <div className="chip-row" role="toolbar" aria-label="Checklist filters">
          <button
            type="button"
            className="chip"
            aria-pressed={packFilter === 'all' && !categoryFilter}
            onClick={() => {
              onPackFilter('all')
              onCategoryFilter(null)
            }}
          >
            All
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={packFilter === 'remaining'}
            onClick={() => onPackFilter(packFilter === 'remaining' ? 'all' : 'remaining')}
          >
            Still to pack
            {activeTrip && <span className="chip-count">{total - packed}</span>}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="chip"
              aria-pressed={categoryFilter === cat.id}
              onClick={() => onCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </ScreenHeader>

      <div className="sheet-surface sheet-surface--list">
        {disabled && (
          <div className="card notice-card">
            <ArtIcon name="tent" size={44} />
            <div>
              <p className="notice-title">No trip underway</p>
              <p className="notice-text">Start a trip to check items off for this packing run.</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={onStartTrip}>
              Start
            </button>
          </div>
        )}

        {sections.length === 0 ? (
          <div className="empty-state">
            <ArtIcon name={packFilter === 'remaining' && !normalizedQuery ? 'tent' : 'compass'} size={64} />
            <p>
              {packFilter === 'remaining' && !normalizedQuery
                ? 'Everything here is packed!'
                : 'No items match your search.'}
            </p>
          </div>
        ) : (
          sections.map(({ cat, all, listed, total: catTotal, packedCount, art }) => {
            const expanded = isExpanded(cat.id)
            const editing = editingCategoryId === cat.id
            const headerId = `category-header-${cat.id}`
            const panelId = `category-panel-${cat.id}`
            const complete = catTotal > 0 && packedCount === catTotal
            const catName = categoryLabel(cat)

            return (
              <section
                key={cat.id}
                className={[
                  'card category-card',
                  complete ? 'is-complete' : '',
                  editing ? 'is-editing' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-complete={complete ? 'true' : 'false'}
                data-editing={editing ? 'true' : 'false'}
                data-category-id={cat.id}
              >
                <h2 className="category-heading">
                  <CheckAll
                    label={catName}
                    packed={packedCount}
                    total={catTotal}
                    disabled={disabled}
                    onChange={(checked) => {
                      onSetChecked(all.map((i) => i.id), checked)
                      if (checked) onPackFilter('all')
                    }}
                  />
                  <button
                    type="button"
                    className="category-toggle"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    id={headerId}
                    onClick={() => toggleExpanded(cat.id)}
                  >
                    <ArtIcon name={art} size={30} className="category-art" />
                    <span className="category-name">{catName}</span>
                    <span
                      className={complete ? 'count-pill count-pill--done' : 'count-pill'}
                      aria-label={`${packedCount} of ${catTotal} packed`}
                    >
                      {packedCount}/{catTotal}
                    </span>
                    <UiIcon name="chevronDown" size={20} className="category-chevron" />
                  </button>
                  <button
                    type="button"
                    className={editing ? 'icon-btn category-edit is-on' : 'icon-btn category-edit'}
                    aria-pressed={editing}
                    aria-label={editing ? `Done editing ${catName}` : `Edit ${catName}`}
                    onClick={() => {
                      if (editing) {
                        setEditingCategoryId(null)
                        return
                      }
                      setEditingCategoryId(cat.id)
                      if (!isExpanded(cat.id)) expand(cat.id)
                    }}
                  >
                    <UiIcon name={editing ? 'check' : 'pencil'} size={20} />
                  </button>
                </h2>
                <div
                  className={expanded ? 'category-panel is-open' : 'category-panel'}
                  data-expanded={expanded ? 'true' : 'false'}
                >
                  <div className="category-panel-inner" inert={!expanded || undefined}>
                    <ul
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      aria-hidden={!expanded}
                      className="item-list"
                      data-listed-count={listed.length}
                    >
                      {listed.map((item) => {
                        const checked = checkedIds.has(item.id)
                        return (
                          <li key={item.id} data-item-id={item.id}>
                            <div className={checked ? 'item-row-wrap is-checked' : 'item-row-wrap'}>
                              <label className={checked ? 'item-row is-checked' : 'item-row'}>
                                <input
                                  type="checkbox"
                                  className="visually-hidden"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => {
                                    const willCheck = !checked
                                    onToggle(item.id)
                                    if (willCheck && packedCount + 1 === catTotal) onPackFilter('all')
                                  }}
                                  tabIndex={expanded ? 0 : -1}
                                />
                                <span className="check-circle" aria-hidden>
                                  <UiIcon name="check" size={16} strokeWidth={3} />
                                </span>
                                <span className="item-art" aria-hidden>
                                  <ArtIcon name={itemArt(item, art)} size={24} />
                                </span>
                                <span className="item-label">{item.label}</span>
                              </label>
                              {editing && (
                                <div className="item-row-actions">
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    aria-label={`Edit ${item.label}`}
                                    onClick={() => {
                                      setSheetError(null)
                                      setItemSheet({ mode: 'edit', itemId: item.id })
                                    }}
                                  >
                                    <UiIcon name="pencil" size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn item-delete"
                                    aria-label={`Remove ${item.label}`}
                                    onClick={() => setRemoveItem(item)}
                                  >
                                    <UiIcon name="trash" size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                    <button
                      type="button"
                      className="add-item-btn"
                      onClick={() => {
                        setSheetError(null)
                        setItemSheet({ mode: 'add', categoryId: cat.id })
                      }}
                    >
                      <UiIcon name="plus" size={18} strokeWidth={2.4} />
                      Add item
                    </button>
                  </div>
                </div>
              </section>
            )
          })
        )}
      </div>

      {itemSheet && (
        <ItemSheet
          mode={itemSheet.mode}
          initial={
            itemSheet.mode === 'add'
              ? { label: '', categoryId: itemSheet.categoryId }
              : {
                  label: items.find((i) => i.id === itemSheet.itemId)?.label ?? '',
                  categoryId: items.find((i) => i.id === itemSheet.itemId)?.categoryId ?? categories[0]?.id ?? '',
                }
          }
          categories={categories}
          error={sheetError}
          onClose={() => {
            setItemSheet(null)
            setSheetError(null)
          }}
          onSave={(values) => {
            const error =
              itemSheet.mode === 'add'
                ? onAddItem({ categoryId: values.categoryId, label: values.label })
                : onUpdateItem(itemSheet.itemId, values)
            if (error) {
              setSheetError(error)
              return
            }
            if (itemSheet.mode === 'add') {
              setEditingCategoryId(values.categoryId)
              expand(values.categoryId)
            }
            setItemSheet(null)
            setSheetError(null)
          }}
        />
      )}

      {removeItem && (
        <ConfirmRemoveSheet
          itemLabel={removeItem.label}
          categoryLabel={(() => {
            const cat = categories.find((c) => c.id === removeItem.categoryId)
            return cat ? categoryLabel(cat) : 'this list'
          })()}
          onClose={() => setRemoveItem(null)}
          onConfirm={() => {
            onRemoveItem(removeItem.id)
            setRemoveItem(null)
          }}
        />
      )}
    </div>
  )
}
