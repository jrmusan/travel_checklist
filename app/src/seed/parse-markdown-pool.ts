import type { MasterCategory, MasterItem, MasterPool, TripTypeId } from '../types'

const ITEM_LINE = /^- \[[ xX]\] (.+)$/

function slugPart(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/**
 * Build master pool from checklist markdown (sections only; ignores checkbox marks).
 * Stops before a "## Still to pack" section.
 */
export function parseMarkdownToMasterPool(
  markdown: string,
  tripTypeId: TripTypeId,
): MasterPool {
  const categories: MasterCategory[] = []
  const items: MasterItem[] = []

  let currentCategory: MasterCategory | null = null
  let itemOrder = 0

  for (const line of markdown.split(/\r?\n/)) {
    if (/^## Still to pack/i.test(line.trim())) {
      break
    }

    const sectionMatch = line.match(/^## (.+)$/)
    if (sectionMatch) {
      const name = sectionMatch[1].trim()
      const catSlug = slugPart(name.replace(/[^\w\s./&'-]/gu, '')) || `section-${categories.length}`
      currentCategory = {
        id: `${tripTypeId}:${catSlug}`,
        tripTypeId,
        name,
        order: categories.length,
      }
      categories.push(currentCategory)
      itemOrder = 0
      continue
    }

    const itemMatch = line.match(ITEM_LINE)
    if (itemMatch && currentCategory) {
      const label = itemMatch[1].trim()
      items.push({
        id: `${currentCategory.id}:${itemOrder}:${slugPart(label)}`,
        tripTypeId,
        categoryId: currentCategory.id,
        label,
        order: itemOrder,
      })
      itemOrder += 1
    }
  }

  return { categories, items }
}
