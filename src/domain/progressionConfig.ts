import type { BuildingArchetype, ConstructionStage, WorldMilestone, WorldZone } from './world'

export const ACTIVE_ZONE_LIMIT = 3

export const ZONES: readonly WorldZone[] = [
  { id: 'fern-grove', name: 'Fern Grove' },
  { id: 'willow-bank', name: 'Willow Bank' },
  { id: 'upper-meadow', name: 'Upper Meadow' },
]

export const ARCHETYPES = [
  { id: 'studio', name: 'Music Studio', category: 'Music', clue: 'A small space with good acoustics.' },
  { id: 'library', name: 'Library', category: 'Reading', clue: 'A deep bay for reading beside the window.' },
  { id: 'lodge', name: 'Training Lodge', category: 'Fitness', clue: 'A wide doorway lets in the morning air.' },
  { id: 'workshop', name: 'Workshop', category: 'Making', clue: 'A generous workbench is taking shape.' },
  { id: 'pavilion', name: 'Garden Pavilion', category: 'Gardening', clue: 'Light filters through the open rafters.' },
  { id: 'cabin', name: 'Retreat Cabin', category: 'Mindfulness', clue: 'A small porch faces the valley.' },
  { id: 'creative-cabin', name: 'Creative Cabin', category: 'Other', clue: 'There’s a nook for something of your own.' },
] as const satisfies readonly BuildingArchetype[]

export type ArchetypeId = typeof ARCHETYPES[number]['id']

export const STAGES: readonly ConstructionStage[] = [
  { id: 'clearing', name: 'Clearing', threshold: 1, message: 'The ferns part to reveal a small clearing.' },
  { id: 'foundation', name: 'Foundation', threshold: 2, message: 'The first stones are in place.' },
  { id: 'framework', name: 'Framework', threshold: 4, message: 'The frame is rising above the grass.' },
  { id: 'roof', name: 'Roof', threshold: 7, message: 'A roof now shelters the work below.' },
  { id: 'finishing', name: 'Exterior finishing', threshold: 10, message: 'The finishing details are taking shape.' },
  { id: 'reveal', name: 'Building reveal', threshold: 14, message: 'The doors are ready to open.' },
  { id: 'landscaping', name: 'Landscaping', threshold: 21, message: 'New flowers have taken root.' },
  { id: 'thriving', name: 'Thriving building', threshold: 35, message: 'The whole clearing feels alive.' },
]

export const REVEAL_STAGE = 'reveal'

export const WORLD_MILESTONES: readonly WorldMilestone[] = [
  { id: 'lantern-path', name: 'Lantern Path', threshold: 6, contributors: 2, message: 'A lantern has been lit by the cottage path.' },
  { id: 'cottage-garden', name: 'Cottage Garden', threshold: 18, contributors: 2, message: 'A little garden is blooming beside the cottage.' },
]
