import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { createWorldRepository, WORLD_STORAGE_KEY } from './data/worldRepository'
import './app/styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing application root.')

const storage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
}
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const repository = createWorldRepository(
  storage,
  zone,
  async (write) => navigator.locks ? navigator.locks.request(WORLD_STORAGE_KEY, write) : write(),
)

createRoot(root).render(
  <StrictMode><App repository={repository} /></StrictMode>,
)
