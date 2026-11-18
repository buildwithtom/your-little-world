import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { Icon } from '../components/Icon'

interface Camera {
  scale: number
  x: number
  y: number
}

const home: Camera = { scale: 1, x: 0, y: 0 }
const MAX_ZOOM = 2.25

function bounded(scale: number, x: number, y: number): Camera {
  const limit = (scale - 1) / 2
  const clamp = (value: number) => Math.min(limit, Math.max(-limit, value))
  return { scale, x: clamp(x), y: clamp(y) }
}

export function WorldCamera({ children, overlays }: { children: ReactNode; overlays: ReactNode }) {
  const [camera, setCamera] = useState(home)
  const points = useRef(new Map<number, { x: number; y: number }>())

  function zoom(amount: number) {
    setCamera((current) => bounded(Math.max(1, Math.min(MAX_ZOOM, current.scale + amount)), current.x, current.y))
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) return
    // On an unzoomed map, a simple swipe can still scroll the page.
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = points.current.get(event.pointerId)
    if (!previous) return
    const box = event.currentTarget.getBoundingClientRect()
    const next = { x: event.clientX, y: event.clientY }
    const other = [...points.current].find(([id]) => id !== event.pointerId)?.[1]
    points.current.set(event.pointerId, next)

    if (other) {
      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(next.x - other.x, next.y - other.y)
      if (before > 0) {
        setCamera((current) => {
          const scale = Math.max(1, Math.min(MAX_ZOOM, current.scale * after / before))
          const x = (previous.x + other.x) / 2 - box.left - box.width / 2
          const y = (previous.y + other.y) / 2 - box.top - box.height / 2
          const ratio = scale / current.scale
          return bounded(scale,
            current.x * ratio + (x * (1 - ratio) + (next.x - previous.x) / 2) / box.width,
            current.y * ratio + (y * (1 - ratio) + (next.y - previous.y) / 2) / box.height)
        })
      }
      return
    }

    if (camera.scale > 1) {
      setCamera((current) => bounded(current.scale,
        current.x + (next.x - previous.x) / box.width,
        current.y + (next.y - previous.y) / box.height))
    }
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    points.current.delete(event.pointerId)
  }

  function keyboardPan(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || camera.scale === 1) return
    const keys: Record<string, [number, number]> = {
      ArrowUp: [0, 0.08], ArrowDown: [0, -0.08], ArrowLeft: [0.08, 0], ArrowRight: [-0.08, 0],
    }
    const step = keys[event.key]
    if (!step) return
    event.preventDefault()
    setCamera((current) => bounded(current.scale, current.x + step[0], current.y + step[1]))
  }

  return (
    <div
      className="world-camera"
      data-zoomed={camera.scale > 1}
      role="region"
      aria-label="Hillside map. Use the zoom controls, then drag or use the arrow keys to pan."
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onKeyDown={keyboardPan}
    >
      <div
        className="world-plane"
        style={{ transform: `translate(${camera.x * 100}%, ${camera.y * 100}%) scale(${camera.scale})` }}
      >
        {children}
      </div>
      {overlays}
      <div className="camera-tools" aria-label="Map controls">
        <button type="button" aria-label="Zoom out" disabled={camera.scale <= 1} onClick={() => zoom(-0.25)}><Icon name="minus" size={17} /></button>
        <button type="button" aria-label="Reset map" disabled={camera.scale === 1} onClick={() => setCamera(home)}><Icon name="reset" size={17} /></button>
        <button type="button" aria-label="Zoom in" disabled={camera.scale >= MAX_ZOOM} onClick={() => zoom(0.25)}><Icon name="plus" size={17} /></button>
      </div>
    </div>
  )
}
