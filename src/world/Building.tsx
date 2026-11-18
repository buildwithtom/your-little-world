import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import type { ArchetypeId } from '../domain/progressionConfig'
import type { BuildingVitality } from '../domain/world'
import { Wildflowers } from './SceneArt'

interface BuildingStyle {
  roof: string
  shadow: string
  walls: string
  trim: string
  pitch: number
  feature: 'round' | 'bay' | 'wide' | 'open' | 'porch'
}

const STYLES: Record<ArchetypeId, BuildingStyle> = {
  studio: { roof: '#6b8a80', shadow: '#3e5d54', walls: '#d9c3a0', trim: '#325951', pitch: -107, feature: 'round' },
  library: { roof: '#98604d', shadow: '#694036', walls: '#edcf95', trim: '#5d5140', pitch: -125, feature: 'bay' },
  lodge: { roof: '#819052', shadow: '#515e37', walls: '#bd935d', trim: '#624831', pitch: -94, feature: 'wide' },
  workshop: { roof: '#a36f4c', shadow: '#704833', walls: '#d1b07e', trim: '#695544', pitch: -98, feature: 'wide' },
  pavilion: { roof: '#78956b', shadow: '#536746', walls: '#e3ca9f', trim: '#5f7753', pitch: -111, feature: 'open' },
  cabin: { roof: '#747f88', shadow: '#495762', walls: '#d8ba8b', trim: '#615a49', pitch: -112, feature: 'porch' },
  'creative-cabin': { roof: '#9a6964', shadow: '#6c4646', walls: '#dec397', trim: '#6e5751', pitch: -110, feature: 'porch' },
}

export function ConstructionZone({ stage }: { stage: number }) {
  const soil = useId()
  return stage === 0 ? (
    <g>
      <ellipse cx="0" cy="-7" rx="79" ry="23" fill="#414921" opacity=".18" />
      <path d="M-73 0q-6-31 8-42 0 14 9 18-2-25 19-36 4 12 2 31 10-14 20-9l-2 35M37 7q-8-18 0-35 4 10 14 15 0-22 16-32 2 12-2 25 10-14 23-13l-8 33" fill="#607b3b" />
      <path d="M-64-12q13-6 18-20m91 27 15-20" stroke="#a8a85b" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ) : (
    <g>
      <defs>
        <radialGradient id={soil} cx=".49" cy=".43" r=".55">
          <stop stopColor="#b0955f" stopOpacity=".97" />
          <stop offset=".62" stopColor="#c1a570" stopOpacity=".88" />
          <stop offset="1" stopColor="#a6a456" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M-96-12q2-21 43-27 14-8 38-6 22-4 57 2 44-1 64 23 2 30-76 37-64 4-113-11z" fill={`url(#${soil})`} />
      <path d="m-71-9 13-5m-2 17 9-3m119-15 13-3M42 8l14-4M-20 7l11-3m-22-34 5-1m70 1 6 1" stroke="#dcc68e" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      <path d="m-72-3 6-7m8-13 5-4m100 31 7-3m21-9 5-7M-35 10l4-2" stroke="#93954f" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
      {stage === 1 && <path d="m-47-21 81-13 35 17-79 16z" fill="none" stroke="#e7d7a1" strokeWidth="2" strokeDasharray="6 5" />}
    </g>
  )
}

function Foundation() {
  return (
    <>
      <path d="m-69-22 46-34 96 27-39 35z" fill="#b3a48a" stroke="#766f56" strokeWidth="2" />
      <path d="M-69-22v11L34 16 73-19v-10L34 6z" fill="#8d8572" stroke="#706554" strokeWidth="2" />
      <path d="m-55-32 101 27m-88-36 101 27m-83-36 97 27M-45-15l43-34M-19-8l43-34M8-1l44-34M-55-17v8m24-1v8m28 0v7m22 0v6m29-10v8m13-20v8" stroke="#e0d2b1" strokeWidth="2" opacity=".75" fill="none" />
    </>
  )
}

