import { exerciseCatalog } from '../data/exercises.js'
import { deriveBodyParts } from '../lib/exerciseTaxonomy.js'
import type { ActivityLevel, ExperienceLevel, Gender } from '../types/domain.js'

type BodyPriority = 'build' | 'balance' | 'reduce'
type BodyPart = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Waist' | 'Core' | 'Conditioning' | 'Mobility'
type Exercise = (typeof exerciseCatalog)[number]

const BODY_PART_GOAL_MAP: Record<string, BodyPart> = {
  bigger_chest: 'Chest',
  bigger_arms: 'Arms',
  bigger_shoulders: 'Shoulders',
  wider_back: 'Back',
  bigger_legs: 'Legs',
}

export interface ProfileInput {
  age: number
  gender: Gender
  height: number
  weight: number
  bodyFat?: number
  goalWeight?: number
  activityLevel: ActivityLevel
  experienceLevel: ExperienceLevel
  injuries?: string
  equipment?: string | string[]
  workoutDays: number
  sessionDuration: number
  goals: string[]
}

interface WorkoutSet {
  reps: number
  weight?: number
  restTime: number
}

interface WorkoutExercise {
  exerciseId: string
  name: string
  sets: WorkoutSet[]
  notes?: string
}

interface WorkoutDay {
  day: number
  focus: string
  exercises: WorkoutExercise[]
  goalDrivers: string[]
}

export interface WorkoutPlan {
  name: string
  description: string
  split: string
  schedule: WorkoutDay[]
  estimatedDuration: number
}

function hasGoal(goals: string[], keywords: string[]) {
  return goals.some((goal) => keywords.some((keyword) => goal.includes(keyword)))
}

function getDifficultyScore(difficulty: Exercise['difficulty'], experience: ExperienceLevel) {
  const ranks: Record<ExperienceLevel, Record<Exercise['difficulty'], number>> = {
    beginner: { beginner: 0, intermediate: 1, advanced: 2 },
    intermediate: { intermediate: 0, beginner: 1, advanced: 2 },
    advanced: { advanced: 0, intermediate: 1, beginner: 2 },
  }

  return ranks[experience][difficulty]
}

