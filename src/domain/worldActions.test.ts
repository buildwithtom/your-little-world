import { describe, expect, it } from 'vitest'
import { isLocalDate, localDateAt, shiftDate } from './calendar'
import type { HabitDraft, WorldHabit } from './habits'
import { constructionFor } from './progression'
import { STAGES } from './progressionConfig'
import { buildingVitality, habitMetrics, sessionStatus } from './sessions'
import type { WorldState } from './world'
import { applyWorldAction, emptyWorld } from './worldActions'

const monday = '2026-11-16'
const atNoon = (day: string) => new Date(`${day}T12:00:00Z`)
const guitar: HabitDraft = { name: 'Practice guitar', category: null, schedule: { kind: 'daily' }, unit: 'session', minimum: null }

function add(state = emptyWorld('UTC'), id = 'guitar', draft = guitar) {
  return applyWorldAction(state, { kind: 'add', id, draft }, atNoon(monday))
}

function habitFrom(state: WorldState, id = 'guitar'): WorldHabit {
  const habit = state.habits.find((item) => item.id === id)
  if (!habit) throw new Error('Missing test habit')
  return habit
}

function complete(state: WorldState, offset: number, habitId = 'guitar', amount = 1) {
  return applyWorldAction(state, { kind: 'complete', habitId, amount }, atNoon(shiftDate(monday, offset)))
}

describe('world actions', () => {
  it('reserves a deterministic archetype and zone without awarding a session', () => {
    const state = add()
    const habit = habitFrom(state)
    expect(habit).toMatchObject({ archetypeId: 'studio', zoneId: 'fern-grove', createdOn: monday })
    expect(state.completions).toHaveLength(0)
    expect(constructionFor(state, habit)).toMatchObject({ stageNumber: 0, revealed: false })
    expect(state.journal.map(({ kind }) => kind)).toEqual(['reservation'])
    const filled = add(add(state, 'reading', { ...guitar, name: 'Read' }), 'training', { ...guitar, name: 'Run' })
    expect(new Set(filled.habits.map(({ zoneId }) => zoneId)).size).toBe(3)
    expect(() => add(filled, 'more')).toThrow('All three clearings')
  })

  it('keeps earlier scheduled dates when a completed day is edited', () => {
    const finished = complete(add(), 0)
    const updated = applyWorldAction(finished, {
      kind: 'edit', habitId: 'guitar', draft: { ...guitar, schedule: { kind: 'weekly', weekdays: [3] } },
    }, atNoon(monday))
    const habit = habitFrom(updated)
    const day = shiftDate(monday, 2)
    expect(habit.schedules.map(({ from }) => from)).toEqual([monday, '2026-11-17'])
    expect(sessionStatus(updated, habit, monday, day)).toBe('complete')
    expect(sessionStatus(updated, habit, '2026-11-17', day)).toBe('unscheduled')
    expect(sessionStatus(updated, habit, day, day)).toBe('due')
  })

  it('records minutes at or above the target and prevents duplicate completions', () => {
    const state = add(emptyWorld('UTC'), 'guitar', { ...guitar, unit: 'minutes', minimum: 15 })
    expect(() => complete(state, 0, 'guitar', 14)).toThrow('between 15')
    const finished = complete(state, 0, 'guitar', 18)
    expect(finished.completions[0]).toMatchObject({ amount: 18, unit: 'minutes', scheduledFor: monday })
    expect(() => complete(finished, 0, 'guitar', 18)).toThrow('already completed')
  })

  it('undoes an accidental log without removing or duplicating an earned stage', () => {
    const state = complete(add(), 0)
    const undone = applyWorldAction(state, { kind: 'undo', habitId: 'guitar', day: monday }, atNoon('2026-11-17'))
    expect(undone.completions).toHaveLength(0)
    expect(constructionFor(undone, habitFrom(undone)).stageNumber).toBe(1)
    const again = complete(undone, 1)
    expect(again.journal.filter(({ kind }) => kind === 'construction')).toHaveLength(1)
  })

  it('unlocks all eight stages at the configured cumulative milestones', () => {
    let state = add()
    for (let day = 1; day <= 35; day += 1) {
      state = complete(state, day - 1)
      const progress = constructionFor(state, habitFrom(state))
      expect(progress.stageNumber).toBe(STAGES.filter(({ threshold }) => threshold <= day).length)
      expect(progress.revealed).toBe(day >= 14)
    }
    expect(state.journal.filter((event) => event.kind === 'construction').map((event) => event.stageId))
      .toEqual(STAGES.map(({ id }) => id))
    expect(state.journal.filter(({ kind }) => kind === 'world')).toHaveLength(0)
  })

  it('unlocks both shared milestones when two active habits contribute', () => {
    let state = add(add(), 'reader', { ...guitar, name: 'Read a book' })
    for (let offset = 0; offset < 18; offset += 1) state = complete(state, offset)
    expect(state.journal.filter(({ kind }) => kind === 'world')).toHaveLength(0)
    state = complete(state, 17, 'reader')
    expect(state.journal.filter((event) => event.kind === 'world').map((event) => event.milestoneId))
      .toEqual(['lantern-path', 'cottage-garden'])
    const corrected = applyWorldAction(state, { kind: 'undo', habitId: 'reader' }, atNoon(shiftDate(monday, 17)))
    expect(corrected.journal).toEqual(state.journal)
  })
})

