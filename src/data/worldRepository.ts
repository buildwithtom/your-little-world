import { isLocalDate, isTimeZone, localDateAt } from '../domain/calendar'
import { CATEGORIES, suggestCategory } from '../domain/habits'
import type { Completion, HabitSchedule, WorldHabit } from '../domain/habits'
import { unlockProgress } from '../domain/progression'
import { ACTIVE_ZONE_LIMIT, ARCHETYPES, STAGES, WORLD_MILESTONES, ZONES } from '../domain/progressionConfig'
import { isActive } from '../domain/sessions'
import { emptyWorld } from '../domain/worldActions'
import { createLocalHabitStore, parseLegacyHabitData } from './localHabitStore'
import type { HabitData } from './localHabitStore'
import type { JournalEvent, SkippedSession, UserPreferences, WorldState } from '../domain/world'

export const WORLD_STORAGE_KEY = 'your-little-world:world'
const VERSION = 2

export interface WorldRepository {
  load(): WorldState
  update(recipe: (current: WorldState) => WorldState): Promise<WorldState>
  restore(backup: WorldState): Promise<WorldState>
}

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem'>
type ExclusiveWrite = (write: () => WorldState) => Promise<WorldState>

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function date(value: unknown): value is string {
  return typeof value === 'string' && isLocalDate(value)
}

function instant(value: unknown): value is string {
  return typeof value === 'string' && /Z$/.test(value) && Number.isFinite(Date.parse(value))
}

function schedule(value: unknown): value is HabitSchedule {
  return record(value) && (value.kind === 'daily' || (
    value.kind === 'weekly' && Array.isArray(value.weekdays)
    && value.weekdays.length > 0 && new Set(value.weekdays).size === value.weekdays.length
    && value.weekdays.every((day: unknown) =>
      typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7)
  ))
}

function preferences(value: unknown): value is UserPreferences {
  return record(value) && typeof value.timeZone === 'string' && isTimeZone(value.timeZone)
    && typeof value.sound === 'boolean'
}

function validHabit(value: unknown): value is WorldHabit {
  if (!record(value) || !date(value.createdOn)) return false
  const { createdOn } = value
  if (typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name.trim()
    || value.name.length > 80 || typeof value.timeZone !== 'string' || !isTimeZone(value.timeZone)
    || !instant(value.createdAt) || (value.archivedAt !== undefined && !instant(value.archivedAt))
    || !ZONES.some(({ id }) => id === value.zoneId) || !ARCHETYPES.some(({ id }) => id === value.archetypeId)
    || (value.category !== null && !CATEGORIES.some((category) => category === value.category))
    || !schedule(value.schedule)) return false

  if (value.unit !== 'session' && value.unit !== 'minutes') return false
  if (value.minimum !== null && (value.unit !== 'minutes' || typeof value.minimum !== 'number'
    || !Number.isInteger(value.minimum) || value.minimum < 1 || value.minimum > 1440)) return false

  let previous = ''
  if (!Array.isArray(value.schedules) || value.schedules.length === 0
    || !value.schedules.every((revision: unknown) => {
      if (!record(revision) || !date(revision.from) || revision.from < createdOn
        || revision.from <= previous || !schedule(revision.schedule)) return false
      if (!previous && revision.from !== createdOn) return false
      previous = revision.from
      return true
    })) return false

  let lastEnd: string | null = createdOn
  return Array.isArray(value.pauses) && value.pauses.every((pause: unknown) => {
    if (!record(pause) || !date(pause.from) || lastEnd === null || pause.from < lastEnd) return false
    if (pause.until !== null && (!date(pause.until) || pause.until <= pause.from)) return false
    lastEnd = pause.until
    return true
  })
}

function validCompletion(value: unknown): value is Completion {
  return record(value) && typeof value.habitId === 'string' && date(value.scheduledFor)
    && value.id === `${value.habitId}:${value.scheduledFor}` && instant(value.completedAt)
    && typeof value.amount === 'number' && Number.isInteger(value.amount)
    && value.amount >= 1 && value.amount <= 1440
    && (value.unit === 'minutes' || (value.unit === 'session' && value.amount === 1))
}

function validSkip(value: unknown): value is SkippedSession {
  return record(value) && typeof value.habitId === 'string' && date(value.day)
}

