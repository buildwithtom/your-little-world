import type { LocalDate } from './calendar'
import type { Completion, HabitCategory, WorldHabit } from './habits'

export interface WorldZone {
  id: string
  name: string
}

export interface BuildingArchetype {
  id: string
  name: string
  category: HabitCategory
  clue: string
}

export interface ConstructionStage {
  id: string
  name: string
  threshold: number
  message: string
}

export type BuildingVitality = 'thriving' | 'paused' | 'quiet' | 'neglected' | 'recovering'

export interface WorldMilestone {
  id: string
  name: string
  threshold: number
  contributors: number
  message: string
}

export type JournalEvent =
  | { id: string; day: LocalDate; kind: 'reservation'; habitId: string }
  | { id: string; day: LocalDate; kind: 'construction'; habitId: string; stageId: string }
  | { id: string; day: LocalDate; kind: 'world'; milestoneId: string }

export interface UserPreferences {
  timeZone: string
  sound: boolean
}

export interface SkippedSession {
  habitId: string
  day: LocalDate
}

export interface WorldState {
  preferences: UserPreferences
  habits: readonly WorldHabit[]
  completions: readonly Completion[]
  skips: readonly SkippedSession[]
  journal: readonly JournalEvent[]
}
