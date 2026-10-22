import { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressBar } from '../components/ProgressCard'
import { CheckAll } from '../components/CheckAll'
import { ScreenHeader } from '../components/ScreenHeader'
import { ArtIcon } from '../components/icons/ArtIcon'
import { UiIcon } from '../components/icons/UiIcon'
import { useCategoryExpanded } from '../hooks/useCategoryExpanded'
import { categoryArt, categoryLabel, itemArt } from '../lib/catalog-art'
import { percent, tripDateRange, tripDayCount } from '../lib/trips'
import type { MasterCategory, MasterItem, PackFilter, TripInstance, TripTypeDefinition } from '../types'

interface ChecklistScreenProps {
  tripType: TripTypeDefinition
  activeTrip: TripInstance | null
  categories: MasterCategory[]
  items: MasterItem[]
  checkedIds: Set<string>
  onToggle: (itemId: string) => void
  onSetChecked: (itemIds: string[], checked: boolean) => void
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
  onBack,
  onStartTrip,
  packFilter,
  onPackFilter,
  categoryFilter,
  onCategoryFilter,
  focusSearch,
}: ChecklistScreenProps) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const disabled = !activeTrip

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories])
  const { isExpanded, toggleExpanded, expand } = useCategoryExpanded(categoryIds)

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
          if (packFilter === 'remaining' && checkedIds.has(item.id)) return false
          return true
        })
        const packedCount = all.filter((i) => checkedIds.has(i.id)).length
        return { cat, all, visible, total: all.length, packedCount, ...categoryArt(cat) }
      })
      .filter((s) => s.visible.length > 0)
  }, [categories, categoryFilter, itemsByCategory, normalizedQuery, packFilter, checkedIds])

  const total = items.length
  const packed = items.filter((i) => checkedIds.has(i.id)).length
  const pct = percent(packed, total)

  const subtitle = activeTrip
    ? `${tripDateRange(activeTrip)} · ${tripDayCount(activeTrip)} ${tripDayCount(activeTrip) === 1 ? 'day' : 'days'}`
    : 'No trip underway'

  return (
    <div className="screen screen--checklist">
      <ScreenHeader title={tripType.name} subtitle={subtitle} onBack={onBack}>
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
          sections.map(({ cat, all, visible, total: catTotal, packedCount, art }) => {
            const expanded = isExpanded(cat.id)
            const headerId = `category-header-${cat.id}`
            const panelId = `category-panel-${cat.id}`
            const complete = catTotal > 0 && packedCount === catTotal

            return (
              <section key={cat.id} className="card category-card">
                <h2 className="category-heading">
                  <CheckAll
                    label={categoryLabel(cat)}
                    packed={packedCount}
                    total={catTotal}
                    disabled={disabled}
                    onChange={(checked) => onSetChecked(all.map((i) => i.id), checked)}
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
                    <span className="category-name">{categoryLabel(cat)}</span>
                    <span
                      className={complete ? 'count-pill count-pill--done' : 'count-pill'}
                      aria-label={`${packedCount} of ${catTotal} packed`}
                    >
                      {packedCount}/{catTotal}
                    </span>
                    <UiIcon name="chevronDown" size={20} className="category-chevron" />
                  </button>
                </h2>
                {expanded && (
                  <ul id={panelId} role="region" aria-labelledby={headerId} className="item-list">
                    {visible.map((item) => {
                      const checked = checkedIds.has(item.id)
                      return (
                        <li key={item.id}>
                          <label className={checked ? 'item-row is-checked' : 'item-row'}>
                            <input
                              type="checkbox"
                              className="visually-hidden"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => onToggle(item.id)}
                            />
                            <span className="check-circle" aria-hidden>
                              <UiIcon name="check" size={16} strokeWidth={3} />
                            </span>
                            <span className="item-art" aria-hidden>
                              <ArtIcon name={itemArt(item, art)} size={24} />
                            </span>
                            <span className="item-label">{item.label}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
