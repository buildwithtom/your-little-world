import { MotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { HashRouter, Link, matchPath, Navigate, NavLink, Route, Routes, useLocation } from 'react-router'
import { HabitEditor } from '../components/HabitEditor'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import type { WorldRepository } from '../data/worldRepository'
import { formatDate } from '../domain/calendar'
import type { WorldHabit } from '../domain/habits'
import { HabitsView } from '../views/HabitsView'
import { JournalView } from '../views/JournalView'
import { ProgressView } from '../views/ProgressView'
import { SettingsView } from '../views/SettingsView'
import { WorldView } from '../views/WorldView'
import { BRAND } from './brand'
import { ErrorBoundary } from './ErrorBoundary'
import { useWorld } from './worldContext'
import { WorldProvider } from './WorldProvider'

const DevTime = import.meta.env.DEV ? lazy(() => import('./DevTime')) : null

const views = [
  { path: '/', title: 'World', icon: 'world' },
  { path: '/habits', title: 'Habits', icon: 'habits' },
  { path: '/journal', title: 'Journal', icon: 'journal' },
  { path: '/progress', title: 'Progress', icon: 'progress' },
] as const satisfies readonly { path: string; title: string; icon: IconName }[]

function AppShell() {
  const { state, today, readError, error, notice, clearMessage } = useWorld()
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const main = useRef<HTMLElement>(null)
  const [editor, setEditor] = useState<{ habitId?: string } | null>(null)
  const editedHabit = state.habits.find(({ id }) => id === editor?.habitId)
  const view = views.find(({ path }) => matchPath(path, pathname))
  const title = view?.title ?? 'Settings'

  useEffect(() => {
    document.title = `${title} · ${BRAND.name}`
    if (previousPath.current !== pathname) {
      main.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
      previousPath.current = pathname
    }
  }, [pathname, title])

  const addHabit = () => { clearMessage(); setEditor({}) }
  const editHabit = (habit: WorldHabit) => { clearMessage(); setEditor({ habitId: habit.id }) }

  return (
    <>
      <a className="skip-link" href="#page-title" onClick={(event) => {
        event.preventDefault()
        main.current?.focus()
      }}>Skip to content</a>
      <header className="masthead">
        <div className="masthead-inner">
          <Link to="/" className="brand">
            <span className="brand-symbol"><Icon name="sprout" size={22} /></span>
            <span>{BRAND.name}</span>
          </Link>
          <nav className="primary-nav" aria-label="Primary">
            {views.map(({ path, title, icon }) => (
              <NavLink key={path} to={path} end><Icon name={icon} size={18} /><span>{title}</span></NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <time className="header-date" dateTime={today}><Icon name="calendar" size={17} />{formatDate(today, { weekday: 'short', month: 'short', day: 'numeric' })}</time>
            <NavLink className="settings-link icon-button" to="/settings" aria-label="Settings"><Icon name="settings" size={21} /></NavLink>
          </div>
        </div>
      </header>
      <main className="app-main" aria-labelledby="page-title" ref={main} tabIndex={-1}>
        {readError && (
          <div className="app-alert" role="alert">
            <div><strong>The saved world could not be opened.</strong><p>{readError} <Link to="/settings">Restore a backup in Settings.</Link></p></div>
          </div>
        )}
        {!editor && error && (
          <div className="app-alert" role="alert">
            <span>{error}</span>
            <button type="button" className="icon-button" aria-label="Dismiss error" onClick={clearMessage}><Icon name="close" size={18} /></button>
          </div>
        )}
        {!editor && pathname !== '/' && notice && (
          <div className="app-notice" role="status">
            <Icon name="sprout" size={20} /><span>{notice}</span>
            <button type="button" className="icon-button" aria-label="Dismiss notice" onClick={clearMessage}><Icon name="close" size={18} /></button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<WorldView addHabit={addHabit} />} />
          <Route path="/habits" element={<HabitsView addHabit={addHabit} editHabit={editHabit} />} />
          <Route path="/journal" element={<JournalView />} />
          <Route path="/progress" element={<ProgressView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {DevTime && <Suspense fallback={null}><DevTime /></Suspense>}
      </main>
      {editor && <HabitEditor habit={editedHabit} close={() => setEditor(null)} />}
    </>
  )
}

export function App({ repository, clock }: { repository: WorldRepository; clock?: () => Date }) {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <WorldProvider repository={repository} {...(clock ? { clock } : {})}>
          <HashRouter><AppShell /></HashRouter>
        </WorldProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
