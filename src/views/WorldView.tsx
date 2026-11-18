import { useState } from 'react'
import { useWorld } from '../app/worldContext'
import { HabitCheckIn } from '../components/HabitCheckIn'
import { VITALITY_LABEL } from '../components/habitPresentation'
import { Icon } from '../components/Icon'
import { localDateAt } from '../domain/calendar'
import { archetypeFor, constructionFor } from '../domain/progression'
import { ACTIVE_ZONE_LIMIT, WORLD_MILESTONES, ZONES } from '../domain/progressionConfig'
import { buildingVitality, isActive, sessionStatus } from '../domain/sessions'
import type { SceneSite } from '../world/WorldScene'
import { WorldScene } from '../world/WorldScene'

export function WorldView({ addHabit }: { addHabit: () => void }) {
  const { state, now, notice, clearMessage, readError } = useWorld()
  const [expanded, setExpanded] = useState(true)
  const active = state.habits.filter(isActive)
  const sessions = active.map((habit) => {
    const day = localDateAt(now, habit.timeZone)
    return { habit, day, status: sessionStatus(state, habit, day, day) }
  })
  const scheduled = sessions.filter(({ status }) => status !== 'unscheduled')
  const completed = scheduled.filter(({ status }) => status === 'complete').length
  const required = scheduled.filter(({ status }) => status === 'complete' || status === 'due').length
  const shared = new Set(state.journal.flatMap((event) => event.kind === 'world' ? [event.milestoneId] : []))
  const sites: SceneSite[] = sessions.map(({ habit, day }) => {
    const progress = constructionFor(state, habit)
    const archetype = archetypeFor(habit)
    const vitality = buildingVitality(state, habit, day)
    const zone = ZONES.find(({ id }) => id === habit.zoneId)
    return {
      id: habit.zoneId,
      title: progress.revealed ? archetype.name : (zone?.name ?? 'Clearing'),
      stage: progress.stageNumber,
      stageName: progress.stage?.name ?? 'Hidden clearing',
      archetype: archetype.id,
      vitality,
      detail: progress.revealed ? VITALITY_LABEL[vitality]
        : progress.stageNumber >= 3 ? archetype.clue : `Reserved for ${habit.name}`,
    }
  })
  const available = ACTIVE_ZONE_LIMIT - active.length

  return (
    <div className="world-layout">
      <WorldScene
        sites={sites} lantern={shared.has('lantern-path')} garden={shared.has('cottage-garden')}
        message={notice} dismiss={clearMessage} welcome={active.length === 0}
      />
      <aside className="valley-sidebar" aria-label="Habit panel">
        <section className="paper-panel today-panel" aria-labelledby="today-heading">
          <div className="panel-heading">
            <div className="panel-title">
              <span className="panel-symbol"><Icon name="calendar" size={19} /></span>
              <h2 id="today-heading">Today’s habits</h2>
            </div>
            <button
              type="button" className="mobile-panel-toggle icon-button" aria-label={expanded ? 'Collapse today’s habits' : 'Expand today’s habits'}
              aria-expanded={expanded} aria-controls="today-panel-body" onClick={() => setExpanded(!expanded)}
            ><Icon name="chevron" /></button>
          </div>
          <div className="today-body" id="today-panel-body" data-expanded={expanded}>
            {active.length === 0 ? (
              <div className="empty-clearing">
                <span className="empty-emblem"><Icon name="sprout" size={27} /></span>
                <p>Your first clearing is waiting.</p>
              </div>
            ) : (
              <>
                {required > 0 && (
                  <div className="daily-progress">
                    <div><span>Scheduled today</span><strong>{completed} of {required} complete</strong></div>
                    <progress value={completed} max={required} aria-label="Today’s scheduled sessions completed" />
                  </div>
                )}
                {scheduled.length ? (
                  <ul className="check-in-list">
                    {scheduled.map(({ habit, day }) => <HabitCheckIn key={`${habit.id}:${day}`} habit={habit} />)}
                  </ul>
                ) : <p className="rest-day">Nothing scheduled today. Enjoy a little breathing room.</p>}
              </>
            )}
            <button className="button primary new-habit" type="button" onClick={addHabit} disabled={available === 0 || !!readError}>
              <Icon name="plus" size={17} /> Add a habit
            </button>
            <p className="capacity">{available ? `${available} of ${ACTIVE_ZONE_LIMIT} clearings available` : 'All clearings reserved'}</p>
          </div>
        </section>
        <section className="paper-panel growth-panel" aria-labelledby="growth-heading">
          <div className="panel-heading">
            <div className="panel-title">
              <span className="panel-symbol"><Icon name="lantern" size={19} /></span>
              <h2 id="growth-heading">Valley milestones</h2>
            </div>
          </div>
          <ul className="world-milestones">
            {WORLD_MILESTONES.map((milestone) => (
              <li key={milestone.id} data-unlocked={shared.has(milestone.id)}>
                <span className="milestone-icon"><Icon name={shared.has(milestone.id) ? 'check' : 'lock'} size={16} /></span>
                <div><strong>{milestone.name}</strong><small>{shared.has(milestone.id) ? 'Unlocked' : `${milestone.threshold} sessions across ${milestone.contributors} habits`}</small></div>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
