import { isTimeZone, localDateAt, shiftDate } from './calendar'
import type { LocalDate } from './calendar'
import { CATEGORIES, suggestCategory } from './habits'
import type { HabitDraft, HabitSchedule, WorldHabit } from './habits'
import { unlockProgress } from './progression'
import { ACTIVE_ZONE_LIMIT, ARCHETYPES, ZONES } from './progressionConfig'
import { isActive, isPausedOn, sessionStatus } from './sessions'
import type { UserPreferences, WorldState } from './world'

export type WorldAction =
  | { kind: 'add'; id: string; draft: HabitDraft }
  | { kind: 'edit'; habitId: string; draft: HabitDraft }
  | { kind: 'complete'; habitId: string; amount: number }
  | { kind: 'skip' | 'pause' | 'resume'; habitId: string }
  | { kind: 'undo'; habitId: string; day?: LocalDate }
  | { kind: 'preferences'; preferences: UserPreferences }

export function isHabitSchedule(schedule: HabitSchedule): boolean {
  return schedule.kind === 'daily' || (
    schedule.weekdays.length > 0
    && new Set(schedule.weekdays).size === schedule.weekdays.length
    && schedule.weekdays.every((weekday) => Number.isInteger(weekday) && weekday >= 1 && weekday <= 7)
  )
}

export function normalizeDraft(draft: HabitDraft): HabitDraft {
  const name = draft.name.trim()
  if (!name || name.length > 80) throw new Error('Enter a habit name between 1 and 80 characters.')
  if (!isHabitSchedule(draft.schedule)) throw new Error('Choose at least one scheduled day.')
  if (draft.category !== null && !CATEGORIES.includes(draft.category)) throw new Error('Choose a valid category.')
  if (draft.unit === 'minutes' && draft.minimum !== null
    && (!Number.isInteger(draft.minimum) || draft.minimum < 1 || draft.minimum > 1440)) {
    throw new Error('Enter a minimum between 1 and 1,440 minutes.')
  }
  return { ...draft, name, minimum: draft.unit === 'minutes' ? draft.minimum : null }
}

function replaceHabit(state: WorldState, habit: WorldHabit): WorldState {
  return { ...state, habits: state.habits.map((item) => item.id === habit.id ? habit : item) }
}

function reserveZone(state: WorldState, id: string, draft: HabitDraft, now: Date): WorldState {
  const active = state.habits.filter(isActive)
  const zone = ZONES.find(({ id }) => !active.some(({ zoneId }) => zoneId === id))
  if (active.length >= ACTIVE_ZONE_LIMIT || !zone) throw new Error('All three clearings are reserved.')
  if (!id || state.habits.some((habit) => habit.id === id)) throw new Error('This habit already exists.')

  const cleanDraft = normalizeDraft(draft)
  const category = cleanDraft.category ?? suggestCategory(cleanDraft.name) ?? 'Other'
  const archetype = ARCHETYPES.find((item) => item.category === category) ?? ARCHETYPES[0]
  const { timeZone } = state.preferences
  const day = localDateAt(now, timeZone)
  const habit: WorldHabit = {
    ...cleanDraft, id, createdOn: day, createdAt: now.toISOString(), timeZone,
    zoneId: zone.id, archetypeId: archetype.id, schedules: [{ from: day, schedule: cleanDraft.schedule }], pauses: [],
  }
  return {
    ...state, habits: [...state.habits, habit],
    journal: [...state.journal, { id: `reservation:${id}`, day, kind: 'reservation', habitId: id }],
  }
}

function effectiveDay(today: LocalDate, status: string): LocalDate {
  return status === 'complete' || status === 'skipped' ? shiftDate(today, 1) : today
}

function sameSchedule(first: HabitSchedule, second: HabitSchedule): boolean {
  if (first.kind !== second.kind) return false
  if (first.kind === 'daily' || second.kind === 'daily') return true
  return first.weekdays.length === second.weekdays.length
    && first.weekdays.every((day) => second.weekdays.includes(day))
}

export function applyWorldAction(state: WorldState, action: WorldAction, now: Date): WorldState {
  if (action.kind === 'add') return reserveZone(state, action.id, action.draft, now)
  if (action.kind === 'preferences') {
    const { preferences } = action
    if (!isTimeZone(preferences.timeZone)) throw new Error('Enter a valid time zone.')
    const habits = preferences.timeZone === state.preferences.timeZone ? state.habits
      : state.habits.map((habit) => ({ ...habit, timeZone: preferences.timeZone }))
    return { ...state, preferences, habits }
  }

  const habit = state.habits.find(({ id }) => id === action.habitId)
  if (!habit || !isActive(habit)) throw new Error('This habit is unavailable.')
  const today = localDateAt(now, habit.timeZone)
  const status = sessionStatus(state, habit, today, today)

  switch (action.kind) {
    case 'edit': {
      const draft = normalizeDraft(action.draft)
      const from = effectiveDay(today, status)
      const schedules = sameSchedule(habit.schedule, draft.schedule) ? habit.schedules : [
        ...habit.schedules.filter((revision) => revision.from < from),
        { from: from < habit.createdOn ? habit.createdOn : from, schedule: draft.schedule },
      ]
      return replaceHabit(state, { ...habit, ...draft, schedules })
    }
    case 'pause': {
      if (habit.pauses.some(({ until }) => until === null)) return state
      const from = [effectiveDay(today, status), habit.createdOn, habit.pauses.at(-1)?.until ?? habit.createdOn]
        .reduce((latest, day) => day > latest ? day : latest)
      return replaceHabit(state, {
        ...habit, pauses: [...habit.pauses, { from, until: null }],
      })
    }
    case 'resume': {
      const current = habit.pauses.find(({ until }) => until === null)
      if (!current) return state
      const pauses = habit.pauses.filter(({ until }) => until !== null)
      return replaceHabit(state, { ...habit, pauses: current.from < today ? [...pauses, { ...current, until: today }] : pauses })
    }
    case 'skip':
      if (status !== 'due' || today < habit.createdOn) throw new Error('There is no scheduled session to skip today.')
      return { ...state, skips: [...state.skips, { habitId: habit.id, day: today }] }
    case 'undo': {
      const day = action.day ?? today
      if (day > today) throw new Error('This session is in the future.')
      return {
        ...state,
        completions: state.completions.filter(({ habitId, scheduledFor }) => habitId !== habit.id || scheduledFor !== day),
        skips: state.skips.filter((skip) => skip.habitId !== habit.id || skip.day !== day),
      }
    }
    case 'complete': {
      if (status === 'complete') throw new Error('You have already completed this session.')
      if (status !== 'due' || today < habit.createdOn || isPausedOn(habit, today)) {
        throw new Error('There is no scheduled session to complete today.')
      }

      const amount = habit.unit === 'session' ? 1 : action.amount
      if (!Number.isInteger(amount) || amount < (habit.minimum ?? 1) || amount > 1440) {
        throw new Error(`Log between ${habit.minimum ?? 1} and 1,440 minutes to complete this session.`)
      }
      const completion = {
        id: `${habit.id}:${today}`, habitId: habit.id, scheduledFor: today, completedAt: now.toISOString(), amount, unit: habit.unit,
      }
      return unlockProgress({ ...state, completions: [...state.completions, completion] }, habit, today)
    }
  }
}

export function emptyWorld(timeZone: string): WorldState {
  return { preferences: { timeZone, sound: false }, habits: [], completions: [], skips: [], journal: [] }
}
