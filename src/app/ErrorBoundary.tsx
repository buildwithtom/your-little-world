import { Component } from 'react'
import type { ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="app-main">
        <section className="paper-panel error-screen">
          <h1>The hillside could not open</h1>
          <p>Reload the page to try again.</p>
          <button type="button" className="button primary" onClick={() => window.location.reload()}>Reload the world</button>
        </section>
      </main>
    )
  }
}