function validJournalEvent(value: unknown): value is JournalEvent {
  if (!record(value) || !date(value.day)) return false
  if (value.kind === 'world') {
    return WORLD_MILESTONES.some(({ id }) => id === value.milestoneId) && value.id === `world:${value.milestoneId}`
  }
  if (typeof value.habitId !== 'string') return false
  if (value.kind === 'reservation') return value.id === `reservation:${value.habitId}`
  return value.kind === 'construction' && STAGES.some(({ id }) => id === value.stageId)
    && value.id === `construction:${value.habitId}:${value.stageId}`
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

function currentWorld(value: unknown): WorldState {
  if (!record(value)) throw new Error('The backup does not contain a world.')
  const { habits, completions, skips, journal } = value
  if (!preferences(value.preferences) || !Array.isArray(habits) || !habits.every(validHabit)
    || !Array.isArray(completions) || !completions.every(validCompletion)
    || !Array.isArray(skips) || !skips.every(validSkip) || !Array.isArray(journal) || !journal.every(validJournalEvent)) {
    throw new Error('The backup contains invalid world data.')
  }

  const byId = new Map(habits.map((habit) => [habit.id, habit]))
  const active = habits.filter(isActive)
  const validHabitDay = (habitId: string, day: string) => {
    const habit = byId.get(habitId)
    return habit !== undefined && day >= habit.createdOn
  }
  if (byId.size !== habits.length || active.length > ACTIVE_ZONE_LIMIT || !unique(active.map(({ zoneId }) => zoneId))
    || !unique([...completions.map(({ id }) => id), ...skips.map(({ habitId, day }) => `${habitId}:${day}`)])
    || !unique(journal.map(({ id }) => id))
    || !completions.every(({ habitId, scheduledFor }) => validHabitDay(habitId, scheduledFor))
    || !skips.every(({ habitId, day }) => validHabitDay(habitId, day))
    || !journal.every((event) => event.kind === 'world' || validHabitDay(event.habitId, event.day))) {
    throw new Error('The backup includes conflicting or missing records.')
  }
  return { preferences: value.preferences, habits, completions, skips, journal }
}

function migrateV1(legacy: HabitData, timeZone: string): WorldState {
  let nextZone = 0
  const state = emptyWorld(timeZone)
  const habits = legacy.habits.map((habit): WorldHabit => {
    const zone = habit.archivedAt === undefined ? ZONES[nextZone++] : ZONES[0]
    if (!zone) throw new Error('This older backup contains more active habits than available clearings.')
    const category = suggestCategory(habit.name)
    const archetype = ARCHETYPES.find((item) => item.category === (category ?? 'Other')) ?? ARCHETYPES[0]
    const createdOn = localDateAt(new Date(habit.createdAt), habit.timeZone)
    return {
      ...habit, createdOn, category, unit: 'session', minimum: null, zoneId: zone.id,
      archetypeId: archetype.id, pauses: [], schedules: [{ from: createdOn, schedule: habit.schedule }],
    }
  })
  let migrated: WorldState = {
    ...state, habits,
    journal: habits.map((habit) => ({
      id: `reservation:${habit.id}`, kind: 'reservation', day: habit.createdOn, habitId: habit.id,
    })),
  }
  const completions = [...legacy.completions].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  for (const completion of completions) {
    const habit = habits.find(({ id }) => id === completion.habitId)
    if (!habit) throw new Error('An older completion is missing its habit.')
    const id = `${habit.id}:${completion.scheduledFor}`
    if (migrated.completions.some((record) => record.id === id)) continue
    migrated = unlockProgress({
      ...migrated, completions: [...migrated.completions, { ...completion, id, amount: 1, unit: 'session' }],
    }, habit, completion.scheduledFor)
  }
  return currentWorld(migrated)
}

export function exportWorld(state: WorldState): string {
  return JSON.stringify({ version: VERSION, world: state }, null, 2)
}

export function importWorld(text: string, timeZone: string): WorldState {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Choose a valid JSON backup.')
  }
  if (!record(data)) throw new Error('Choose a valid world backup.')
  if (data.version === 1) return migrateV1(parseLegacyHabitData(data), timeZone)
  if (data.version !== VERSION) throw new Error('This backup version is unsupported.')
  return currentWorld(data.world)
}

export function createWorldRepository(
  storage: BrowserStorage,
  timeZone: string,
  exclusive: ExclusiveWrite = async (write) => write(),
): WorldRepository {
  function load() {
    const raw = storage.getItem(WORLD_STORAGE_KEY)
    if (raw !== null) return importWorld(raw, timeZone)
    return migrateV1(createLocalHabitStore(storage).load(), timeZone)
  }

  function write(state: WorldState): WorldState {
    storage.setItem(WORLD_STORAGE_KEY, JSON.stringify({ version: VERSION, world: state }))
    return state
  }

  return {
    load,
    update: (recipe) => exclusive(() => write(recipe(load()))),
    restore: (backup) => exclusive(() => write(currentWorld(backup))),
  }
}
