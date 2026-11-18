import { useState } from 'react'
import { isLocalDate, localDateAt, shiftDate } from '../domain/calendar'
import { useWorld } from './worldContext'

export default function DevTime() {
  const { state, today, setSimulatedTime } = useWorld()
  const [problem, setProblem] = useState<string>()

  function choose(day: string) {
    if (!isLocalDate(day)) return
    const noon = Date.parse(`${day}T12:00:00Z`)
    for (const offset of [0, -3, 3, -6, 6, -12, 12, -15, 15]) {
      const instant = new Date(noon + offset * 3_600_000)
      if (localDateAt(instant, state.preferences.timeZone) === day) {
        setSimulatedTime(instant)
        setProblem(undefined)
        return
      }
    }
    setProblem('That local date does not exist in this time zone.')
  }

  return (
    <details className="dev-time">
      <summary>Development time travel</summary>
      <div>
        <label>Simulated date <input type="date" value={today} onChange={(event) => choose(event.target.value)} /></label>
        <button type="button" className="button compact secondary" onClick={() => choose(shiftDate(today, -1))}>−1 day</button>
        <button type="button" className="button compact secondary" onClick={() => choose(shiftDate(today, 1))}>+1 day</button>
        <button type="button" className="button compact secondary" onClick={() => { setSimulatedTime(null); setProblem(undefined) }}>Use real time</button>
      </div>
      {problem && <p role="alert">{problem}</p>}
    </details>
  )
}
