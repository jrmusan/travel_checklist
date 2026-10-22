import campingEssentials from '@checklists/camping-essentials.md?raw'
import { parseMarkdownToMasterPool } from '../seed/parse-markdown-pool'
import type { MasterPool, TripTypeDefinition } from '../types'

export const camperTripType: TripTypeDefinition = {
  id: 'camper',
  slug: 'camper',
  name: 'Camper trip',
  icon: '🏕️',
  description: 'Camping essentials — clothes, gear, family, and misc.',
}

export function loadCamperMasterPool(): MasterPool {
  return parseMarkdownToMasterPool(campingEssentials, camperTripType.id)
}
