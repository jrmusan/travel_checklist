import airplaneEssentials from '@checklists/airplane-essentials.md?raw'
import { parseMarkdownToMasterPool } from '../seed/parse-markdown-pool'
import type { MasterPool, TripTypeDefinition } from '../types'

export const airplaneTripType: TripTypeDefinition = {
  id: 'airplane',
  slug: 'airplane',
  name: 'Airplane',
  icon: '✈️',
  description: 'Flying with family, climbing gear, and carry-on packing.',
}

export function loadAirplaneMasterPool(): MasterPool {
  return parseMarkdownToMasterPool(airplaneEssentials, airplaneTripType.id)
}