function BuildingStage({ stage, style }: { stage: number; style: BuildingStyle }) {
  const { pitch, walls, roof, shadow, trim, feature } = style
  return (
    <>
      {stage >= 5 && (
        <>
          <path d="M-65-20v-51l47-29 51 56v48z" fill={walls} stroke="#7a6246" strokeWidth="2" />
          <path d="M33 4v-48l35-33v48z" fill="#a68c67" stroke="#6e5b42" strokeWidth="2" />
          <path d="m-63-44 95 24m-95-14 95 24m-94-55 95 26m2 8 31-29m-30 41 31-28" stroke="#715b43" strokeOpacity=".26" strokeWidth="1.5" />
        </>
      )}
      {stage >= 3 && (
        <path d="M-64-20v-51l98 27v49m-98-76 45-31 53 58 35-34v50m-88-74 35-25 53 49m-98 9v53m43-42v52" stroke="#76553b" strokeWidth="5.5" strokeLinejoin="round" fill="none" />
      )}
      {stage >= 4 && (
        <>
          <path d={`M-72-67-19 ${pitch} 39-39 70-76 18 ${pitch - 26}z`} fill={roof} stroke="#5d5343" strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M-19 ${pitch} 39-39 76-76 18 ${pitch - 26}z`} fill={shadow} stroke="#524c3d" strokeWidth="2.5" />
          <path d="m1-91 36-29M13-77l37-31M25-65l35-32M34-51 70-83m-125 7 42-20m-28 26 33-16" stroke="#e2d3a4" strokeOpacity=".3" strokeWidth="2" />
          <path d={`M-71-66-19 ${pitch} 39-37 76-75`} fill="none" stroke="#bda779" strokeWidth="4" strokeLinejoin="round" />
        </>
      )}
      {stage >= 5 && <path d="m4-40 17 4V1L4-3z" fill={trim} stroke="#6b5037" strokeWidth="2" />}
      {stage >= 6 && (
        <g fill={trim} stroke="#594a33" strokeWidth="2">
          {feature === 'round' && <ellipse cx="-37" cy="-48" rx="13" ry="16" transform="rotate(-12 -37 -48)" />}
          {feature === 'bay' && <path d="m-61-51 15-10 31 8 4 26-31 1-19-7z" />}
          {feature === 'wide' && <path d="m-59-57 41 11v30l-41-10z" />}
          {feature === 'open' && <path d="m-58-56 41 11v27l-41-11z" fill="#5f7050" />}
          {feature === 'porch' && <path d="m-65-45 85 22 17-12-84-23zM-61-42v23m77 0v18" />}
          <path d="m44-37 15-13v16L44-20z" />
          <path d="m-19-93 7 8-7 5-7-9z" fill="#e6c982" />
        </g>
      )}
    </>
  )
}

export function Building({ stage, archetype }: { stage: number; archetype: ArchetypeId }) {
  const reduceMotion = useReducedMotion()
  if (stage < 2) return null
  return (
    <motion.g
      key={stage}
      initial={reduceMotion ? false : { opacity: 0.55 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <Foundation />
      <BuildingStage stage={stage} style={STYLES[archetype]} />
      {stage >= 7 && <><Wildflowers x={-66} y={-1} /><Wildflowers x={56} y={5} /></>}
      {stage >= 8 && (
        <>
          <path d="m-58-8 18 6-5 6-17-5zM48-12l13-12 4 7-13 12z" fill="#97724b" stroke="#644a36" strokeWidth="1.5" />
          <Wildflowers x={-49} y={-5} scale={0.77} />
          <Wildflowers x={54} y={-12} scale={0.77} />
          <Wildflowers x={-41} y={9} />
          <Wildflowers x={77} y={-11} scale={0.8} />
        </>
      )}
    </motion.g>
  )
}

export function VitalityEffects({ stage, vitality }: { stage: number; vitality: BuildingVitality }) {
  if (stage < 2) return null
  return (
    <>
      {stage >= 6 && (vitality === 'thriving' || vitality === 'recovering') && (
        <g className="scene-lights" opacity={vitality === 'thriving' ? '.9' : '.65'}>
          <path d="m47-36 9-8v9l-9 8z" fill="#ffe6a4" />
          <circle cx="49" cy="-34" r="17" fill="#f8d482" opacity=".21" />
          <circle cx="11" cy="-19" r="2.5" fill="#ffd88c" />
        </g>
      )}
      {vitality === 'neglected' && (
        <path d="M-64-3q-4-13-12-20m12 20 2-17m7 22 7-15m108 9 5-17m0 18 11-8" fill="none" stroke="#6d7f43" strokeWidth="3" strokeLinecap="round" />
      )}
    </>
  )
}
