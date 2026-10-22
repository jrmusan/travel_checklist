import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'travel-checklist:category-expanded:v1'

/** Pause so the last check (or check-all) can paint before the card folds. */
export const AUTO_COLLAPSE_DELAY_MS = 500

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

  const autoCollapseTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const cancelScheduledCollapse = useCallback((categoryId: string) => {
    const timer = autoCollapseTimers.current.get(categoryId)
    if (timer) {
      clearTimeout(timer)
      autoCollapseTimers.current.delete(categoryId)
    }
  }, [])

  const scheduleCollapse = useCallback(
    (categoryId: string) => {
      cancelScheduledCollapse(categoryId)
      const timer = setTimeout(() => {
        autoCollapseTimers.current.delete(categoryId)
        setExpandedById((prev) =>
          prev[categoryId] === false ? prev : { ...prev, [categoryId]: false },
        )
      }, AUTO_COLLAPSE_DELAY_MS)
      autoCollapseTimers.current.set(categoryId, timer)
    },
    [cancelScheduledCollapse],
  )

  useEffect(
    () => () => {
      for (const timer of autoCollapseTimers.current.values()) clearTimeout(timer)
      autoCollapseTimers.current.clear()
    },
    [],
  )

  const toggleExpanded = useCallback(
    (categoryId: string) => {
      cancelScheduledCollapse(categoryId)
      setExpandedById((prev) => ({
        ...prev,
        [categoryId]: !(prev[categoryId] ?? true),
      }))
    },
    [cancelScheduledCollapse],
  )

  const expand = useCallback(
    (categoryId: string) => {
      cancelScheduledCollapse(categoryId)
      setExpandedById((prev) => (prev[categoryId] === false ? { ...prev, [categoryId]: true } : prev))
    },
    [cancelScheduledCollapse],
  )

  return {
    expandedById,
    isExpanded,
    toggleExpanded,
    expand,
    scheduleCollapse,
    cancelScheduledCollapse,
  }
}

/** Fold a card on the incomplete → complete transition only. Never force-expand. */
export function useAutoCollapseOnComplete(
  tripKey: string,
  completions: { id: string; complete: boolean }[],
  expandedById: Record<string, boolean>,
  scheduleCollapse: (categoryId: string) => void,
  cancelScheduledCollapse: (categoryId: string) => void,
) {
  const prevComplete = useRef(new Map<string, boolean>())
  const prevTripKey = useRef(tripKey)

  useEffect(() => {
    if (prevTripKey.current !== tripKey) {
      prevTripKey.current = tripKey
      prevComplete.current.clear()
    }

    for (const { id, complete } of completions) {
      if (!prevComplete.current.has(id)) {
        prevComplete.current.set(id, complete)
        continue
      }

      const wasComplete = prevComplete.current.get(id) === true
      if (complete && !wasComplete) {
        if (expandedById[id] !== false) scheduleCollapse(id)
      } else if (!complete && wasComplete) {
        cancelScheduledCollapse(id)
      }
      prevComplete.current.set(id, complete)
    }
  }, [tripKey, completions, expandedById, scheduleCollapse, cancelScheduledCollapse])
}
