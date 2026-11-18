import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { WORLD_STORAGE_KEY } from '../data/worldRepository'
import type { WorldRepository } from '../data/worldRepository'
import { localDateAt } from '../domain/calendar'
import { describeEvent } from '../domain/progression'
import { buildingVitality } from '../domain/sessions'
import type { WorldState } from '../domain/world'
import { applyWorldAction, emptyWorld } from '../domain/worldActions'
import type { WorldAction } from '../domain/worldActions'
import { playCompletionSound } from './completionSound'
import { WorldContext } from './worldContext'

const systemNow = () => new Date()
const getTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Something interrupted the update. Try again.'
}

export function WorldProvider({ children, repository, clock = systemNow }: {
  children: ReactNode
  repository: WorldRepository
  clock?: () => Date
}) {
  const [saved, setSaved] = useState(() => {
    try {
      return { state: repository.load(), readError: null }
    } catch (error) {
      return { state: emptyWorld(getTimeZone()), readError: messageFrom(error) }
    }
  })
  const [clockTime, setClockTime] = useState(clock)
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null)
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const now = simulatedTime ?? clockTime
  const { state, readError } = saved

  useEffect(() => {
    const tick = () => { if (!document.hidden) setClockTime(clock()) }
    const timer = window.setInterval(tick, 15_000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [clock])

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== WORLD_STORAGE_KEY && event.key !== null) return
      try {
        setSaved({ state: repository.load(), readError: null })
      } catch (error) {
        setSaved((current) => ({ ...current, readError: messageFrom(error) }))
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [repository])

  async function dispatch(action: WorldAction): Promise<boolean> {
    if (readError) {
      setError('Restore a backup in Settings before making changes.')
      return false
    }
    const timestamp = simulatedTime ?? clock()
    let contextualMessage: string | undefined
    try {
      const next = await repository.update((current) => {
        const updated = applyWorldAction(current, action, timestamp)
        const event = updated.journal.length > current.journal.length ? updated.journal.at(-1) : undefined
        if (event) contextualMessage = describeEvent(updated, event).message
        if (!event && action.kind === 'complete') {
          const habit = updated.habits.find(({ id }) => id === action.habitId)
          if (habit && buildingVitality(updated, habit, localDateAt(timestamp, habit.timeZone)) === 'recovering') {
            contextualMessage = 'The lights are on again.'
          }
        }
        return updated
      })
      setSaved({ state: next, readError: null })
      if (!simulatedTime) setClockTime(timestamp)
      setError(null)
      if (contextualMessage) setNotice(contextualMessage)
      if (action.kind === 'complete' && next.preferences.sound) playCompletionSound()
      return true
    } catch (error) {
      setError(messageFrom(error))
      return false
    }
  }

  async function restore(backup: WorldState) {
    try {
      setSaved({ state: await repository.restore(backup), readError: null })
      setError(null)
      setNotice(undefined)
      return true
    } catch (error) {
      setError(messageFrom(error))
      return false
    }
  }

  return (
    <WorldContext.Provider value={{
      state, now, today: localDateAt(now, state.preferences.timeZone), notice, error, readError,
      dispatch, restore, setSimulatedTime, clearMessage: () => { setError(null); setNotice(undefined) },
    }}>
      {children}
    </WorldContext.Provider>
  )
}
