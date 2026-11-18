import { useState } from 'react'
import type { FormEvent } from 'react'
import { useWorld } from '../app/worldContext'
import { CATEGORIES, suggestCategory } from '../domain/habits'
import type { HabitCategory, HabitDraft, TrackingUnit, Weekday, WorldHabit } from '../domain/habits'
import { Dialog } from './Dialog'

const weekdays: readonly [Weekday, string, string][] = [
  [1, 'Mon', 'Monday'], [2, 'Tue', 'Tuesday'], [3, 'Wed', 'Wednesday'], [4, 'Thu', 'Thursday'],
  [5, 'Fri', 'Friday'], [6, 'Sat', 'Saturday'], [7, 'Sun', 'Sunday'],
]

export function HabitEditor({ habit, close }: { habit: WorldHabit | undefined; close: () => void }) {
  const { dispatch, error, clearMessage } = useWorld()
  const [name, setName] = useState(habit?.name ?? '')
  const [category, setCategory] = useState<HabitCategory | ''>(habit?.category ?? '')
  const [categoryChanged, setCategoryChanged] = useState(habit !== undefined)
  const [schedule, setSchedule] = useState(habit?.schedule.kind ?? 'daily')
  const [days, setDays] = useState<readonly Weekday[]>(habit?.schedule.kind === 'weekly' ? habit.schedule.weekdays : [])
  const [unit, setUnit] = useState<TrackingUnit>(habit?.unit ?? 'session')
  const [minimum, setMinimum] = useState(habit?.minimum?.toString() ?? '')
  const [validation, setValidation] = useState<string>()
  const [saving, setSaving] = useState(false)
  const selectedCategory = categoryChanged ? category : (suggestCategory(name) ?? '')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const [first, ...rest] = [...days].sort((a, b) => a - b)
    if (schedule === 'weekly' && first === undefined) {
      setValidation('Choose at least one scheduled day.')
      return
    }
    setValidation(undefined)
    setSaving(true)
    const draft: HabitDraft = {
      name, category: selectedCategory || null,
      schedule: schedule === 'weekly' && first !== undefined ? { kind: 'weekly', weekdays: [first, ...rest] } : { kind: 'daily' },
      unit, minimum: minimum ? Number(minimum) : null,
    }
    const saved = await dispatch(habit
      ? { kind: 'edit', habitId: habit.id, draft }
      : { kind: 'add', id: crypto.randomUUID(), draft })
    setSaving(false)
    if (saved) close()
  }

  return (
    <Dialog title={habit ? 'Edit habit' : 'Add a habit'} close={close}>
      <form className="form-stack" onSubmit={save} onChange={() => {
        if (validation) setValidation(undefined)
        if (error) clearMessage()
      }}>
        <label className="field">Habit name
          <input required maxLength={80} autoFocus value={name} placeholder="e.g. Practice guitar" onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">Category <small>Optional</small>
          <select value={selectedCategory} onChange={(event) => {
            setCategory(event.target.value as HabitCategory | '')
            setCategoryChanged(true)
          }}>
            <option value="">No category</option>
            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Schedule</legend>
          <div className="choice-row">
            <label><input type="radio" name="schedule" checked={schedule === 'daily'} onChange={() => setSchedule('daily')} /> Every day</label>
            <label><input type="radio" name="schedule" checked={schedule === 'weekly'} onChange={() => setSchedule('weekly')} /> Selected weekdays</label>
          </div>
          {schedule === 'weekly' && (
            <div className="weekday-choices">
              {weekdays.map(([day, label, fullLabel]) => (
                <label key={day}>
                  <input type="checkbox" checked={days.includes(day)} aria-label={fullLabel} onChange={() =>
                    setDays((previous) => previous.includes(day) ? previous.filter((value) => value !== day) : [...previous, day])} />
                  <span aria-hidden="true">{label}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <label className="field">Track by
          <select value={unit} onChange={(event) => setUnit(event.target.value as TrackingUnit)}>
            <option value="session">Session</option>
            <option value="minutes">Minutes</option>
          </select>
        </label>
        {unit === 'minutes' && (
          <label className="field">Minimum minutes <small>Optional</small>
            <input type="number" min="1" max="1440" step="1" value={minimum} placeholder="1" onChange={(event) => setMinimum(event.target.value)} />
          </label>
        )}
        {(validation ?? error) && <p className="inline-error" role="alert">{validation ?? error}</p>}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close}>Cancel</button>
          <button type="submit" className="button primary" disabled={saving}>{habit ? 'Save changes' : 'Save habit'}</button>
        </div>
      </form>
    </Dialog>
  )
}
