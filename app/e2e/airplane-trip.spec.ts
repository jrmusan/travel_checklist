import { expect, type Page, test } from '@playwright/test'

async function signUp(page: Page) {
  const team = `Crew ${Date.now()}`
  await page.goto('/')
  await page.getByRole('button', { name: 'Get Started' }).click()
  await page.locator('input[name="teamName"]').fill(team)
  await page.locator('input[name="password"]').fill('password1')
  await page.locator('input[name="confirmPassword"]').fill('password1')
  await page.getByRole('button', { name: 'Create team account' }).click()
  await expect(page.getByRole('button', { name: 'Start a trip' }).first()).toBeVisible()
}

async function fillTripName(page: Page, name: string) {
  await page.locator('input[name="tripName"]').fill(name)
}

async function startTypedTrip(page: Page, type: 'Camper' | 'Airplane', destination: string) {
  await page.getByRole('radio', { name: new RegExp(`^${type}\\b`) }).click()
  await fillTripName(page, destination)
  await page.getByRole('button', { name: new RegExp(`Start ${type.toLowerCase()} trip`, 'i') }).click()
  await expect(page.getByText(type, { exact: true }).first()).toBeVisible()
}

function itemLabels(page: Page) {
  return page.locator('.item-label')
}

test('airplane vs camper catalogs stay isolated and persist edits', async ({ page }, testInfo) => {
  await signUp(page)

  await page.getByRole('button', { name: 'Start a trip' }).first().click()
  await expect(page.getByRole('radio', { name: /^Camper\b/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^Airplane\b/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pick a trip type' })).toBeDisabled()

  const shot = testInfo.outputPath('camplist-airplane-type.png')
  await page.getByRole('dialog', { name: 'Start a new trip' }).screenshot({ path: shot })
  await page.screenshot({
    path: '/cursor/stores/bc-d46340e0-7302-4b40-bed7-351a53742b29/media/camplist-airplane-type.png',
    fullPage: true,
  })

  await startTypedTrip(page, 'Airplane', 'Paris')

  await expect(itemLabels(page).getByText('Hiking boots', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('Gri gri/ATC', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('Hatch', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('TSA liquids bag', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('Generator', { exact: true })).toHaveCount(0)
  await expect(itemLabels(page).getByText('Drone / Charger', { exact: true })).toHaveCount(0)
  await expect(itemLabels(page).getByText('Toilet paper', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Edit Flying' }).click()
  await page.getByRole('button', { name: 'Remove AirTags' }).click()
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(itemLabels(page).getByText('AirTags', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Done editing Flying' }).click()

  await page.getByRole('button', { name: 'Home' }).click()
  await expect(page.getByText('Airplane', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Manage trip' }).click()
  await page.getByRole('button', { name: 'End trip' }).click()

  await page.getByRole('button', { name: 'Start a trip' }).first().click()
  await startTypedTrip(page, 'Airplane', 'Lisbon')
  await expect(itemLabels(page).getByText('TSA liquids bag', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('AirTags', { exact: true })).toHaveCount(0)
  await expect(itemLabels(page).getByText('Hiking boots', { exact: true })).toHaveCount(1)

  await page.getByRole('button', { name: 'Home' }).click()
  await page.getByRole('button', { name: 'Manage trip' }).click()
  await page.getByRole('button', { name: 'End trip' }).click()

  await page.getByRole('button', { name: 'Start a trip' }).first().click()
  await startTypedTrip(page, 'Camper', 'Yosemite')
  await expect(itemLabels(page).getByText('Generator', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('Drone / Charger', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('Toilet paper', { exact: true })).toHaveCount(1)
  await expect(itemLabels(page).getByText('TSA liquids bag', { exact: true })).toHaveCount(0)
  await expect(itemLabels(page).getByText('AirTags', { exact: true })).toHaveCount(0)
})
