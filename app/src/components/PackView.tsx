import { useMemo, useState } from 'react'
import type { MasterCategory, MasterItem, PackFilter } from '../types'
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
  const [filter, setFilter] = useState<PackFilter>('remaining')
  const [query, setQuery] = useState('')

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

  const visibleCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const catItems = (itemsByCategory.get(cat.id) ?? []).filter((item) => {
          if (normalizedQuery && !item.label.toLowerCase().includes(normalizedQuery)) {
            return false
          }
          const packed = checkedIds.has(item.id)
          if (filter === 'remaining' && packed) {
            return false
          }
          return true
        })
        return { cat, catItems }
      })
      .filter(({ catItems }) => catItems.length > 0)
  }, [categories, itemsByCategory, normalizedQuery, filter, checkedIds])

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
          visibleCategories.map(({ cat, catItems }) => (
            <section key={cat.id} className="category-block">
              <h2>{cat.name}</h2>
              <ul>
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
            </section>
          ))
        )}
      </div>
    </div>
  )
}
