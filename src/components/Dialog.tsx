import { useId, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement
    if (dialog.showModal) dialog.showModal()
    else dialog.setAttribute('open', '')
    return () => {
      dialog.close?.()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  return (
    <dialog ref={ref} className="paper-dialog" aria-labelledby={titleId} onCancel={(event) => {
      event.preventDefault()
      close()
    }}>
      <div className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button" aria-label="Close form" onClick={close}><Icon name="close" /></button>
      </div>
      {children}
    </dialog>
  )
}
