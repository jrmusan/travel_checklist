import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'travel-checklist:category-expanded:v1'

function loadMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function useCategoryExpanded(categoryIds: string[]) {
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>(() => loadMap())

  useEffect(() => {
    setExpandedById((prev) => {
      const next = { ...prev }
      for (const id of categoryIds) {
        if (!(id in next)) {
          next[id] = true
        }
      }
      return next
    })
  }, [categoryIds.join('|')])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedById))
  }, [expandedById])

  const isExpanded = useCallback(
    (categoryId: string) => expandedById[categoryId] ?? true,
    [expandedById],
  )

  const toggleExpanded = useCallback((categoryId: string) => {
    setExpandedById((prev) => ({
      ...prev,
      [categoryId]: !(prev[categoryId] ?? true),
    }))
  }, [])

  const expand = useCallback((categoryId: string) => {
    setExpandedById((prev) => (prev[categoryId] === false ? { ...prev, [categoryId]: true } : prev))
  }, [])

  return { isExpanded, toggleExpanded, expand }
}
