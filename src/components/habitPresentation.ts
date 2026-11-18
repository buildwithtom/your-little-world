import type { HabitSchedule, SessionStatus } from '../domain/habits'
import type { BuildingVitality } from '../domain/world'

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function describeSchedule(schedule: HabitSchedule): string {
  return schedule.kind === 'daily' ? 'Every day' : [...schedule.weekdays].sort((a, b) => a - b)
    .map((day) => weekdayNames[day - 1]).join(', ')
}

export const VITALITY_LABEL: Record<BuildingVitality, string> = {
  thriving: 'Thriving', paused: 'Paused', quiet: 'Quiet', neglected: 'Neglected', recovering: 'Recovering',
}

export const SESSION_LABEL: Record<SessionStatus, string> = {
  complete: 'Completed', skipped: 'Skipped', paused: 'Paused', unscheduled: 'Unscheduled',
  missed: 'Missed', due: 'Scheduled today',
}
