export const BODY_PART_ORDER = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Waist', 'Core', 'Conditioning', 'Mobility'] as const

const BODY_PART_PRIORITY = new Map(BODY_PART_ORDER.map((bodyPart, index) => [bodyPart, index]))

const MUSCLE_TO_BODY_PARTS: Array<{ match: RegExp; parts: string[] }> = [
  { match: /chest|pec|pector/i, parts: ['Chest'] },
  { match: /back|lat/i, parts: ['Back'] },
  { match: /shoulder|delt/i, parts: ['Shoulders'] },
  { match: /rear delt|traps?/i, parts: ['Back', 'Shoulders'] },
  { match: /bicep|tricep|forearm/i, parts: ['Arms'] },
  { match: /quad|hamstring|glute|calf|abductor|adductor|hip|ankle/i, parts: ['Legs'] },
  { match: /abs?|oblique|waist|hip flexor/i, parts: ['Waist'] },
  { match: /core|pelvic floor/i, parts: ['Core', 'Waist'] },
  { match: /cardio|cardiovascular|full body/i, parts: ['Conditioning'] },
  { match: /mobility|stretch|flexibility|rotation/i, parts: ['Mobility'] },
]

function normalizeParts(parts: string[]) {
  return Array.from(new Set(parts)).sort(
    (left, right) =>
      (BODY_PART_PRIORITY.get(left as (typeof BODY_PART_ORDER)[number]) ?? 999) -
      (BODY_PART_PRIORITY.get(right as (typeof BODY_PART_ORDER)[number]) ?? 999),
  )
}

export function deriveBodyParts(exercise: { category: string; muscleGroups: string[] }) {
  const discovered = new Set<string>()

  if (exercise.category) {
    const category = exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)
    if (BODY_PART_PRIORITY.has(category as (typeof BODY_PART_ORDER)[number])) {
      discovered.add(category)
    }
  }

  for (const muscleGroup of exercise.muscleGroups) {
    for (const mapping of MUSCLE_TO_BODY_PARTS) {
      if (mapping.match.test(muscleGroup)) {
        mapping.parts.forEach((part) => discovered.add(part))
      }
    }
  }

  if (discovered.size === 0) {
    discovered.add('Core')
  }

  return normalizeParts(Array.from(discovered))
}
