import type { LocalDate } from './calendar'
import type { WorldHabit } from './habits'
import { ARCHETYPES, REVEAL_STAGE, STAGES, WORLD_MILESTONES } from './progressionConfig'
import { isActive } from './sessions'
import type { JournalEvent, WorldState } from './world'

export function archetypeFor(habit: WorldHabit) {
  return ARCHETYPES.find(({ id }) => id === habit.archetypeId) ?? ARCHETYPES[0]
}

export function constructionFor(state: WorldState, habit: WorldHabit) {
  const journalStages = new Set(state.journal.flatMap((event) =>
    event.kind === 'construction' && event.habitId === habit.id ? [event.stageId] : [],
  ))
  const stageNumber = STAGES.reduce((current, stage, index) =>
    journalStages.has(stage.id) ? index + 1 : current, 0)
  const stage = STAGES[stageNumber - 1]
  const next = STAGES[stageNumber]
  const lifetime = state.completions.filter(({ habitId }) => habitId === habit.id).length
  return { stageNumber, stage, next, lifetime, revealed: journalStages.has(REVEAL_STAGE) }
}

export function unlockProgress(state: WorldState, habit: WorldHabit, day: LocalDate): WorldState {
  const existingIds = new Set(state.journal.map(({ id }) => id))
  const unlocked: JournalEvent[] = []
  const counts = new Map<string, number>()
  for (const completion of state.completions) {
    counts.set(completion.habitId, (counts.get(completion.habitId) ?? 0) + 1)
  }

  for (const stage of STAGES) {
    const id = `construction:${habit.id}:${stage.id}`
    if ((counts.get(habit.id) ?? 0) >= stage.threshold && !existingIds.has(id)) {
      unlocked.push({ id, day, kind: 'construction', habitId: habit.id, stageId: stage.id })
    }
  }

  const contributions = state.habits.filter(isActive).map(({ id }) => counts.get(id) ?? 0)
  const total = contributions.reduce((sum, amount) => sum + amount, 0)
  const contributors = contributions.filter((amount) => amount > 0).length
  for (const milestone of WORLD_MILESTONES) {
    const id = `world:${milestone.id}`
    if (total >= milestone.threshold && contributors >= milestone.contributors && !existingIds.has(id)) {
      unlocked.push({ id, day, kind: 'world', milestoneId: milestone.id })
    }
  }

  return unlocked.length ? { ...state, journal: [...state.journal, ...unlocked] } : state
}

export function describeEvent(state: WorldState, event: JournalEvent): { title: string; message: string } {
  if (event.kind === 'world') {
    const milestone = WORLD_MILESTONES.find(({ id }) => event.milestoneId === id)
    return { title: milestone?.name ?? 'World milestone', message: milestone?.message ?? '' }
  }

  const habit = state.habits.find(({ id }) => event.habitId === id)
  if (event.kind === 'reservation') {
    return { title: habit?.name ?? 'New habit', message: 'A quiet corner of the hillside has opened up.' }
  }

  if (event.stageId === REVEAL_STAGE && habit) {
    const name = archetypeFor(habit).name
    return { title: habit.name, message: `The ${name.toLowerCase()} is ready to welcome you.` }
  }
  const stage = STAGES.find(({ id }) => event.stageId === id)
  return { title: habit?.name ?? 'Construction', message: stage?.message ?? '' }
}
