import { useMemo, useState } from 'react'
import type { MasterCategory, MasterItem, PackFilter } from '../types'
import { useCategoryExpanded } from '../hooks/useCategoryExpanded'
import { ProgressHeader } from './ProgressHeader'

interface PackViewProps {
  categories: MasterCategory[]
  items: MasterItem[]
  checkedIds: Set<string>
  onToggle: (itemId: string) => void
  disabled?: boolean
}

export function PackView({
  categories,
  items,
  checkedIds,
  onToggle,
  disabled,
}: PackViewProps) {
  const [filter, setFilter] = useState<PackFilter>('all')
  const [query, setQuery] = useState('')

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories])
  const { isExpanded, toggleExpanded } = useCategoryExpanded(categoryIds)

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

  const categorySections = useMemo(() => {
    return categories.map((cat) => {
      const allCatItems = itemsByCategory.get(cat.id) ?? []
      const catItems = allCatItems.filter((item) => {
        if (normalizedQuery && !item.label.toLowerCase().includes(normalizedQuery)) {
          return false
        }
        const packed = checkedIds.has(item.id)
        if (filter === 'remaining' && packed) {
          return false
        }
        return true
      })
      const packedCount = allCatItems.filter((i) => checkedIds.has(i.id)).length
      return { cat, catItems, totalInCategory: allCatItems.length, packedCount }
    })
  }, [categories, itemsByCategory, normalizedQuery, filter, checkedIds])

  const visibleCategories = categorySections.filter(({ catItems }) => catItems.length > 0)

  const total = items.length
  const packed = items.filter((i) => checkedIds.has(i.id)).length

  return (
    <div className="pack-view">
      <ProgressHeader packed={packed} total={total} />

      <div className="pack-toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search checklist items"
        />
        <div className="filter-toggle" role="group" aria-label="List filter">
          <button
            type="button"
            className={filter === 'remaining' ? 'active' : ''}
            onClick={() => setFilter('remaining')}
          >
            Still to pack
          </button>
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Full list
          </button>
        </div>
      </div>

      {disabled && (
        <p className="pack-hint">Start a trip to check items off for this packing run.</p>
      )}

      <div className="category-list">
        {visibleCategories.length === 0 ? (
          <p className="empty-state">
            {filter === 'remaining' && !normalizedQuery
              ? '🎉 Everything is packed!'
              : 'No items match your search.'}
          </p>
        ) : (
          visibleCategories.map(({ cat, catItems, totalInCategory, packedCount }) => {
            const expanded = isExpanded(cat.id)
            const headerId = `category-header-${cat.id}`
            const panelId = `category-panel-${cat.id}`

            return (
              <section key={cat.id} className="category-block">
                <h2>
                  <button
                    type="button"
                    className="category-toggle"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    id={headerId}
                    onClick={() => toggleExpanded(cat.id)}
                  >
                    <span className="category-toggle-label">
                      <span className="category-chevron" aria-hidden>
                        {expanded ? '▾' : '▸'}
                      </span>
                      {cat.name}
                    </span>
                    {!expanded && (
                      <span className="category-progress-pill" aria-label={`${packedCount} of ${totalInCategory} packed`}>
                        {packedCount}/{totalInCategory}
                      </span>
                    )}
                  </button>
                </h2>
                {expanded && (
                  <ul id={panelId} role="region" aria-labelledby={headerId}>
                    {catItems.map((item) => {
                      const checked = checkedIds.has(item.id)
                      return (
                        <li key={item.id}>
                          <label className={checked ? 'item-row checked' : 'item-row'}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => onToggle(item.id)}
                            />
                            <span>{item.label}</span>
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
