import { useWorld } from '../app/worldContext'
import { Icon } from '../components/Icon'
import { formatDate } from '../domain/calendar'
import { describeEvent } from '../domain/progression'

export function JournalView() {
  const { state } = useWorld()
  const events = [...state.journal].reverse().sort((first, second) => second.day.localeCompare(first.day))
  return (
    <section className="paper-page">
      <div className="page-heading"><h1 id="page-title">Journal</h1></div>
      {events.length === 0 ? <p className="empty-page">New clearings and milestones will be remembered here.</p> : (
        <ol className="journal-list">
          {events.map((event) => {
            const { title, message } = describeEvent(state, event)
            return (
              <li key={event.id}>
                <span className="journal-dot"><Icon name={event.kind === 'world' ? 'lantern' : 'sprout'} size={17} /></span>
                <article className="paper-panel journal-entry">
                  <time dateTime={event.day}>{formatDate(event.day, { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                  <h2>{title}</h2>
                  <p>{message}</p>
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
