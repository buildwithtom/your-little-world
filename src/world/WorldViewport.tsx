import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export interface WorldLayer {
  readonly id: string
  readonly content: ReactNode
}

interface WorldViewportProps {
  viewBox: string
  /** SVG layers in back-to-front paint order. */
  layers: readonly WorldLayer[]
  label?: string
}

export function WorldViewport({ viewBox, layers, label }: WorldViewportProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.svg
      className="block h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {layers.map(({ id, content }) => (
        <g key={id} data-layer={id}>
          {content}
        </g>
      ))}
    </motion.svg>
  )
}
