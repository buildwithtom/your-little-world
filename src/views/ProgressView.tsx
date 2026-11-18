import { useWorld } from '../app/worldContext'
import { SESSION_LABEL, VITALITY_LABEL } from '../components/habitPresentation'
import { formatDate, localDateAt, shiftDate } from '../domain/calendar'
import { archetypeFor, constructionFor } from '../domain/progression'
import { buildingVitality, habitMetrics, isActive, sessionStatus } from '../domain/sessions'

export function ProgressView() {
  const { state, now, dispatch, readError } = useWorld()
  const habits = state.habits.filter(isActive)
  return (
    <section className="paper-page">
      <div className="page-heading"><h1 id="page-title">Progress</h1></div>
      {!habits.length && <p className="empty-page">Your progress will grow with each completed session.</p>}
      <div className="progress-list">
        {habits.map((habit) => {
          const today = localDateAt(now, habit.timeZone)
          const { stage, lifetime, next, revealed } = constructionFor(state, habit)
          const metrics = habitMetrics(state, habit, today)
          const vitality = buildingVitality(state, habit, today)
          const history = Array.from({ length: 14 }, (_, index) => shiftDate(today, index - 13))
            .filter((day) => day >= habit.createdOn)
          return (
            <article className="paper-panel progress-card" key={habit.id}>
              <div className="progress-heading">
                <div><h2>{habit.name}</h2>{revealed && <p>{archetypeFor(habit).name}</p>}</div>
                <span className="vitality-badge" data-vitality={vitality}>{VITALITY_LABEL[vitality]}</span>
              </div>
              <dl className="progress-metrics">
                <div><dt>Current streak</dt><dd>{metrics.streak}</dd></div>
                <div><dt>Last 30 opportunities</dt><dd>{metrics.rate === null ? '—' : `${metrics.rate}%`}</dd></div>
                <div><dt>Lifetime sessions</dt><dd>{metrics.lifetime}</dd></div>
              </dl>
              <div className="construction-progress">
                <strong>{stage?.name ?? 'Hidden clearing'}</strong>
                {next && <>
                  <p>{lifetime} of {next.threshold} sessions for {next.name.toLowerCase()}</p>
                  <progress value={lifetime} max={next.threshold} aria-label="Sessions toward the next construction stage" />
                </>}
              </div>
              <details className="history">
                <summary>Recent history</summary>
                <ul className="history-list">
                  {[...history].reverse().map((day) => {
                    const status = sessionStatus(state, habit, day, today)
                    const completion = state.completions.find((record) => record.habitId === habit.id && record.scheduledFor === day)
                    return (
                      <li key={day}>
                        <time dateTime={day}>{formatDate(day, { weekday: 'short', month: 'short', day: 'numeric' })}</time>
                        <span data-status={status}>{SESSION_LABEL[status]}{completion?.unit === 'minutes' ? ` · ${completion.amount} min` : ''}</span>
                        {(status === 'complete' || status === 'skipped') && (
                          <button type="button" className="text-button" disabled={!!readError}
                            aria-label={`Undo ${habit.name} for ${day}`}
                            onClick={() => { void dispatch({ kind: 'undo', habitId: habit.id, day }) }}
                          >Undo</button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </details>
            </article>
          )
        })}
      </div>
    </section>
  )
}
