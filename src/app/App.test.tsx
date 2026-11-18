// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createWorldRepository } from '../data/worldRepository'
import { App } from './App'

beforeEach(() => {
  window.location.hash = '#/'
  window.localStorage.clear()
  window.scrollTo = vi.fn()
})

afterEach(cleanup)

it('suggests a category, edits a weekday schedule, checks in, and undoes through the UI', async () => {
  const user = userEvent.setup()
  const repository = createWorldRepository(window.localStorage, 'UTC')
  const clock = () => new Date('2026-11-16T12:00:00Z')
  render(<App repository={repository} clock={clock} />)
  await user.click(screen.getByRole('button', { name: 'Add a habit' }))
  const editor = screen.getByRole('dialog', { name: 'Add a habit' })
  await user.type(within(editor).getByRole('textbox', { name: 'Habit name' }), 'Practice guitar')
  expect(within(editor).getByRole('combobox', { name: /Category/ })).toHaveValue('Music')
  await user.click(within(editor).getByRole('button', { name: 'Save habit' }))
  expect(await screen.findByRole('button', { name: 'Fern Grove, Hidden clearing' })).toBeVisible()

  await user.click(screen.getByRole('link', { name: 'Habits' }))
  await user.click(await screen.findByRole('button', { name: 'Edit Practice guitar' }))
  const edit = screen.getByRole('dialog', { name: 'Edit habit' })
  await user.click(within(edit).getByRole('radio', { name: 'Selected weekdays' }))
  await user.click(within(edit).getByRole('checkbox', { name: 'Monday' }))
  await user.click(within(edit).getByRole('checkbox', { name: 'Wednesday' }))
  await user.click(within(edit).getByRole('button', { name: 'Save changes' }))
  expect(await screen.findByText('Mon, Wed · Session · Music')).toBeVisible()

  await user.click(screen.getByRole('link', { name: /^World$/ }))
  await user.click(await screen.findByRole('button', { name: 'Complete Practice guitar' }))
  expect(await screen.findByRole('button', { name: 'Fern Grove, Clearing' })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Undo Practice guitar' }))
  expect(await screen.findByRole('button', { name: 'Complete Practice guitar' })).toBeVisible()
  expect(repository.load().completions).toHaveLength(0)
  expect(repository.load().journal.filter(({ kind }) => kind === 'construction')).toHaveLength(1)
})
