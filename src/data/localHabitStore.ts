import type { Habit, HabitCompletion, HabitSchedule, Weekday } from '../domain/habits'

const storageKey = 'your-little-world:habits'
const schemaVersion = 1
const weekdays: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]

export interface HabitData {
  habits: readonly Habit[]
  completions: readonly HabitCompletion[]
}

export interface HabitStore {
  load(): HabitData
  save(data: HabitData): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWeekday(value: unknown): value is Weekday {
  return weekdays.some((weekday) => weekday === value)
}

function isSchedule(value: unknown): value is HabitSchedule {
  if (!isRecord(value)) return false
  if (value.kind === 'daily') return true

  return value.kind === 'weekly'
    && Array.isArray(value.weekdays)
    && value.weekdays.length > 0
    && value.weekdays.every(isWeekday)
}

function isHabit(value: unknown): value is Habit {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.timeZone === 'string'
    && typeof value.createdAt === 'string'
    && (value.archivedAt === undefined || typeof value.archivedAt === 'string')
    && isSchedule(value.schedule)
}

function isCompletion(value: unknown): value is HabitCompletion {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.habitId === 'string'
    && typeof value.scheduledFor === 'string'
    && typeof value.completedAt === 'string'
}

export function parseLegacyHabitData(stored: unknown): HabitData {
  if (!isRecord(stored) || stored.version !== schemaVersion) {
    throw new Error('Unsupported habit storage format.')
  }

  const { habits, completions } = stored
  if (!Array.isArray(habits) || !habits.every(isHabit)
    || !Array.isArray(completions) || !completions.every(isCompletion)) {
    throw new Error('Invalid habit data in local storage.')
  }

  return { habits, completions }
}

export function createLocalHabitStore(storage: Pick<Storage, 'getItem' | 'setItem'>): HabitStore {
  return {
    load() {
      const raw = storage.getItem(storageKey)
      if (raw === null) return { habits: [], completions: [] }

      return parseLegacyHabitData(JSON.parse(raw))
    },

    save({ habits, completions }) {
      storage.setItem(storageKey, JSON.stringify({ version: schemaVersion, habits, completions }))
    },
  }
}
