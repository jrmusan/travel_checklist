import type { ArtName } from '../components/icons/ArtIcon'
import type { MasterCategory, MasterItem } from '../types'

/** Category names in the markdown carry emoji suffixes; tiles render their own art. */
export function categoryLabel(cat: MasterCategory): string {
  return cat.name
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const CATEGORY_RULES: [RegExp, ArtName, string][] = [
  [/camp|tent|shelter|sleep/i, 'tent', 'Shelter & Sleeping'],
  [/food|cook|kitchen/i, 'mug', 'Cooking & Food'],
  [/cloth|apparel/i, 'jacket', 'Clothing'],
  [/toilet|personal|hygiene/i, 'bottles', 'Personal Care'],
  [/climb|gear|tool/i, 'rope', 'Tools & Gear'],
  [/work|office/i, 'laptop', 'Work'],
  [/electron|tech|camera/i, 'camera', 'Electronics'],
  [/mochi|dog|pet|cat/i, 'paw', 'Pets'],
  [/ava|kid|baby|child/i, 'bear', 'Kids & Baby'],
  [/misc/i, 'compass', 'Miscellaneous'],
]

export function categoryArt(cat: MasterCategory): { art: ArtName; kind: string } {
  for (const [re, art, kind] of CATEGORY_RULES) {
    if (re.test(cat.name)) return { art, kind }
  }
  return { art: 'lantern', kind: 'Gear' }
}

const ITEM_RULES: [RegExp, ArtName][] = [
  [/sleeping bag|sleep sack|sleeping pad|pillow|sheets|cushion/i, 'sleepingBag'],
  [/tent/i, 'tent'],
  [/chair/i, 'chair'],
  [/hat\b|hats/i, 'hat'],
  [/boot|shoe|flip flop/i, 'boot'],
  [/sock|mitten/i, 'sock'],
  [/helmet/i, 'helmet'],
  [/towel|blanket|scarf|diaper|wipes|pee pad|pads$/i, 'towel'],
  [/underwear|swim|cloth|pjs|shirt|vest/i, 'shirt'],
  [/snack|nut|treat|greenies|formula|food|creatine|supplement/i, 'snack'],
  [/rope|sling|carabiner|quick draw|gri gri|harness|chalk|tape/i, 'rope'],
  [/tooth|floss|brush|razor|tweezer|trimmer|buffer|nail/i, 'toothbrush'],
  [/medicine|vaccination|thermometer|noze/i, 'pill'],
  [/spray|bug/i, 'spray'],
  [/charger|plug|cord|generator|compressor|starlink/i, 'plug'],
  [/headset/i, 'headset'],
  [/laptop|monitor|mouse|kindle|steam deck/i, 'laptop'],
  [/camera|go ?pro|polaroid|drone|tripod/i, 'camera'],
  [/phone|watch|hatch/i, 'phone'],
  [/pen\b|paper|passport/i, 'paper'],
  [/backpack|bag|carrier/i, 'backpack'],
  [/bottle|pacifier|breeza|powder/i, 'babyBottle'],
  [/jug|bucket|tupperware|trash|bowl|detergent/i, 'jug'],
  [/leash|collar|frisbee|lint|defurminator/i, 'paw'],
  [/paddle|board/i, 'board'],
  [/toy/i, 'bear'],
  [/lotion|sunscreen|solution|perfume|hairspray|deodorant|skincare|mask|lip|poo|contact|toothpaste|make-up|tubby|bath/i, 'bottles'],
]

export function itemArt(item: MasterItem, fallback: ArtName): ArtName {
  for (const [re, art] of ITEM_RULES) {
    if (re.test(item.label)) return art
  }
  return fallback
}
