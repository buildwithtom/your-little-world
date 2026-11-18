import { expect, test } from '@playwright/test'

test('navigates through the views on the responsive shell', async ({ page, isMobile }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The Hillside', level: 1 })).toBeVisible()
  await expect(page.getByText('Development time travel')).toHaveCount(0)
  const navigation = page.getByRole('navigation', { name: 'Primary' })
  await expect(navigation.getByRole('link', { name: 'World' })).toHaveAttribute('aria-current', 'page')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  )
  if (isMobile) {
    await page.getByRole('button', { name: /Collapse today/ }).click()
    await expect(page.getByRole('button', { name: 'Add a habit' })).toBeHidden()
    await page.getByRole('button', { name: /Expand today/ }).click()
    await expect(page.getByRole('button', { name: 'Add a habit' })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.getByRole('button', { name: 'Reset map' })).toBeEnabled()
  await page.getByRole('button', { name: 'Reset map' }).click()

  for (const name of ['Habits', 'Journal', 'Progress']) {
    const link = navigation.getByRole('link', { name })
    await link.click()
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
    await expect(page).toHaveTitle(`${name} · Your Little World`)
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('main')).toBeFocused()
  }

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Journal', level: 1 })).toBeVisible()
  await navigation.getByRole('link', { name: 'World' }).click()
  await expect(page.getByRole('heading', { name: 'The Hillside', level: 1 })).toBeVisible()
})

test('builds from guitar check-ins on later scheduled dates and restores progress on reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T08:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Add a habit' }).click()
  const editor = page.getByRole('dialog', { name: 'Add a habit' })
  await editor.getByRole('textbox', { name: 'Habit name' }).fill('Practice guitar')
  await expect(editor.getByRole('combobox', { name: /Category/ })).toHaveValue('Music')
  await editor.getByRole('radio', { name: 'Selected weekdays' }).check()
  for (const day of ['Monday', 'Wednesday', 'Friday']) await editor.getByRole('checkbox', { name: day }).check()
  await editor.getByRole('button', { name: 'Save habit' }).click()
  await expect(page.getByRole('button', { name: 'Fern Grove, Hidden clearing' })).toBeVisible()

  const checkIn = page.getByRole('button', { name: 'Complete Practice guitar' })
  await checkIn.click()
  await expect(page.getByRole('button', { name: 'Fern Grove, Clearing' })).toBeVisible()
  await expect(page.getByText('The ferns part to reveal a small clearing.')).toBeVisible()
  await expect(checkIn).toHaveCount(0)

  for (const [day, stage] of [['18', 'Foundation'], ['20', 'Foundation'], ['23', 'Framework']]) {
    await page.clock.setFixedTime(new Date(`2026-11-${day}T08:00:00Z`))
    await page.reload()
    await checkIn.click()
    await expect(page.getByRole('button', { name: 'Undo Practice guitar' })).toBeVisible()
    await expect(page.getByRole('button', { name: `Fern Grove, ${stage}` })).toBeVisible()
  }

  await page.reload()
  await expect(page.getByRole('button', { name: 'Fern Grove, Framework' })).toBeVisible()
  await page.getByRole('link', { name: 'Progress' }).click()
  await expect(page.getByText('4 of 7 sessions for roof')).toBeVisible()
  await page.getByText('Recent history').click()
  await expect(page.getByText('Unscheduled').first()).toBeVisible()
  await page.getByRole('link', { name: 'Journal' }).click()
  await expect(page.getByText('The frame is rising above the grass.')).toHaveCount(1)
})

test('exports and restores a saved world from Settings', async ({ page }) => {
  await page.goto('/#/settings')
  const sound = page.getByRole('checkbox', { name: 'Play a soft sound on completion' })
  await expect(sound).not.toBeChecked()
  await sound.check()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Preferences saved.')).toBeVisible()

  const [backup] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export backup' }).click(),
  ])
  expect(backup.suggestedFilename()).toMatch(/^little-world-.*\.json$/)
  await sound.uncheck()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Preferences saved.')).toBeVisible()
  await page.getByLabel('Choose backup').setInputFiles(await backup.path())
  await page.getByRole('button', { name: 'Restore this backup' }).click()
  await expect(page.getByText('Your saved world has been restored.')).toBeVisible()
  await expect(sound).toBeChecked()
  await page.reload()
  await expect(sound).toBeChecked()
})

test('reopens the cached scene and completes a habit while offline', async ({ page, context }) => {
  await page.goto('/#/habits')
  await expect(page.getByRole('heading', { name: 'Habits', level: 1 })).toBeVisible()
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Add a habit' }).click()
  await page.getByRole('textbox', { name: 'Habit name' }).fill('Read a book')
  await page.getByRole('button', { name: 'Save habit' }).click()
  await expect(page.getByRole('button', { name: 'Edit Read a book' })).toBeVisible()

  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('button', { name: 'Edit Read a book' })).toBeVisible()
  await page.getByRole('link', { name: 'World', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'The Hillside', level: 1 })).toBeVisible()
  const cachedArt = await page.evaluate(async () => Promise.all([
    fetch('/world/valley.webp').then((response) => response.ok),
    fetch('/world/cottage.webp').then((response) => response.ok),
  ]))
  expect(cachedArt).toEqual([true, true])
  await page.getByRole('button', { name: 'Complete Read a book' }).click()
  await expect(page.getByRole('button', { name: 'Fern Grove, Clearing' })).toBeVisible()
})
