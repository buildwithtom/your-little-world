import { createContext, useContext } from 'react'
import type { WorldState } from '../domain/world'
import type { WorldAction } from '../domain/worldActions'

export interface WorldContextValue {
  state: WorldState
  now: Date
  today: string
  error: string | null
  notice: string | undefined
  readError: string | null
  dispatch(action: WorldAction): Promise<boolean>
  restore(backup: WorldState): Promise<boolean>
  clearMessage(): void
  setSimulatedTime(instant: Date | null): void
}

export const WorldContext = createContext<WorldContextValue | null>(null)

export function useWorld() {
  const world = useContext(WorldContext)
  if (!world) throw new Error('The world is unavailable.')
  return world
}
