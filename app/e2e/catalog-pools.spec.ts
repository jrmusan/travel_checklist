import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { parseMarkdownToMasterPool } from '../src/seed/parse-markdown-pool'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function load(file: string, tripTypeId: string) {
  const markdown = readFileSync(path.join(root, 'checklists', file), 'utf8')
  return parseMarkdownToMasterPool(markdown, tripTypeId)
}

test('airplane and camper pools use separate ids', () => {
  const camper = load('camping-essentials.md', 'camper')
  const airplane = load('airplane-essentials.md', 'airplane')

  expect(camper.items.every((i) => i.id.startsWith('camper:') && i.tripTypeId === 'camper')).toBe(true)
  expect(airplane.items.every((i) => i.id.startsWith('airplane:') && i.tripTypeId === 'airplane')).toBe(true)
  expect(new Set([...camper.items, ...airplane.items].map((i) => i.id)).size).toBe(
    camper.items.length + airplane.items.length,
  )

  const camperLabels = camper.items.map((i) => i.label)
  const airplaneLabels = airplane.items.map((i) => i.label)

  expect(camperLabels).toContain('Generator')
  expect(camperLabels).toContain('Drone / Charger')
  expect(camperLabels).toContain('Toilet paper')
  expect(camperLabels).toContain('Life vest')
  expect(camperLabels).toContain('Extension cord')

  expect(airplaneLabels).not.toContain('Generator')
  expect(airplaneLabels).not.toContain('Drone / Charger')
  expect(airplaneLabels).not.toContain('Toilet paper')
  expect(airplaneLabels).not.toContain('Poo-pouri')
  expect(airplaneLabels).not.toContain('Paper towels')
  expect(airplaneLabels).not.toContain('Life vest')
  expect(airplaneLabels).not.toContain('Extension cord')
  expect(airplane.categories.some((c) => /camping/i.test(c.name))).toBe(false)

  expect(airplaneLabels).toContain('Hiking boots')
  expect(airplaneLabels).toContain('Gri gri/ATC')
  expect(airplaneLabels).toContain('Hatch')
  expect(airplaneLabels).toContain('TSA liquids bag')
  expect(airplaneLabels).toContain('Packing cubes')
  expect(airplaneLabels).toContain('AirTags')
  expect(airplane.categories.some((c) => /^Flying/i.test(c.name))).toBe(true)
  expect(airplane.categories.some((c) => /^Mochi/i.test(c.name))).toBe(true)
  expect(airplane.categories.some((c) => /^Ava/i.test(c.name))).toBe(true)
})
