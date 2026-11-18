import { describe, expect, it } from 'vitest'
import { createLocalHabitStore } from './localHabitStore'
import type { HabitData } from './localHabitStore'

const startingData: HabitData = {
  habits: [
    {
      id: 'walk',
      name: 'Take a walk',
      schedule: { kind: 'weekly', weekdays: [1, 3, 5] },
      timeZone: 'Asia/Kolkata',
      createdAt: '2026-11-16T06:00:00Z',
    },
  ],
  completions: [
    {
      id: 'walk-2026-11-16',
      habitId: 'walk',
      scheduledFor: '2026-11-16',
      completedAt: '2026-11-16T12:00:00Z',
    },
  ],
}

function createTestStorage() {
  const entries = new Map<string, string>()
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value) },
  }
}

describe('local habit store', () => {
  it('loads an empty ledger on first use', () => {
    expect(createLocalHabitStore(createTestStorage()).load()).toEqual({
      habits: [],
      completions: [],
    })
  })

  it('loads previously saved habits and completions in a new store instance', () => {
    const storage = createTestStorage()
    createLocalHabitStore(storage).save(startingData)

    expect(createLocalHabitStore(storage).load()).toEqual(startingData)
  })

  it('surfaces an unsupported schema version', () => {
    const storage = { ...createTestStorage(), getItem: () => '{"version":2}' }

    expect(() => createLocalHabitStore(storage).load()).toThrow('Unsupported habit storage format.')
  })

  it('rejects invalid stored records', () => {
    const storage = {
      ...createTestStorage(),
      getItem: () => '{"version":1,"habits":[],"completions":[null]}',
    }

    expect(() => createLocalHabitStore(storage).load()).toThrow('Invalid habit data in local storage.')
  })
})
