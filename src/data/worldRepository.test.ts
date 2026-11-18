import { describe, expect, it } from 'vitest'
import { constructionFor } from '../domain/progression'
import type { WorldState } from '../domain/world'
import { applyWorldAction } from '../domain/worldActions'
import { createLocalHabitStore } from './localHabitStore'
import { createWorldRepository, exportWorld, importWorld } from './worldRepository'

function testStorage() {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
}

const now = new Date('2026-11-19T12:00:00Z')
const addGuitar = (state: WorldState) => applyWorldAction(state, {
  kind: 'add', id: 'guitar', draft: { name: 'Guitar', category: null, unit: 'session', minimum: null, schedule: { kind: 'daily' } },
}, now)

describe('world repository', () => {
  it('reconstructs the same world after opening a new repository or restoring a backup', async () => {
    const storage = testStorage()
    const repository = createWorldRepository(storage, 'UTC')
    await repository.update(addGuitar)
    const saved = await repository.update((state) => applyWorldAction(state, { kind: 'complete', habitId: 'guitar', amount: 1 }, now))
    const reopened = createWorldRepository(storage, 'Asia/Kolkata').load()
    expect(reopened).toEqual(saved)
    expect(reopened.habits.map((habit) => constructionFor(reopened, habit).stageNumber)).toEqual([1])
    const backup = importWorld(exportWorld(saved), 'Asia/Kolkata')
    const restored = createWorldRepository(testStorage(), 'Asia/Kolkata')
    await restored.restore(backup)
    expect(restored.load()).toEqual(saved)
  })

  it('keeps a failed update and invalid imports from changing saved data', async () => {
    const repository = createWorldRepository(testStorage(), 'UTC')
    const saved = await repository.update(addGuitar)
    await expect(repository.update(addGuitar)).rejects.toThrow('already exists')
    expect(() => importWorld('{"version":99}', 'UTC')).toThrow('unsupported')
    expect(() => importWorld('invalid', 'UTC')).toThrow('valid JSON')
    const conflicted = { ...saved, habits: [...saved.habits, ...saved.habits] }
    await expect(repository.restore(conflicted)).rejects.toThrow('conflicting')
    expect(repository.load()).toEqual(saved)
  })

  it('migrates the phase-one ledger while preserving local dates and earned progress', () => {
    const storage = testStorage()
    createLocalHabitStore(storage).save({
      habits: [{ id: 'guitar', name: 'Guitar practice', schedule: { kind: 'daily' }, timeZone: 'America/Los_Angeles', createdAt: '2026-11-19T01:00:00Z' }],
      completions: [{ id: 'old-id', habitId: 'guitar', scheduledFor: '2026-11-18', completedAt: '2026-11-19T02:00:00Z' }],
    })
    const migrated = createWorldRepository(storage, 'UTC').load()
    expect(migrated.habits[0]).toMatchObject({ zoneId: 'fern-grove', archetypeId: 'studio', createdOn: '2026-11-18' })
    expect(migrated.completions[0]).toMatchObject({ id: 'guitar:2026-11-18', unit: 'session' })
    expect(migrated.journal.map(({ kind }) => kind)).toEqual(['reservation', 'construction'])
  })
})
