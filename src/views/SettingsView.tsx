import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useWorld } from '../app/worldContext'
import { Icon } from '../components/Icon'
import { exportWorld, importWorld } from '../data/worldRepository'
import type { WorldState } from '../domain/world'

const timeZones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []

export function SettingsView() {
  const { state, today, dispatch, restore, readError } = useWorld()
  const [timeZone, setTimeZone] = useState(state.preferences.timeZone)
  const [sound, setSound] = useState(state.preferences.sound)
  const [backup, setBackup] = useState<WorldState | null>(null)
  const [message, setMessage] = useState<string>()
  const [fileError, setFileError] = useState<string>()
  const [restoring, setRestoring] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(undefined)
    if (await dispatch({ kind: 'preferences', preferences: { timeZone: timeZone.trim(), sound } })) {
      setMessage('Preferences saved.')
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportWorld(state)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `little-world-${today}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setMessage(undefined)
    setFileError(undefined)
    setBackup(null)
    try {
      setBackup(importWorld(await file.text(), state.preferences.timeZone))
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'The backup could not be opened.')
    }
  }

  async function importBackup() {
    if (!backup) return
    setRestoring(true)
    if (await restore(backup)) {
      setTimeZone(backup.preferences.timeZone)
      setSound(backup.preferences.sound)
      setBackup(null)
      setMessage('Your saved world has been restored.')
    }
    setRestoring(false)
  }

  return (
    <section className="paper-page">
      <div className="page-heading"><h1 id="page-title">Settings</h1></div>
      <div className="settings-panels">
        <form className="paper-panel settings-card form-stack" onSubmit={save}>
          <h2>Preferences</h2>
          <label className="field">Time zone
            <input required list="world-timezones" value={timeZone} onChange={(event) => setTimeZone(event.target.value)} />
            <datalist id="world-timezones"><option value="UTC" />{timeZones.map((zone) => <option key={zone} value={zone} />)}</datalist>
          </label>
          <label className="setting-toggle"><input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} /> Play a soft sound on completion</label>
          <div><button type="submit" className="button primary" disabled={!!readError}>Save preferences</button></div>
        </form>
        <section className="paper-panel settings-card form-stack" aria-labelledby="backup-heading">
          <h2 id="backup-heading">World backup</h2>
          <p>Keep a copy of your habits, buildings, and journal in one JSON file.</p>
          <div className="backup-actions">
            <button type="button" className="button secondary" disabled={!!readError} onClick={download}><Icon name="download" size={18} /> Export backup</button>
            <label className="button secondary file-button">Choose backup<input aria-label="Choose backup" type="file" accept=".json,application/json" disabled={restoring} onChange={(event) => { void chooseBackup(event) }} /></label>
          </div>
          {fileError && <p className="inline-error" role="alert">{fileError}</p>}
          {backup && (
            <div className="backup-preview">
              <p>This backup contains {backup.habits.length} {backup.habits.length === 1 ? 'habit' : 'habits'}. Restoring replaces the saved world on this device.</p>
              <div className="backup-actions">
                <button type="button" className="button primary" disabled={restoring} onClick={() => { void importBackup() }}>Restore this backup</button>
                <button type="button" className="button secondary" disabled={restoring} onClick={() => setBackup(null)}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      </div>
      {message && <p className="settings-status" role="status">{message}</p>}
    </section>
  )
}
