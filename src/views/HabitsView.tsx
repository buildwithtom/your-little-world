import { Link } from 'react-router'
import { useWorld } from '../app/worldContext'
import { describeSchedule, VITALITY_LABEL } from '../components/habitPresentation'
import { Icon } from '../components/Icon'
import { localDateAt } from '../domain/calendar'
import type { WorldHabit } from '../domain/habits'
import { archetypeFor, constructionFor } from '../domain/progression'
import { ACTIVE_ZONE_LIMIT } from '../domain/progressionConfig'
import { buildingVitality, isActive } from '../domain/sessions'

export function HabitsView({ addHabit, editHabit }: { addHabit: () => void; editHabit: (habit: WorldHabit) => void }) {
  const { state, now, dispatch, readError } = useWorld()
  const habits = state.habits.filter(isActive)

  return (
    <section className="paper-page">
      <div className="page-heading">
        <h1 id="page-title">Habits</h1>
        <button type="button" className="button primary" disabled={habits.length >= ACTIVE_ZONE_LIMIT || !!readError} onClick={addHabit}><Icon name="plus" size={18} /> Add a habit</button>
      </div>
      {habits.length === 0 ? <p className="empty-page">Add a habit to uncover a new clearing.</p> : (
        <ul className="habit-list">
          {habits.map((habit) => {
            const today = localDateAt(now, habit.timeZone)
            const progress = constructionFor(state, habit)
            const pause = habit.pauses.find(({ until }) => until === null)
            return (
              <li key={habit.id} className="paper-panel habit-row">
                <span className="panel-symbol"><Icon name={progress.revealed ? 'house' : 'sprout'} /></span>
                <div className="habit-row-copy">
                  <h2>{habit.name}</h2>
                  <p>{describeSchedule(habit.schedule)} · {habit.unit === 'session' ? 'Session' : `${habit.minimum ?? 1}+ min`}{habit.category ? ` · ${habit.category}` : ''}</p>
                  <p>{progress.revealed ? archetypeFor(habit).name : (progress.stage?.name ?? 'Hidden clearing')} · {pause && pause.from > today ? 'Pause starts tomorrow' : VITALITY_LABEL[buildingVitality(state, habit, today)]}</p>
                </div>
                <div className="habit-row-actions">
                  <button type="button" className="button secondary compact" aria-label={`Edit ${habit.name}`} onClick={() => editHabit(habit)} disabled={!!readError}>Edit</button>
                  <button type="button" className="button secondary compact" disabled={!!readError}
                    aria-label={`${pause ? 'Resume' : 'Pause'} ${habit.name}`}
                    onClick={() => { void dispatch({ kind: pause ? 'resume' : 'pause', habitId: habit.id }) }}
                  >{pause ? 'Resume' : 'Pause'}</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {habits.length > 0 && <Link to="/" className="linked-action">Check in on the world</Link>}
    </section>
  )
}