describe('scheduled-session history', () => {
  it('treats off days and skips as excused, and counts only missed scheduled days', () => {
    let state = add(emptyWorld('UTC'), 'guitar', { ...guitar, schedule: { kind: 'weekly', weekdays: [1, 3, 5] } })
    state = complete(state, 0)
    state = applyWorldAction(state, { kind: 'skip', habitId: 'guitar' }, atNoon('2026-11-18'))
    const today = '2026-11-21'
    const habit = habitFrom(state)
    expect(sessionStatus(state, habit, '2026-11-17', today)).toBe('unscheduled')
    expect(sessionStatus(state, habit, '2026-11-18', today)).toBe('skipped')
    expect(sessionStatus(state, habit, '2026-11-20', today)).toBe('missed')
    expect(habitMetrics(state, habit, today)).toEqual({ lifetime: 1, streak: 0, rate: 50 })
  })

  it('keeps a paused interval excused after resuming', () => {
    const initial = complete(add(), 0)
    const paused = applyWorldAction(initial, { kind: 'pause', habitId: 'guitar' }, atNoon(monday))
    expect(buildingVitality(paused, habitFrom(paused), monday)).toBe('thriving')
    expect(buildingVitality(paused, habitFrom(paused), '2026-11-19')).toBe('paused')
    expect(() => complete(paused, 3)).toThrow('no scheduled session')
    const resumed = applyWorldAction(paused, { kind: 'resume', habitId: 'guitar' }, atNoon('2026-11-21'))
    const habit = habitFrom(resumed)
    expect(sessionStatus(resumed, habit, '2026-11-19', '2026-11-21')).toBe('paused')
    expect(habitMetrics(resumed, habit, '2026-11-21')).toEqual({ lifetime: 1, streak: 1, rate: 100 })
  })

  it('recovers after a miss without reducing another building’s vitality', () => {
    let state = add(add(), 'reader', { ...guitar, name: 'Read', schedule: { kind: 'weekly', weekdays: [1] } })
    state = complete(complete(state, 0), 0, 'reader')
    const habit = habitFrom(state)
    expect(buildingVitality(state, habit, '2026-11-18')).toBe('quiet')
    expect(buildingVitality(state, habit, '2026-11-20')).toBe('neglected')
    expect(buildingVitality(state, habitFrom(state, 'reader'), '2026-11-20')).toBe('thriving')
    state = complete(state, 4)
    expect(buildingVitality(state, habit, '2026-11-20')).toBe('recovering')
    state = complete(state, 5)
    expect(buildingVitality(state, habit, '2026-11-21')).toBe('thriving')
    expect(constructionFor(state, habit).stageNumber).toBe(2)
  })

  it('uses the configured local calendar at UTC midnight and through daylight saving', () => {
    const instant = new Date('2026-11-17T01:00:00Z')
    expect(localDateAt(instant, 'America/Los_Angeles')).toBe(monday)
    expect(localDateAt(instant, 'Asia/Kolkata')).toBe('2026-11-17')
    expect(localDateAt(new Date('2026-03-09T06:59:00Z'), 'America/Los_Angeles')).toBe('2026-03-08')
    expect(localDateAt(new Date('2026-03-09T07:00:00Z'), 'America/Los_Angeles')).toBe('2026-03-09')
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29')
    expect(isLocalDate('2026-02-29')).toBe(false)
    const state = add(emptyWorld('America/Los_Angeles'))
    const recorded = applyWorldAction(state, { kind: 'complete', habitId: 'guitar', amount: 1 }, instant)
    expect(recorded.completions[0]?.scheduledFor).toBe(monday)
  })
})
