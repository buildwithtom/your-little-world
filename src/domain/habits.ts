import type { LocalDate, UtcTimestamp } from './calendar'

/** ISO weekday numbering, Monday through Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface DailySchedule {
  kind: 'daily'
}

export interface WeeklySchedule {
  kind: 'weekly'
  weekdays: readonly [Weekday, ...Weekday[]]
}

export type HabitSchedule = DailySchedule | WeeklySchedule

export interface Habit {
  id: string
  name: string
  schedule: HabitSchedule
  /** IANA time zone used to resolve the habit's local calendar dates. */
  timeZone: string
  createdAt: UtcTimestamp
  archivedAt?: UtcTimestamp
}

export interface HabitCompletion {
  id: string
  habitId: Habit['id']
  /** The scheduled date in the habit's local calendar. */
  scheduledFor: LocalDate
  completedAt: UtcTimestamp
}

export const CATEGORIES = [
  'Music', 'Reading', 'Fitness', 'Making', 'Gardening', 'Mindfulness', 'Other',
] as const
export type HabitCategory = typeof CATEGORIES[number]
export type TrackingUnit = 'session' | 'minutes'

export interface ScheduleRevision {
  from: LocalDate
  schedule: HabitSchedule
}

export interface PausePeriod {
  from: LocalDate
  until: LocalDate | null
}

export interface HabitDraft {
  name: string
  category: HabitCategory | null
  schedule: HabitSchedule
  unit: TrackingUnit
  minimum: number | null
}

export interface WorldHabit extends Habit {
  createdOn: LocalDate
  category: HabitCategory | null
  unit: TrackingUnit
  minimum: number | null
  zoneId: string
  archetypeId: string
  schedules: readonly ScheduleRevision[]
  pauses: readonly PausePeriod[]
}

export interface Completion extends HabitCompletion {
  amount: number
  unit: TrackingUnit
}

/** A day may have either a qualifying completion or an intentional skip. */
export type SessionStatus = 'complete' | 'skipped' | 'paused' | 'unscheduled' | 'missed' | 'due'

const categoryKeywords: readonly [HabitCategory, RegExp][] = [
  ['Music', /\b(guitar|piano|music|sing|violin|drums|ukulele|song|flute|cello)\b/i],
  ['Reading', /\b(read|reading|book|books|study|learn|language)\b/i],
  ['Fitness', /\b(run|running|walk|walking|lift|exercise|yoga|workout|gym|cycle|swim|cycling)\b/i],
  ['Making', /\b(draw|drawing|paint|painting|craft|knit|code|write|writing|sew|woodwork|sketch)\b/i],
  ['Gardening', /\b(garden|gardening|plant|plants|water|seed|herbs|grow)\b/i],
  ['Mindfulness', /\b(meditate|meditation|mindful|mindfulness|breathe|journal|stretch)\b/i],
]

export function suggestCategory(name: string): HabitCategory | null {
  return categoryKeywords.find(([, keywords]) => keywords.test(name))?.[0] ?? null
}
