import { ScreenHeader } from '../components/ScreenHeader'
import { ArtIcon } from '../components/icons/ArtIcon'
import { categoryArt, categoryLabel } from '../lib/catalog-art'
import type { MasterCategory, MasterItem } from '../types'

interface CategoriesScreenProps {
  categories: MasterCategory[]
  items: MasterItem[]
  checkedIds: Set<string>
  tracking: boolean
  onBack: () => void
  onOpenCategory: (categoryId: string) => void
}

export function CategoriesScreen({
  categories,
  items,
  checkedIds,
  tracking,
  onBack,
  onOpenCategory,
}: CategoriesScreenProps) {
  return (
    <div className="screen screen--categories">
      <ScreenHeader title="Categories" subtitle={`${categories.length} groups · ${items.length} items`} onBack={onBack} />
      <div className="sheet-surface">
        <div className="tile-grid tile-grid--categories">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id)
            const packed = catItems.filter((i) => checkedIds.has(i.id)).length
            const { art, kind } = categoryArt(cat)
            const label = categoryLabel(cat)
            const done = tracking && catItems.length > 0 && packed === catItems.length
            return (
              <button
                key={cat.id}
                type="button"
                className="tile tile--category"
                onClick={() => onOpenCategory(cat.id)}
              >
                <ArtIcon name={art} size={56} />
                <span className="tile-label">{label}</span>
                {kind !== label && <span className="tile-kind">{kind}</span>}
                <span className={done ? 'count-pill count-pill--done' : 'count-pill'}>
                  {tracking ? `${packed}/${catItems.length}` : `${catItems.length} items`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
