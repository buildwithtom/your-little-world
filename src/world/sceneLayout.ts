export const SCENE_WIDTH = 1536
export const SCENE_HEIGHT = 1024

export const COTTAGE = { x: 732, y: 562, scale: 1 }

export const SITE_LAYOUT: Readonly<Record<string, { x: number; y: number; scale: number }>> = {
  'upper-meadow': { x: 540, y: 372, scale: 0.83 },
  'willow-bank': { x: 1249, y: 510, scale: 0.95 },
  'fern-grove': { x: 420, y: 788, scale: 1.42 },
}

export function scenePosition(x: number, y: number) {
  return { left: `${100 * x / SCENE_WIDTH}%`, top: `${100 * y / SCENE_HEIGHT}%` }
}
