import { motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useWorld } from '../app/worldContext'
import { localDateAt } from '../domain/calendar'
import type { WorldHabit } from '../domain/habits'
import { constructionFor } from '../domain/progression'
import { sessionStatus } from '../domain/sessions'
import { describeSchedule, SESSION_LABEL } from './habitPresentation'
import { Icon } from './Icon'

export function HabitCheckIn({ habit }: { habit: WorldHabit }) {
  const { state, now, dispatch } = useWorld()
  const today = localDateAt(now, habit.timeZone)
  const status = sessionStatus(state, habit, today, today)
  const progress = constructionFor(state, habit)
  const [entered, setEntered] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const id = useId()
  const reducedMotion = useReducedMotion()
  const amount = entered ?? habit.minimum?.toString() ?? ''

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    await dispatch({ kind: 'complete', habitId: habit.id, amount: Number(amount) })
    setSaving(false)
  }

  return (
    <li className="check-in" data-status={status}>
      <div className="check-in-heading">
        <span className="check-in-mark">
          {status === 'complete' ? (
            <motion.span initial={reducedMotion ? false : { scale: 0.55 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 390, damping: 19 }}>
              <Icon name="check" size={20} />
            </motion.span>
          ) : <Icon name={habit.unit === 'minutes' ? 'clock' : 'sprout'} size={19} />}
        </span>
        <div>
          <h3>{habit.name}</h3>
          <p>{progress.stage?.name ?? 'Hidden clearing'} <span aria-hidden="true">·</span> {describeSchedule(habit.schedule)}</p>
        </div>
      </div>
      {status === 'due' ? (
        <form className="check-in-actions" onSubmit={complete}>
          {habit.unit === 'minutes' && (
            <label className="minutes-entry" htmlFor={id}>
              <span className="sr-only">Minutes for {habit.name}</span>
              <input id={id} type="number" min={habit.minimum ?? 1} max="1440" step="1" required value={amount} placeholder="Min" onChange={(event) => setEntered(event.target.value)} />
              <span aria-hidden="true">min</span>
            </label>
          )}
          <button type="submit" className="button compact primary" disabled={saving} aria-label={`Complete ${habit.name}`}><Icon name="check" size={16} /> Complete</button>
          <button type="button" className="text-button" onClick={() => { void dispatch({ kind: 'skip', habitId: habit.id }) }} aria-label={`Skip ${habit.name} today`}>Skip today</button>
        </form>
      ) : (
        <div className="check-in-actions">
          <span className="status-label">{SESSION_LABEL[status]}</span>
          {(status === 'complete' || status === 'skipped') && (
            <button type="button" className="text-button" aria-label={`Undo ${habit.name}`} onClick={() => { void dispatch({ kind: 'undo', habitId: habit.id }) }}>Undo</button>
          )}
        </div>
      )}
    </li>
  )
}