function formatGoalLabel(goalId: string) {
  const goalLabels: Record<string, string> = {
    lose_weight: 'Lose Weight',
    build_muscle: 'Build Muscle',
    strength: 'Strength',
    calisthenics: 'Calisthenics',
    bigger_chest: 'Bigger Chest',
    bigger_arms: 'Bigger Arms',
    bigger_shoulders: 'Bigger Shoulders',
    wider_back: 'Wider Back',
    bigger_legs: 'Bigger Legs',
    fat_loss: 'Fat Loss',
    endurance: 'Endurance',
    mobility: 'Mobility',
    flexibility: 'Flexibility',
    general_fitness: 'General Fitness',
    better_posture: 'Better Posture',
    improve_stamina: 'Improve Stamina (sex stamina)',
    cardiovascular: 'Cardiovascular Fitness',
    core_strength: 'Core Strength',
    hip_mobility: 'Hip Mobility',
    pelvic_floor: 'Pelvic Floor Strength',
  }

  return goalLabels[goalId] ?? goalId.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getGoalProfile(goals: string[]) {
  const bodyPartTargets = Array.from(
    new Set(
      goals
        .map((goal) => BODY_PART_GOAL_MAP[goal])
        .filter((bodyPart): bodyPart is BodyPart => Boolean(bodyPart)),
    ),
  )

  return {
    strength: hasGoal(goals, ['strength', 'build_muscle']),
    calisthenics: hasGoal(goals, ['calisthenics']),
    conditioning: hasGoal(goals, ['endurance', 'cardiovascular', 'lose_weight', 'fat_loss', 'improve_stamina']),
    mobility: hasGoal(goals, ['mobility', 'flexibility', 'hip_mobility']),
    posture: hasGoal(goals, ['better_posture']),
    core: hasGoal(goals, ['core_strength', 'pelvic_floor']),
    bodyPartTargets,
    wantsBodyPartHypertrophy: bodyPartTargets.length > 0,
  }
}

function calculateBMI(weight: number, heightCm: number) {
  const heightM = heightCm / 100
  if (!heightM || !Number.isFinite(heightM)) return 0
  return weight / (heightM * heightM)
}

function getBodyPriority(profile: ProfileInput): BodyPriority {
  const bmi = calculateBMI(profile.weight, profile.height)
  if (bmi === 0) return 'balance'
  if (bmi < 18.5) return 'build'
  if (bmi >= 25) return 'reduce'
  return 'balance'
}

function getGoalDriversForFocus(goals: string[], focus: string, categories: string[]) {
  const goalProfile = getGoalProfile(goals)
  const drivers = new Set<string>()

  const addGoals = (goalKeys: string[]) => {
    goalKeys.forEach((goalKey) => {
      if (goals.includes(goalKey)) {
        drivers.add(formatGoalLabel(goalKey))
      }
    })
  }

  const hasUpperOrLower = categories.some((category) => ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'].includes(category))
  const hasCore = categories.includes('Core')
  const hasMobility = categories.includes('Mobility')
  const hasConditioning = categories.includes('Conditioning') || focus.toLowerCase().includes('cardio') || focus.toLowerCase().includes('conditioning')

  if (goalProfile.strength && hasUpperOrLower) {
    addGoals(['strength', 'build_muscle', 'general_fitness'])
  }

  if (goalProfile.calisthenics && hasUpperOrLower) {
    addGoals(['calisthenics', 'general_fitness', 'strength'])
  }

  if (goalProfile.conditioning && hasConditioning) {
    addGoals(['lose_weight', 'fat_loss', 'endurance', 'cardiovascular', 'improve_stamina'])
  }

  if (goalProfile.mobility && hasMobility) {
    addGoals(['mobility', 'flexibility', 'hip_mobility'])
  }

  if (goalProfile.posture && (focus.toLowerCase().includes('upper') || categories.some((category) => ['Back', 'Shoulders', 'Core'].includes(category)))) {
    addGoals(['better_posture'])
  }

  if (goalProfile.core && (hasCore || hasMobility || categories.includes('Legs'))) {
    addGoals(['core_strength', 'pelvic_floor'])
  }

  goalProfile.bodyPartTargets.forEach((bodyPart) => {
    if (categories.includes(bodyPart)) {
      const goalKey = Object.entries(BODY_PART_GOAL_MAP).find(([, mappedBodyPart]) => mappedBodyPart === bodyPart)?.[0]
      if (goalKey) {
        addGoals([goalKey])
      }
    }
  })

  if (drivers.size === 0) {
    goals.forEach((goal) => drivers.add(formatGoalLabel(goal)))
  }

  return Array.from(drivers)
}

function getSetCount(experience: ExperienceLevel, goals: string[], bodyPriority: BodyPriority) {
  const goalProfile = getGoalProfile(goals)

  if (goalProfile.mobility) {
    if (experience === 'beginner') return 2
    return 3
  }

  if (goalProfile.posture || goalProfile.core) {
    if (experience === 'beginner') return 3
    if (experience === 'intermediate') return 3
    return 4
  }

  if (goalProfile.wantsBodyPartHypertrophy) {
    if (experience === 'beginner') return 3
    if (experience === 'intermediate') return 4
    return bodyPriority === 'build' ? 5 : 4
  }

  if (experience === 'beginner') return 3
  if (experience === 'intermediate') return 4
  return bodyPriority === 'build' ? 5 : 4
}

function getRepRange(experience: ExperienceLevel, goals: string[], bodyPriority: BodyPriority) {
  const goalProfile = getGoalProfile(goals)

  if (goalProfile.strength) {
    if (experience === 'beginner') return { min: 8, max: 12 }
    if (experience === 'intermediate') return { min: 6, max: 10 }
    return { min: 4, max: 8 }
  }

  if (goalProfile.conditioning) {
    return { min: 20, max: 30 }
  }

  if (goalProfile.mobility || goalProfile.posture || goalProfile.core) {
    return { min: 8, max: 15 }
  }

  if (bodyPriority === 'build') {
    return { min: 6, max: 10 }
  }

  if (bodyPriority === 'reduce') {
    return { min: 10, max: 15 }
  }

  return { min: 8, max: 12 }
}

function getRestTime(experience: ExperienceLevel, type: 'compound' | 'isolation', goals: string[], bodyPriority: BodyPriority) {
  const goalProfile = getGoalProfile(goals)

  if (goalProfile.mobility) {
    return type === 'compound' ? 45 : 30
  }

  if (goalProfile.posture || goalProfile.core) {
    return type === 'compound' ? 60 : 45
  }

  if (goalProfile.conditioning) {
    return type === 'compound' ? 45 : 30
  }

  if (bodyPriority === 'build') {
    return type === 'compound' ? 120 : 75
  }

  if (bodyPriority === 'reduce') {
    return type === 'compound' ? 75 : 45
  }

  if (type === 'compound') {
    return experience === 'beginner' ? 90 : 120
  }

  return 60
}

function determineSplit(workoutDays: number) {
  if (workoutDays <= 2) return 'full_body'
  if (workoutDays === 3) return 'full_body_3x'
  if (workoutDays === 4) return 'upper_lower'
  return 'push_pull_legs'
}

function normalizeEquipmentSelection(equipment?: string | string[]) {
  const rawValues = Array.isArray(equipment)
    ? equipment
    : typeof equipment === 'string'
      ? equipment.split(/[,;|\n]/g)
      : []

  const selection = new Set<string>()

  rawValues.forEach((entry) => {
    const normalized = entry.toLowerCase().trim()
    if (!normalized) return
    selection.add(normalized)
  })

  return selection
}

function filterExercises(equipment: string | string[] | undefined, injuries: string | undefined) {
  const equipmentSelection = normalizeEquipmentSelection(equipment)
  const lowerInjuries = injuries?.toLowerCase() ?? ''

  return exerciseCatalog.filter((exercise) => {
    const bodyParts = deriveBodyParts(exercise)
    if (lowerInjuries.includes('shoulder') && bodyParts.includes('Shoulders')) return false
    if (lowerInjuries.includes('knee') && bodyParts.includes('Legs')) return false
    if (lowerInjuries.includes('back') && bodyParts.includes('Back')) return false

    const selection = Array.from(equipmentSelection)
    const hasSelection = (...terms: string[]) => selection.some((item) => terms.some((term) => item.includes(term)))

    if (equipmentSelection.size === 0 || hasSelection('gym access', 'gym')) return true
    if (exercise.equipment === 'bodyweight') return true
    if (hasSelection('bodyweight') && exercise.equipment === 'bodyweight') return true
    if (hasSelection('dumbbell') && exercise.equipment === 'dumbbell') return true
    if (hasSelection('cable') && exercise.equipment === 'cable') return true
    if (hasSelection('barbell') && exercise.equipment === 'barbell') return true
    if (
      hasSelection('machine', 'treadmill', 'cardio machine', 'leg press machine') &&
      (exercise.equipment === 'machine' || exercise.equipment === 'stationary bike' || exercise.equipment === 'elliptical machine')
    ) {
      return true
    }
    if (hasSelection('band') && exercise.equipment === 'band') return true
    if (hasSelection('rope', 'jump rope') && exercise.equipment === 'rope') return true
    if (hasSelection('stationary bike', 'bike') && exercise.equipment === 'stationary bike') return true
    if (hasSelection('elliptical machine', 'elliptical') && exercise.equipment === 'elliptical machine') return true
    return false
  })
}

function exerciseMatchesCategory(exercise: (typeof exerciseCatalog)[number], category: string) {
  return deriveBodyParts(exercise).includes(category)
}

function getPreferredCategories(profile: ProfileInput, split: string, day: number) {
  const goalProfile = getGoalProfile(profile.goals)
  const bodyPriority = getBodyPriority(profile)
  const bodyPartTargets = goalProfile.bodyPartTargets
  const upperTargets = bodyPartTargets.filter((part) => part !== 'Legs')
  const upperTargetSet = new Set<BodyPart>(upperTargets)
  const upperEmphasis: BodyPart[] = [
    ...upperTargets,
    ...(['Chest', 'Back', 'Shoulders', 'Arms'] as BodyPart[]).filter((part) => !upperTargetSet.has(part)),
  ]
  const lowerEmphasis = ['Legs', 'Waist', 'Core'] as BodyPart[]

  if (split === 'full_body' || split === 'full_body_3x') {
    if (bodyPartTargets.length > 0) {
      if (upperTargets.length > 0) {
        return upperEmphasis
      }
      return lowerEmphasis
    }
    if (goalProfile.calisthenics) return ['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs']
    if (goalProfile.mobility) return ['Mobility', 'Waist', 'Legs', 'Back']
    if (goalProfile.posture) return ['Back', 'Shoulders', 'Waist', 'Mobility']
    if (goalProfile.core) return ['Waist', 'Legs', 'Back', 'Mobility']
    if (goalProfile.conditioning) return ['Conditioning', 'Waist', 'Legs', 'Back']
    if (bodyPriority === 'build') return ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Waist']
    if (bodyPriority === 'reduce') return ['Conditioning', 'Legs', 'Back', 'Waist', 'Shoulders']
    return ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Waist']
  }

  if (split === 'upper_lower') {
    if (bodyPartTargets.length > 0) {
      if (upperTargets.length > 0) {
        return upperEmphasis
      }
      return lowerEmphasis
    }
    const upper = day % 2 === 1
    if (goalProfile.calisthenics) {
      return upper ? ['Chest', 'Back', 'Shoulders', 'Arms', 'Core'] : ['Legs', 'Core', 'Mobility']
    }
    if (goalProfile.mobility) {
      return upper ? ['Mobility', 'Back', 'Shoulders', 'Waist'] : ['Legs', 'Mobility', 'Waist']
    }
    if (goalProfile.posture) {
      return upper ? ['Back', 'Shoulders', 'Waist'] : ['Legs', 'Waist']
    }
    if (goalProfile.core) {
      return upper ? ['Back', 'Shoulders', 'Waist'] : ['Legs', 'Waist', 'Mobility']
    }
    if (goalProfile.conditioning) {
      return upper ? ['Chest', 'Shoulders', 'Conditioning', 'Waist'] : ['Legs', 'Conditioning', 'Waist']
    }
    if (bodyPriority === 'build') {
      return upper ? ['Chest', 'Back', 'Shoulders', 'Arms'] : ['Legs', 'Waist']
    }
    if (bodyPriority === 'reduce') {
      return upper ? ['Conditioning', 'Back', 'Shoulders', 'Waist'] : ['Legs', 'Conditioning', 'Waist']
    }
    return upper ? ['Chest', 'Back', 'Shoulders', 'Arms'] : ['Legs', 'Waist']
  }

  const phase = day % 3
  if (bodyPartTargets.length > 0) {
    if (upperTargets.length > 0) {
      return phase === 1 || phase === 2 ? upperEmphasis : ['Arms', 'Chest', 'Back', 'Shoulders']
    }
    return lowerEmphasis
  }
  if (goalProfile.calisthenics) {
    if (phase === 1) return ['Chest', 'Core', 'Shoulders']
    if (phase === 2) return ['Back', 'Arms', 'Core']
    return ['Legs', 'Core', 'Mobility']
  }
  if (goalProfile.mobility) {
    if (phase === 1) return ['Mobility', 'Waist', 'Shoulders']
    if (phase === 2) return ['Back', 'Mobility', 'Waist']
    return ['Legs', 'Mobility', 'Waist']
  }

  if (goalProfile.posture) {
    if (phase === 1) return ['Back', 'Shoulders', 'Waist']
    if (phase === 2) return ['Back', 'Waist']
    return ['Legs', 'Waist']
  }

  if (goalProfile.core) {
    if (phase === 1) return ['Waist', 'Shoulders']
    if (phase === 2) return ['Back', 'Waist']
    return ['Legs', 'Waist', 'Mobility']
  }

  if (goalProfile.conditioning) {
    if (phase === 1) return ['Conditioning', 'Waist']
    if (phase === 2) return ['Back', 'Conditioning', 'Waist']
    return ['Legs', 'Conditioning', 'Waist']
  }

  if (bodyPriority === 'build') {
    if (phase === 1) return ['Chest', 'Back', 'Waist']
    if (phase === 2) return ['Legs', 'Shoulders', 'Waist']
    return ['Arms', 'Waist']
  }

  if (bodyPriority === 'reduce') {
    if (phase === 1) return ['Conditioning', 'Waist', 'Legs']
    if (phase === 2) return ['Back', 'Conditioning', 'Waist']
    return ['Legs', 'Conditioning', 'Waist']
  }

  if (phase === 1) return ['Chest', 'Shoulders', 'Arms']
  if (phase === 2) return ['Back', 'Arms']
  return ['Legs', 'Waist']
}

function buildExerciseSet(experience: ExperienceLevel, goals: string[], category: string, bodyPriority: BodyPriority) {
  const goalProfile = getGoalProfile(goals)
  const repRange = getRepRange(experience, goals, bodyPriority)
  const sets = category === 'Mobility'
    ? experience === 'beginner'
      ? 2
      : 3
    : category === 'Conditioning'
      ? experience === 'beginner'
        ? 3
        : 4
      : (category === 'Core' || category === 'Waist') && (goalProfile.mobility || goalProfile.posture || goalProfile.core)
        ? experience === 'beginner'
          ? 3
          : 4
        : getSetCount(experience, goals, bodyPriority)

  const targetReps = Math.round((repRange.min + repRange.max) / 2)
  const restTime = category === 'Mobility'
    ? 30
    : category === 'Conditioning'
      ? 30
      : (category === 'Core' || category === 'Waist') && (goalProfile.mobility || goalProfile.posture || goalProfile.core)
        ? 45
        : getRestTime(experience, category === 'Chest' || category === 'Back' || category === 'Legs' ? 'compound' : 'isolation', goals, bodyPriority)

  const adjustedReps =
    bodyPriority === 'build' && category !== 'Conditioning' && category !== 'Mobility'
      ? Math.max(targetReps - 2, 4)
      : bodyPriority === 'reduce' && category === 'Conditioning'
        ? Math.max(targetReps - 4, 12)
        : targetReps

  return Array.from({ length: sets }, () => ({
    reps: adjustedReps,
    restTime,
  }))
}

function buildDay(day: number, focus: string, categories: string[], profile: ProfileInput) {
  const availableExercises = filterExercises(profile.equipment, profile.injuries)
  const goalProfile = getGoalProfile(profile.goals)
  const bodyPriority = getBodyPriority(profile)
  const selectedExercises = new Map<string, WorkoutExercise>()

  categories.forEach((category) => {
    const categoryExercises = availableExercises.filter((exercise) => exerciseMatchesCategory(exercise, category))
    const preferred =
      category === 'Chest'
        ? ['barbell_bench_press', 'barbell_decline_bench_press', '0047', '0122', '0151', '0169', '0171', 'assisted_chest_dip_kneeling', 'assisted_wide_grip_chest_dip_kneeling', 'band_bench_press', 'band_one_arm_twisting_chest_press', 'archer_push_up']
        : category === 'Back'
          ? ['alternate_lateral_pulldown', '0970', '0974', '0983', '0027', '3017', 'assisted_parallel_close_grip_pull_up', 'assisted_pull_up', 'band_assisted_pull_up', 'band_close_grip_pulldown', 'band_kneeling_one_arm_pulldown', 'archer_pull_up', 'band_shrug']
          : category === 'Shoulders'
            ? ['0978', '1012', '1017', '0076', '0148', 'band_front_lateral_raise', 'band_reverse_fly', 'band_shoulder_press', 'band_standing_rear_delt_row', 'barbell_rear_delt_raise', 'barbell_upright_row', 'cable_lateral_raise', 'cable_shoulder_press', 'dumbbell_reverse_fly', 'dumbbell_seated_shoulder_press']
            : category === 'Arms'
              ? ['barbell_alternate_biceps_curl', 'barbell_curl', 'barbell_drag_curl', '0052', '0061', 'barbell_preacher_curl', '0968', '0976', '0986', 'barbell_reverse_curl', 'assisted_triceps_dip_kneeling', 'assisted_standing_triceps_extension_with_towel', 'band_close_grip_push_up', 'band_side_triceps_extension', 'barbell_close_grip_bench_press', 'barbell_jm_bench_press']
              : category === 'Legs'
                ? [
                    'barbell_full_squat',
                    'barbell_front_squat',
                    'barbell_one_leg_squat',
                    'barbell_straight_leg_deadlift',
                    'barbell_good_morning',
                    '0032',
                    'backward_jump',
                    '0980',
                    '0987',
                    '0991',
                    '1008',
                    'band_step_up',
                    'band_single_leg_split_squat',
                    'barbell_glute_bridge',
                    'low_glute_bridge_on_floor',
                    'resistance_band_hip_thrusts_on_knees',
                    'single_leg_bridge_with_outstretched_leg',
                    'side_hip_abduction',
                  ]
    : category === 'Waist'
      ? ['0001', '0002', '0006', '0011', '0014', '0969', '0971', '0972', '0979', '0981', '0985', '0992', '1005', '1011', '1014', '0071', '0084', '0094', '0103', '0112', '3544', '2466', '0873', '0211', '0212', '2399', '0222', '0223', '0226', '0874', '0230', '0242', '0243', '0862', '2963', '0262', '0267', '3204', '2333', '2355']
      : category === 'Conditioning'
        ? bodyPriority === 'reduce'
          ? ['0798', '2141', '3666', '2138', '0003', '0630', '2612', '3360', '3223', '3637']
          : bodyPriority === 'build'
            ? ['0003', '0630', '2612', '0798', '2141']
            : ['0003', '3360', '3223', '3637', '0630', '2612', '1160', '0858']
        : []

    const preferredExercises = preferred
      .map((id) => categoryExercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
    const chosen = preferredExercises.length > 0 ? preferredExercises : categoryExercises
    const orderedPool = goalProfile.calisthenics
      ? [...chosen].sort((left, right) => {
          const leftScore = left.equipment === 'bodyweight' ? 0 : left.equipment === 'band' ? 1 : 2
          const rightScore = right.equipment === 'bodyweight' ? 0 : right.equipment === 'band' ? 1 : 2
          const equipmentScore = leftScore - rightScore
          if (equipmentScore !== 0) return equipmentScore
          return getDifficultyScore(left.difficulty, profile.experienceLevel) - getDifficultyScore(right.difficulty, profile.experienceLevel)
        })
      : chosen
    const rotation = orderedPool.length > 1 ? (day - 1) % orderedPool.length : 0
    const rotatedPool = orderedPool.slice(rotation).concat(orderedPool.slice(0, rotation))

    const maxForCategory =
      goalProfile.bodyPartTargets.includes(category as BodyPart)
        ? category === 'Legs'
          ? 3
          : 2
        : category === 'Legs' && (goalProfile.conditioning || goalProfile.core || goalProfile.posture)
          ? 3
          : category === 'Waist'
            ? 2
            : category === 'Conditioning'
              ? 2
              : 1

    rotatedPool.slice(0, maxForCategory).forEach((exercise) => {
      if (!exercise || selectedExercises.has(exercise.id)) return

      selectedExercises.set(exercise.id, {
        exerciseId: exercise.id,
        name: exercise.name,
        sets: buildExerciseSet(profile.experienceLevel, profile.goals, exercise.category, bodyPriority),
        notes:
          exercise.category === 'Conditioning'
            ? bodyPriority === 'reduce'
              ? 'Low-impact cardio focus. Keep the effort smooth and joint-friendly.'
              : 'Cardio interval focus. Keep the effort smooth and controlled.'
            : exercise.id.includes('glute') || exercise.id.includes('hip')
              ? 'Glute-focused work for endurance, hip drive, and pelvic support.'
              : undefined,
      })
    })
  })

  const exercises = Array.from(selectedExercises.values())

  return { day, focus, exercises, goalDrivers: getGoalDriversForFocus(profile.goals, focus, categories) }
}

export function generateWorkoutPlan(profile: ProfileInput): WorkoutPlan {
  const split = determineSplit(profile.workoutDays)
  const schedule: WorkoutDay[] = []

  for (let day = 1; day <= profile.workoutDays; day += 1) {
    if (split === 'full_body' || split === 'full_body_3x') {
      schedule.push(buildDay(day, 'Full Body', getPreferredCategories(profile, split, day), profile))
      continue
    }

    if (split === 'upper_lower') {
      schedule.push(
        buildDay(
          day,
          day % 2 === 1 ? 'Upper Body' : 'Lower Body',
          getPreferredCategories(profile, split, day),
          profile,
        ),
      )
      continue
    }

    schedule.push(
      buildDay(
        day,
        day % 3 === 1 ? 'Push' : day % 3 === 2 ? 'Pull' : 'Legs',
        getPreferredCategories(profile, split, day),
        profile,
      ),
    )
  }

  const splitNames: Record<string, string> = {
    full_body: 'Full Body',
    full_body_3x: 'Full Body (3x/week)',
    upper_lower: 'Upper/Lower Split',
    push_pull_legs: 'Push/Pull/Legs',
  }

  return {
    name: `${splitNames[split] ?? 'Custom'} Plan`,
    description: `Personalized ${profile.workoutDays}-day/week plan for ${profile.goals.join(', ')}`,
    split,
    schedule,
    estimatedDuration: profile.sessionDuration,
  }
}

export function calculateAgeFromBirthday(birthday: string) {
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return Math.max(age, 0)
}
