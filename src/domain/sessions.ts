import { isoWeekday, shiftDate } from './calendar'
import type { LocalDate } from './calendar'
import type { HabitSchedule, SessionStatus, WorldHabit } from './habits'
import type { BuildingVitality, WorldState } from './world'

export function isActive(habit: WorldHabit): boolean {
  return habit.archivedAt === undefined
}

export function scheduleOn(habit: WorldHabit, day: LocalDate): HabitSchedule | undefined {
  let schedule: HabitSchedule | undefined
  for (const revision of habit.schedules) {
    if (revision.from > day) break
    schedule = revision.schedule
  }
  return schedule
}

export function isPausedOn(habit: WorldHabit, day: LocalDate): boolean {
  return habit.pauses.some(({ from, until }) => from <= day && (until === null || until > day))
}

function isScheduled(schedule: HabitSchedule | undefined, day: LocalDate): boolean {
  return !!schedule && (
    schedule.kind === 'daily' || schedule.weekdays.some((weekday) => weekday === isoWeekday(day))
  )
}

export function sessionStatus(state: WorldState, habit: WorldHabit, day: LocalDate, today: LocalDate): SessionStatus {
  if (state.completions.some((completion) => completion.habitId === habit.id && completion.scheduledFor === day)) return 'complete'
  if (state.skips.some((skip) => skip.habitId === habit.id && skip.day === day)) return 'skipped'
  if (!isScheduled(scheduleOn(habit, day), day)) return 'unscheduled'
  if (isPausedOn(habit, day)) return 'paused'
  return day < today ? 'missed' : 'due'
}

/** Resolved scheduled opportunities, newest first. Pauses and intentional skips are excused. */
export function recentOpportunities(state: WorldState, habit: WorldHabit, today: LocalDate, limit: number): ('complete' | 'missed')[] {
  const completed = new Set(state.completions.filter(({ habitId }) => habitId === habit.id).map(({ scheduledFor }) => scheduledFor))
  const skipped = new Set(state.skips.filter(({ habitId }) => habitId === habit.id).map(({ day }) => day))
  const opportunities: ('complete' | 'missed')[] = []
  let day = today
  while (day >= habit.createdOn && opportunities.length < limit) {
    if (completed.has(day)) {
      opportunities.push('complete')
    } else if (day < today && !skipped.has(day) && !isPausedOn(habit, day) && isScheduled(scheduleOn(habit, day), day)) {
      opportunities.push('missed')
    }
    if (day === habit.createdOn) break
    day = shiftDate(day, -1)
  }
  return opportunities
}

export function buildingVitality(state: WorldState, habit: WorldHabit, today: LocalDate): BuildingVitality {
  if (isPausedOn(habit, today)) return 'paused'
  const [latest, previous, third] = recentOpportunities(state, habit, today, 3)
  if (latest === 'missed') {
    return previous === 'missed' && third === 'missed' ? 'neglected' : 'quiet'
  }
  if (latest === 'complete') return previous === 'missed' ? 'recovering' : 'thriving'
  return 'quiet'
}

export function habitMetrics(state: WorldState, habit: WorldHabit, today: LocalDate) {
  const opportunities = recentOpportunities(state, habit, today, 30)
  const lifetime = state.completions.filter(({ habitId }) => habitId === habit.id).length
  const completed = opportunities.filter((result) => result === 'complete').length
  // A streak can be longer than the rate's 30-opportunity window.
  const streakHistory = recentOpportunities(state, habit, today, lifetime + 1)
  const firstMiss = streakHistory.indexOf('missed')
  return {
    lifetime,
    streak: firstMiss < 0 ? streakHistory.length : firstMiss,
    rate: opportunities.length ? Math.round(100 * completed / opportunities.length) : null,
  }
}
