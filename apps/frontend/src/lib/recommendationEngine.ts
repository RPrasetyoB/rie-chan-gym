import { deriveBodyParts } from './exerciseTaxonomy'
import { getBMIStatus, type BMIStatus } from './utils'

interface UserProfile {
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  bodyFat?: number
  goalWeight?: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  injuries?: string
  equipment?: string
  workoutDays: number
  sessionDuration: number
  goals: string[]
}

interface Exercise {
  id: string
  name: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  equipment: string
  muscleGroups: string[]
  bodyParts?: string[]
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

interface WorkoutPlan {
  name: string
  description: string
  split: string
  schedule: WorkoutDay[]
  estimatedDuration: number
}

type BodyPriority = 'build' | 'balance' | 'reduce'

function hasGoal(goals: string[], keywords: string[]) {
  return goals.some((goal) => keywords.some((keyword) => goal.includes(keyword)))
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  strength: 'Strength',
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

export function formatGoalLabel(goalId: string) {
  return GOAL_LABELS[goalId] ?? goalId.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getGoalProfile(goals: string[]) {
  return {
    strength: hasGoal(goals, ['strength', 'build_muscle']),
    conditioning: hasGoal(goals, ['endurance', 'cardiovascular', 'lose_weight', 'fat_loss', 'improve_stamina']),
    mobility: hasGoal(goals, ['mobility', 'flexibility', 'hip_mobility']),
    posture: hasGoal(goals, ['better_posture']),
    core: hasGoal(goals, ['core_strength', 'pelvic_floor']),
  }
}

function getBodyStatus(profile: UserProfile): BMIStatus {
  return getBMIStatus(profile.weight, profile.height).status
}

function getBodyPriority(profile: UserProfile): BodyPriority {
  const status = getBodyStatus(profile)
  if (status === 'underweight') return 'build'
  if (status === 'overweight' || status === 'obese') return 'reduce'
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
  const hasCore = categories.includes('Core') || categories.includes('Waist')
  const hasMobility = categories.includes('Mobility')
  const hasConditioning = categories.includes('Conditioning') || focus.toLowerCase().includes('cardio') || focus.toLowerCase().includes('conditioning')

  if (goalProfile.strength && hasUpperOrLower) {
    addGoals(['strength', 'build_muscle', 'general_fitness'])
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

  if (drivers.size === 0) {
    goals.forEach((goal) => drivers.add(formatGoalLabel(goal)))
  }

  return Array.from(drivers)
}

const RAW_EXERCISE_DATABASE: Exercise[] = [
  // Chest
  { id: 'bench_press', name: 'Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press', category: 'Chest', difficulty: 'intermediate', equipment: 'dumbbell', muscleGroups: ['Chest', 'Shoulders'] },
  { id: 'cable_fly', name: 'Cable Fly', category: 'Chest', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Chest'] },
  { id: 'push_up', name: 'Push Up', category: 'Chest', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'dumbbell_fly', name: 'Dumbbell Fly', category: 'Chest', difficulty: 'intermediate', equipment: 'dumbbell', muscleGroups: ['Chest'] },
  { id: '0025', name: 'Barbell Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '0033', name: 'Barbell Decline Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '0009', name: 'Assisted Chest Dip (Kneeling)', category: 'Chest', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps'] },
  { id: '2364', name: 'Assisted Wide-Grip Chest Dip (Kneeling)', category: 'Chest', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps'] },
  { id: '1254', name: 'Band Bench Press', category: 'Chest', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Chest', 'Triceps'] },
  { id: '0047', name: 'Barbell Incline Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Shoulders', 'Triceps'] },
  { id: '0122', name: 'Barbell Wide Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '0151', name: 'Cable Bench Press', category: 'Chest', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Chest', 'Triceps'] },
  { id: '0169', name: 'Cable Incline Bench Press', category: 'Chest', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Chest', 'Shoulders', 'Triceps'] },
  { id: '0171', name: 'Cable Incline Fly', category: 'Chest', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Chest'] },
  { id: 'barbell_bench_press', name: 'Barbell Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'barbell_decline_bench_press', name: 'Barbell Decline Bench Press', category: 'Chest', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'assisted_chest_dip_kneeling', name: 'Assisted Chest Dip (Kneeling)', category: 'Chest', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps'] },
  { id: 'assisted_wide_grip_chest_dip_kneeling', name: 'Assisted Wide-Grip Chest Dip (Kneeling)', category: 'Chest', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps'] },
  { id: 'band_bench_press', name: 'Band Bench Press', category: 'Chest', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Chest', 'Triceps'] },
  { id: 'band_one_arm_twisting_chest_press', name: 'Band One Arm Twisting Chest Press', category: 'Chest', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Chest', 'Shoulders'] },
  { id: 'archer_push_up', name: 'Archer Push Up', category: 'Chest', difficulty: 'advanced', equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
  
  // Back
  { id: 'deadlift', name: 'Deadlift', category: 'Back', difficulty: 'advanced', equipment: 'barbell', muscleGroups: ['Back', 'Glutes', 'Hamstrings'] },
  { id: 'pull_up', name: 'Pull Up', category: 'Back', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Back', 'Biceps'] },
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'Back', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Back', 'Biceps'] },
  { id: 'barbell_row', name: 'Barbell Row', category: 'Back', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Back', 'Biceps'] },
  { id: 'seated_cable_row', name: 'Seated Cable Row', category: 'Back', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Back', 'Biceps'] },
  { id: '0007', name: 'Alternate Lateral Pulldown', category: 'Back', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Lats', 'Back'] },
  { id: '3293', name: 'Archer Pull Up', category: 'Back', difficulty: 'advanced', equipment: 'bodyweight', muscleGroups: ['Lats', 'Biceps'] },
  { id: '0015', name: 'Assisted Parallel Close Grip Pull-Up', category: 'Back', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Lats', 'Biceps'] },
  { id: '0017', name: 'Assisted Pull-Up', category: 'Back', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Lats', 'Biceps'] },
  { id: '1431', name: 'Assisted Standing Chin-Up', category: 'Back', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Lats', 'Biceps'] },
  { id: '0970', name: 'Band Assisted Pull-Up', category: 'Back', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Lats', 'Biceps'] },
  { id: '0974', name: 'Band Close-Grip Pulldown', category: 'Back', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Lats', 'Back'] },
  { id: '0983', name: 'Band Kneeling One Arm Pulldown', category: 'Back', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Lats', 'Back'] },
  { id: '0027', name: 'Barbell Bent Over Row', category: 'Back', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Back', 'Biceps'] },
  { id: '3017', name: 'Barbell Pendlay Row', category: 'Back', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Back', 'Biceps'] },
  { id: 'alternate_lateral_pulldown', name: 'Alternate Lateral Pulldown', category: 'Back', difficulty: 'intermediate', equipment: 'cable', muscleGroups: ['Lats', 'Back'] },
  { id: 'assisted_parallel_close_grip_pull_up', name: 'Assisted Parallel Close Grip Pull-Up', category: 'Back', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Lats', 'Biceps'] },
  { id: 'assisted_pull_up', name: 'Assisted Pull-Up', category: 'Back', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Lats', 'Biceps'] },
  { id: 'band_assisted_pull_up', name: 'Band Assisted Pull-Up', category: 'Back', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Lats', 'Biceps'] },
  { id: 'band_close_grip_pulldown', name: 'Band Close-Grip Pulldown', category: 'Back', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Lats', 'Back'] },
  { id: 'band_kneeling_one_arm_pulldown', name: 'Band Kneeling One Arm Pulldown', category: 'Back', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Lats', 'Back'] },
  { id: 'archer_pull_up', name: 'Archer Pull Up', category: 'Back', difficulty: 'advanced', equipment: 'bodyweight', muscleGroups: ['Back', 'Biceps'] },
  
  // Shoulders
  { id: 'overhead_press', name: 'Overhead Press', category: 'Shoulders', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Shoulders', 'Triceps'] },
  { id: 'lateral_raise', name: 'Lateral Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'dumbbell', muscleGroups: ['Shoulders'] },
  { id: 'face_pull', name: 'Face Pull', category: 'Shoulders', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Shoulders', 'Rear Delts'] },
  { id: 'arnold_press', name: 'Arnold Press', category: 'Shoulders', difficulty: 'intermediate', equipment: 'dumbbell', muscleGroups: ['Shoulders'] },
  { id: '0977', name: 'Band Front Lateral Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Delts'] },
  { id: '0993', name: 'Band Reverse Fly', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Delts', 'Rear Delts'] },
  { id: '0997', name: 'Band Shoulder Press', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Shoulders', 'Triceps'] },
  { id: '1022', name: 'Band Standing Rear Delt Row', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Rear Delts'] },
  { id: '0075', name: 'Barbell Rear Delt Raise', category: 'Shoulders', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Rear Delts'] },
  { id: '0978', name: 'Band Front Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Delts'] },
  { id: '1012', name: 'Band Twisting Overhead Press', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Shoulders', 'Triceps'] },
  { id: '1017', name: 'Band Y-Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Rear Delts', 'Traps'] },
  { id: '0076', name: 'Barbell Rear Delt Row', category: 'Shoulders', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Rear Delts', 'Back'] },
  { id: '0148', name: 'Cable Alternate Shoulder Press', category: 'Shoulders', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Shoulders', 'Triceps'] },
  { id: 'band_front_lateral_raise', name: 'Band Front Lateral Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Delts'] },
  { id: 'band_reverse_fly', name: 'Band Reverse Fly', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Delts', 'Rear Delts'] },
  { id: 'band_shoulder_press', name: 'Band Shoulder Press', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Shoulders', 'Triceps'] },
  { id: 'band_standing_rear_delt_row', name: 'Band Standing Rear Delt Row', category: 'Shoulders', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Rear Delts'] },
  { id: 'barbell_rear_delt_raise', name: 'Barbell Rear Delt Raise', category: 'Shoulders', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Rear Delts'] },
  { id: 'barbell_upright_row', name: 'Barbell Upright Row', category: 'Shoulders', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Shoulders', 'Traps'] },
  { id: 'cable_lateral_raise', name: 'Cable Lateral Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Delts'] },
  { id: 'dumbbell_lateral_raise', name: 'Dumbbell Lateral Raise', category: 'Shoulders', difficulty: 'beginner', equipment: 'dumbbell', muscleGroups: ['Delts'] },
  { id: 'dumbbell_reverse_fly', name: 'Dumbbell Reverse Fly', category: 'Shoulders', difficulty: 'beginner', equipment: 'dumbbell', muscleGroups: ['Rear Delts'] },
  { id: 'dumbbell_seated_shoulder_press', name: 'Dumbbell Seated Shoulder Press', category: 'Shoulders', difficulty: 'intermediate', equipment: 'dumbbell', muscleGroups: ['Shoulders', 'Triceps'] },
  
  // Arms
  { id: 'bicep_curl', name: 'Bicep Curl', category: 'Arms', difficulty: 'beginner', equipment: 'dumbbell', muscleGroups: ['Biceps'] },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', category: 'Arms', difficulty: 'beginner', equipment: 'cable', muscleGroups: ['Triceps'] },
  { id: 'hammer_curl', name: 'Hammer Curl', category: 'Arms', difficulty: 'beginner', equipment: 'dumbbell', muscleGroups: ['Biceps', 'Forearms'] },
  { id: 'skull_crusher', name: 'Skull Crusher', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Triceps'] },
  { id: '0023', name: 'Barbell Alternate Biceps Curl', category: 'Arms', difficulty: 'beginner', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: '0031', name: 'Barbell Curl', category: 'Arms', difficulty: 'beginner', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: '0038', name: 'Barbell Drag Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: '0059', name: 'Barbell Lying Preacher Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: '0070', name: 'Barbell Preacher Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: '0968', name: 'Band Alternating Biceps Curl', category: 'Arms', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Biceps'] },
  { id: '0976', name: 'Band Concentration Curl', category: 'Arms', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Biceps'] },
  { id: '0986', name: 'Band One Arm Overhead Biceps Curl', category: 'Arms', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Biceps'] },
  { id: '0052', name: 'Barbell JM Bench Press', category: 'Arms', difficulty: 'advanced', equipment: 'barbell', muscleGroups: ['Triceps', 'Chest'] },
  { id: '0061', name: 'Barbell Lying Triceps Extension', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Triceps'] },
  { id: 'barbell_alternate_biceps_curl', name: 'Barbell Alternate Biceps Curl', category: 'Arms', difficulty: 'beginner', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: 'barbell_curl', name: 'Barbell Curl', category: 'Arms', difficulty: 'beginner', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: 'barbell_drag_curl', name: 'Barbell Drag Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: 'barbell_lying_preacher_curl', name: 'Barbell Lying Preacher Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: 'barbell_preacher_curl', name: 'Barbell Preacher Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: 'barbell_prone_incline_curl', name: 'Barbell Prone Incline Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps'] },
  { id: 'barbell_reverse_curl', name: 'Barbell Reverse Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps', 'Forearms'] },
  { id: 'barbell_reverse_preacher_curl', name: 'Barbell Reverse Preacher Curl', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Biceps', 'Forearms'] },
  { id: 'assisted_triceps_dip_kneeling', name: 'Assisted Triceps Dip (Kneeling)', category: 'Arms', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Triceps'] },
  { id: 'assisted_standing_triceps_extension_with_towel', name: 'Assisted Standing Triceps Extension (With Towel)', category: 'Arms', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Triceps'] },
  { id: 'band_close_grip_push_up', name: 'Band Close-Grip Push Up', category: 'Arms', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Triceps', 'Chest'] },
  { id: 'band_side_triceps_extension', name: 'Band Side Triceps Extension', category: 'Arms', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Triceps'] },
  { id: 'barbell_close_grip_bench_press', name: 'Barbell Close-Grip Bench Press', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Triceps', 'Chest'] },
  { id: 'barbell_decline_close_grip_to_skull_press', name: 'Barbell Decline Close Grip To Skull Press', category: 'Arms', difficulty: 'advanced', equipment: 'barbell', muscleGroups: ['Triceps'] },
  { id: 'barbell_incline_close_grip_bench_press', name: 'Barbell Incline Close Grip Bench Press', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Triceps', 'Chest'] },
  { id: 'barbell_jm_bench_press', name: 'Barbell JM Bench Press', category: 'Arms', difficulty: 'advanced', equipment: 'barbell', muscleGroups: ['Triceps', 'Chest'] },
  { id: 'barbell_lie_close_grip_press', name: 'Barbell Lying Close-Grip Press', category: 'Arms', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Triceps'] },
  
  // Legs
  { id: 'squat', name: 'Squat', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'leg_press', name: 'Leg Press', category: 'Legs', difficulty: 'beginner', equipment: 'machine', muscleGroups: ['Quads', 'Glutes'] },
  { id: 'lunge', name: 'Lunge', category: 'Legs', difficulty: 'beginner', equipment: 'dumbbell', muscleGroups: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Hamstrings', 'Glutes'] },
  { id: 'leg_curl', name: 'Leg Curl', category: 'Legs', difficulty: 'beginner', equipment: 'machine', muscleGroups: ['Hamstrings'] },
  { id: 'calf_raise', name: 'Calf Raise', category: 'Legs', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Calves'] },
  { id: '0024', name: 'Barbell Bench Front Squat', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Quads', 'Glutes'] },
  { id: '0026', name: 'Barbell Bench Squat', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Quads', 'Glutes'] },
  { id: '0044', name: 'Barbell Good Morning', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Hamstrings', 'Glutes'] },
  { id: '0116', name: 'Barbell Straight Leg Deadlift', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Hamstrings', 'Glutes'] },
  { id: '1473', name: 'Backward Jump', category: 'Legs', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Quads', 'Glutes'] },
  { id: 'barbell_full_squat', name: 'Barbell Full Squat', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Quads', 'Glutes'] },
  { id: 'barbell_front_squat', name: 'Barbell Front Squat', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Quads', 'Core'] },
  { id: 'barbell_one_leg_squat', name: 'Barbell One Leg Squat', category: 'Legs', difficulty: 'advanced', equipment: 'barbell', muscleGroups: ['Quads', 'Glutes'] },
  { id: 'barbell_straight_leg_deadlift', name: 'Barbell Straight Leg Deadlift', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Hamstrings', 'Glutes'] },
  { id: 'barbell_good_morning', name: 'Barbell Good Morning', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Hamstrings', 'Glutes'] },
  { id: 'barbell_glute_bridge', name: 'Barbell Glute Bridge', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: 'low_glute_bridge_on_floor', name: 'Low Glute Bridge On Floor', category: 'Legs', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: 'resistance_band_hip_thrusts_on_knees', name: 'Resistance Band Hip Thrusts On Knees', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Glutes', 'Core'] },
  { id: 'single_leg_bridge_with_outstretched_leg', name: 'Single Leg Bridge With Outstretched Leg', category: 'Legs', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Core'] },
  { id: 'side_hip_abduction', name: 'Side Hip Abduction', category: 'Legs', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Abductors'] },
  { id: 'band_step_up', name: 'Band Step-Up', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Quads', 'Glutes'] },
  { id: 'band_single_leg_split_squat', name: 'Band Single Leg Split Squat', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Quads', 'Glutes'] },
  { id: 'backward_jump', name: 'Backward Jump', category: 'Legs', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Quads', 'Glutes'] },
  { id: '0980', name: 'Band Bent-Over Hip Extension', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: '0987', name: 'Band One Arm Single Leg Split Squat', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Quads', 'Glutes'] },
  { id: '0991', name: 'Band Pull Through', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: '1008', name: 'Band Step-Up', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Quads', 'Glutes'] },
  { id: '0032', name: 'Barbell Deadlift', category: 'Legs', difficulty: 'advanced', equipment: 'barbell', muscleGroups: ['Back', 'Glutes', 'Hamstrings'] },
  
  // Core
  { id: 'plank', name: 'Plank', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Core'] },
  { id: 'crunch', name: 'Crunch', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs'] },
  { id: 'leg_raise', name: 'Leg Raise', category: 'Core', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: 'russian_twist', name: 'Russian Twist', category: 'Core', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Abs', 'Obliques'] },
  { id: '0001', name: '3/4 Sit Up', category: 'Waist', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs'] },
  { id: '0002', name: '45 Degree Side Bend', category: 'Waist', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs'] },
  { id: '0006', name: 'Alternate Heel Touchers', category: 'Waist', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Obliques'] },
  { id: '0011', name: 'Assisted Hanging Knee Raise', category: 'Waist', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: '0014', name: 'Assisted Motion Russian Twist', category: 'Waist', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Obliques'] },
  { id: '0971', name: 'Band Assisted Wheel Rollerout', category: 'Waist', difficulty: 'intermediate', equipment: 'band', muscleGroups: ['Core'] },
  { id: '0979', name: 'Band Horizontal Pallof Press', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Obliques'] },
  { id: '0981', name: 'Band Jack Knife Sit-Up', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs'] },
  { id: '0985', name: 'Band Kneeling Twisting Crunch', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Obliques'] },
  { id: '3544', name: 'Bodyweight Incline Side Plank', category: 'Waist', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Obliques', 'Core'] },
  { id: '0969', name: 'Band Alternating V-Up', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: '0972', name: 'Band Bicycle Crunch', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Obliques'] },
  { id: '0992', name: 'Band Push Sit-Up', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs'] },
  { id: '1005', name: 'Band Standing Crunch', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs'] },
  { id: '1011', name: 'Band Seated Twist', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Obliques'] },
  { id: '1014', name: 'Band V-Up', category: 'Waist', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: '0071', name: 'Barbell Press Sit-Up', category: 'Waist', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Abs'] },
  { id: '0084', name: 'Barbell Rollerout', category: 'Waist', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Core'] },
  { id: '0094', name: 'Barbell Seated Twist', category: 'Waist', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Abs', 'Obliques'] },
  { id: '0103', name: 'Barbell Standing Ab Rollerout', category: 'Waist', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Core'] },
  { id: '3_4_sit_up', name: '3/4 Sit Up', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs'] },
  { id: 'alternate_heel_touchers', name: 'Alternate Heel Touchers', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Obliques'] },
  { id: 'assisted_hanging_knee_raise', name: 'Assisted Hanging Knee Raise', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: 'assisted_hanging_knee_raise_with_throw_down', name: 'Assisted Hanging Knee Raise With Throw Down', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: 'assisted_motion_russian_twist', name: 'Assisted Motion Russian Twist', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Obliques'] },
  { id: 'band_bicycle_crunch', name: 'Band Bicycle Crunch', category: 'Core', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Obliques'] },
  { id: 'band_jack_knife_sit_up', name: 'Band Jack Knife Sit Up', category: 'Core', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs'] },
  { id: 'band_lying_straight_leg_raise', name: 'Band Lying Straight Leg Raise', category: 'Core', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: 'band_wheel_rollerout', name: 'Band Wheel Rollerout', category: 'Core', difficulty: 'intermediate', equipment: 'band', muscleGroups: ['Core'] },
  { id: 'reverse_crunch', name: 'Reverse Crunch', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs'] },
  { id: 'motion_russian_twist', name: 'Motion Russian Twist', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Obliques'] },

  // Conditioning
  { id: '0003', name: 'Air Bike', category: 'Conditioning', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Core'] },
  { id: '1160', name: 'Burpee', category: 'Conditioning', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Full Body'] },
  { id: '1201', name: 'Dumbbell Burpee', category: 'Conditioning', difficulty: 'intermediate', equipment: 'dumbbell', muscleGroups: ['Cardio', 'Full Body'] },
  { id: '0501', name: 'Jack Burpee', category: 'Conditioning', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Full Body'] },
  { id: '2612', name: 'Jump Rope', category: 'Conditioning', difficulty: 'beginner', equipment: 'rope', muscleGroups: ['Cardio', 'Calves'] },
  { id: '0630', name: 'Mountain Climber', category: 'Conditioning', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Core'] },
  { id: '3360', name: 'Bear Crawl', category: 'Conditioning', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Core'] },
  { id: '3223', name: 'Star Jump', category: 'Conditioning', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Full Body'] },
  { id: '3637', name: 'Wheel Run', category: 'Conditioning', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Legs'] },
  { id: '2138', name: 'Stationary Bike Run V. 3', category: 'Conditioning', difficulty: 'beginner', equipment: 'stationary bike', muscleGroups: ['Cardio', 'Legs'] },
  { id: '0798', name: 'Stationary Bike Walk', category: 'Conditioning', difficulty: 'beginner', equipment: 'machine', muscleGroups: ['Cardio', 'Legs'] },
  { id: '2141', name: 'Walk Elliptical Cross Trainer', category: 'Conditioning', difficulty: 'beginner', equipment: 'elliptical machine', muscleGroups: ['Cardio', 'Legs'] },
  { id: '3655', name: 'Walking High Knees Lunge', category: 'Conditioning', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Legs'] },
  { id: '3666', name: 'Walking on Incline Treadmill', category: 'Conditioning', difficulty: 'beginner', equipment: 'machine', muscleGroups: ['Cardio', 'Legs'] },
  { id: '0858', name: 'Wind Sprints', category: 'Conditioning', difficulty: 'advanced', equipment: 'bodyweight', muscleGroups: ['Cardio', 'Legs'] },

  // Mobility and posture
  { id: 'all_fours_squad_stretch', name: 'All Fours Squad Stretch', category: 'Mobility', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Quads', 'Hips'] },
  { id: 'ankle_circles', name: 'Ankle Circles', category: 'Mobility', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Ankles'] },
  { id: 'barbell_glute_bridge', name: 'Barbell Glute Bridge', category: 'Legs', difficulty: 'intermediate', equipment: 'barbell', muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: 'glute_bridge_march', name: 'Glute Bridge March', category: 'Legs', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Core'] },
  { id: 'low_glute_bridge_on_floor', name: 'Low Glute Bridge On Floor', category: 'Legs', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Hamstrings'] },
  { id: 'resistance_band_hip_thrusts_on_knees', name: 'Resistance Band Hip Thrusts On Knees', category: 'Legs', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Glutes', 'Core'] },
  { id: 'single_leg_bridge_with_outstretched_leg', name: 'Single Leg Bridge With Outstretched Leg', category: 'Legs', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Core'] },
  { id: 'side_hip_abduction', name: 'Side Hip Abduction', category: 'Legs', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Glutes', 'Abductors'] },
  { id: 'pelvic_tilt', name: 'Pelvic Tilt', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Core', 'Pelvic Floor'] },
  { id: 'standing_pelvic_tilt', name: 'Standing Pelvic Tilt', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Core', 'Back'] },
  { id: 'bodyweight_incline_side_plank', name: 'Bodyweight Incline Side Plank', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Obliques', 'Core'] },
  { id: 'front_plank_with_twist', name: 'Front Plank With Twist', category: 'Core', difficulty: 'intermediate', equipment: 'bodyweight', muscleGroups: ['Core', 'Obliques'] },
  { id: 'reverse_crunch', name: 'Reverse Crunch', category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs'] },
  { id: 'captains_chair_straight_leg_raise', name: "Captain's Chair Straight Leg Raise", category: 'Core', difficulty: 'beginner', equipment: 'bodyweight', muscleGroups: ['Abs', 'Hip Flexors'] },
  { id: 'hip_internal_rotation', name: 'Hip Internal Rotation', category: 'Mobility', difficulty: 'beginner', equipment: 'band', muscleGroups: ['Hips', 'Glutes'] },
  { id: 'lying_glutes_stretch', name: 'Lying Glutes Stretch', category: 'Mobility', difficulty: 'beginner', equipment: 'assisted', muscleGroups: ['Glutes'] },
]

const EXERCISE_DATABASE = RAW_EXERCISE_DATABASE.map((exercise) => ({
  ...exercise,
  bodyParts: deriveBodyParts(exercise),
}))

function getRepRange(experience: string, goals: string[], bodyStatus: BMIStatus): { min: number, max: number } {
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
  if (bodyStatus === 'underweight') {
    return { min: 6, max: 10 }
  }
  if (bodyStatus === 'overweight' || bodyStatus === 'obese') {
    return { min: 10, max: 15 }
  }
  return { min: 8, max: 12 }
}

function getSetCount(experience: string, goals: string[], bodyStatus: BMIStatus): number {
  const goalProfile = getGoalProfile(goals)

  if (goalProfile.mobility) {
    if (experience === 'beginner') return 2
    if (experience === 'intermediate') return 3
    return 3
  }

  if (goalProfile.posture || goalProfile.core) {
    if (experience === 'beginner') return 3
    if (experience === 'intermediate') return 3
    return 4
  }

  if (goalProfile.strength || goalProfile.conditioning) {
    if (experience === 'beginner') return 3
    if (experience === 'intermediate') return 4
    return bodyStatus === 'underweight' ? 5 : 4
  }

  if (experience === 'beginner') return 3
  if (experience === 'intermediate') return 4
  return bodyStatus === 'underweight' ? 5 : 4
}

function getRestTime(experience: string, exerciseType: string, goals: string[], bodyStatus: BMIStatus): number {
  const goalProfile = getGoalProfile(goals)

  if (goalProfile.mobility) {
    return exerciseType === 'compound' ? 45 : 30
  }

  if (goalProfile.posture || goalProfile.core) {
    return exerciseType === 'compound' ? 60 : 45
  }

  if (goalProfile.conditioning) {
    return exerciseType === 'compound' ? 45 : 30
  }

  if (bodyStatus === 'underweight') {
    return exerciseType === 'compound' ? 120 : 75
  }

  if (bodyStatus === 'overweight' || bodyStatus === 'obese') {
    return exerciseType === 'compound' ? 75 : 45
  }

  if (exerciseType === 'compound') {
    return experience === 'beginner' ? 90 : 120
  }
  return 60
}

function determineSplit(workoutDays: number): string {
  if (workoutDays <= 2) return 'full_body'
  if (workoutDays === 3) return 'full_body_3x'
  if (workoutDays === 4) return 'upper_lower'
  if (workoutDays >= 5) return 'push_pull_legs'
  return 'full_body'
}

function filterExercisesByEquipment(exercises: Exercise[], equipment: string): Exercise[] {
  if (!equipment || equipment.toLowerCase().includes('gym')) {
    return exercises
  }
  
  const hasDumbbells = equipment.toLowerCase().includes('dumbbell')
  const hasCables = equipment.toLowerCase().includes('cable')
  return exercises.filter(ex => {
    if (ex.equipment === 'bodyweight') return true
    if (hasDumbbells && ex.equipment === 'dumbbell') return true
    if (hasCables && ex.equipment === 'cable') return true
    if (ex.equipment === 'bodyweight') return true
    return false
  })
}

function filterExercisesByInjury(exercises: Exercise[], injuries?: string): Exercise[] {
  if (!injuries) return exercises
  
  const lowerInjuries = injuries.toLowerCase()
  return exercises.filter(ex => {
    const bodyParts = ex.bodyParts ?? deriveBodyParts(ex)
    if (lowerInjuries.includes('shoulder') && bodyParts.includes('Shoulders')) return false
    if (lowerInjuries.includes('knee') && bodyParts.includes('Legs')) return false
    if (lowerInjuries.includes('back') && bodyParts.includes('Back')) return false
    return true
  })
}

function exerciseMatchesCategory(exercise: Exercise, category: string) {
  return (exercise.bodyParts ?? deriveBodyParts(exercise)).includes(category)
}

function getPreferredCategories(profile: UserProfile, split: string, day: number) {
  const goalProfile = getGoalProfile(profile.goals)
  const bodyPriority = getBodyPriority(profile)

  if (split === 'full_body' || split === 'full_body_3x') {
    if (goalProfile.mobility) return ['Mobility', 'Waist', 'Legs', 'Back']
    if (goalProfile.posture) return ['Back', 'Shoulders', 'Waist', 'Mobility']
    if (goalProfile.core) return ['Waist', 'Legs', 'Back', 'Mobility']
    if (goalProfile.conditioning) return ['Conditioning', 'Waist', 'Legs', 'Back']
    if (bodyPriority === 'build') return ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Waist']
    if (bodyPriority === 'reduce') return ['Conditioning', 'Legs', 'Back', 'Waist', 'Shoulders']
    return ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
  }

  if (split === 'upper_lower') {
    const upper = day % 2 === 1
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
    return upper ? ['Chest', 'Back', 'Shoulders', 'Arms'] : ['Legs', 'Core']
  }

  const phase = day % 3
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

function buildExerciseSet(experience: string, goals: string[], category: string, bodyStatus: BMIStatus) {
  const goalProfile = getGoalProfile(goals)
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
      : getSetCount(experience, goals, bodyStatus)

  const repRange =
    category === 'Mobility'
      ? { min: 8, max: 12 }
    : category === 'Conditioning'
        ? { min: 20, max: 30 }
      : (category === 'Core' || category === 'Waist') && (goalProfile.mobility || goalProfile.posture || goalProfile.core)
        ? { min: 10, max: 15 }
        : getRepRange(experience, goals, bodyStatus)

  const restTime =
    category === 'Mobility'
      ? 30
      : category === 'Conditioning'
        ? 30
      : (category === 'Core' || category === 'Waist') && (goalProfile.mobility || goalProfile.posture || goalProfile.core)
        ? 45
        : getRestTime(experience, category === 'Chest' || category === 'Back' || category === 'Legs' ? 'compound' : 'isolation', goals, bodyStatus)

  const targetReps = Math.round((repRange.min + repRange.max) / 2)
  const adjustedReps =
    bodyStatus === 'underweight' && category !== 'Conditioning' && category !== 'Mobility'
      ? Math.max(targetReps - 2, 4)
      : bodyStatus === 'obese' && category === 'Conditioning'
        ? Math.max(targetReps - 4, 12)
        : targetReps

  return Array.from({ length: sets }, () => ({
    reps: adjustedReps,
    restTime,
  }))
}

function buildDay(day: number, focus: string, categories: string[], profile: UserProfile) {
  const availableExercises = filterExercisesByInjury(filterExercisesByEquipment(EXERCISE_DATABASE, profile.equipment || ''), profile.injuries)
  const goalProfile = getGoalProfile(profile.goals)
  const bodyStatus = getBodyStatus(profile)
  const categoryPreferences: Record<string, string[]> = {
    Chest: ['barbell_bench_press', 'barbell_decline_bench_press', '0047', '0122', '0151', '0169', '0171', 'assisted_chest_dip_kneeling', 'assisted_wide_grip_chest_dip_kneeling', 'band_bench_press', 'band_one_arm_twisting_chest_press', 'archer_push_up'],
    Back: ['alternate_lateral_pulldown', '0970', '0974', '0983', '0027', '3017', 'assisted_parallel_close_grip_pull_up', 'assisted_pull_up', 'band_assisted_pull_up', 'band_close_grip_pulldown', 'band_kneeling_one_arm_pulldown', 'archer_pull_up', 'band_shrug'],
    Shoulders: ['0978', '1012', '1017', '0076', '0148', 'band_front_lateral_raise', 'band_reverse_fly', 'band_shoulder_press', 'band_standing_rear_delt_row', 'barbell_rear_delt_raise', 'barbell_upright_row', 'cable_lateral_raise', 'cable_shoulder_press', 'dumbbell_reverse_fly', 'dumbbell_seated_shoulder_press'],
    Arms: ['barbell_alternate_biceps_curl', 'barbell_curl', 'barbell_drag_curl', '0052', '0061', 'barbell_preacher_curl', '0968', '0976', '0986', 'barbell_reverse_curl', 'assisted_triceps_dip_kneeling', 'assisted_standing_triceps_extension_with_towel', 'band_close_grip_push_up', 'band_side_triceps_extension', 'barbell_close_grip_bench_press', 'barbell_jm_bench_press'],
    Legs: ['barbell_full_squat', 'barbell_front_squat', 'barbell_one_leg_squat', 'barbell_straight_leg_deadlift', 'barbell_good_morning', '0032', 'backward_jump', '0980', '0987', '0991', '1008', 'band_step_up', 'band_single_leg_split_squat', 'barbell_glute_bridge', 'low_glute_bridge_on_floor', 'resistance_band_hip_thrusts_on_knees', 'single_leg_bridge_with_outstretched_leg', 'side_hip_abduction'],
    Waist: ['0001', '0002', '0006', '0011', '0014', '0969', '0971', '0972', '0979', '0981', '0985', '0992', '1005', '1011', '1014', '0071', '0084', '0094', '0103', '0112', '3544', '2466', '0873', '0211', '0212', '2399', '0222', '0223', '0226', '0874', '0230', '0242', '0243', '0862', '2963', '0262', '0267', '3204', '2333', '2355'],
    Conditioning: ['0003', '3360', '3223', '3637', '0630', '2612', '1160', '0858'],
  }

  if (bodyStatus === 'overweight' || bodyStatus === 'obese') {
    categoryPreferences.Conditioning = ['0798', '2141', '3666', '2138', '0003', '0630', '2612', '3360', '3223', '3637']
  }

  if (bodyStatus === 'underweight') {
    categoryPreferences.Conditioning = ['0003', '0630', '2612', '0798', '2141']
  }
  const selectedExercises = new Map<string, WorkoutExercise>()

  categories.forEach((category) => {
    const categoryExercises = availableExercises.filter((exercise) => exerciseMatchesCategory(exercise, category))
    const preferred = categoryPreferences[category] ?? []
    const preferredExercises = preferred
      .map((id) => categoryExercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise))

    const pool = preferredExercises.length > 0 ? preferredExercises : categoryExercises
    const rotation = pool.length > 1 ? (day - 1) % pool.length : 0
    const rotatedPool = pool.slice(rotation).concat(pool.slice(0, rotation))

    const maxForCategory =
      category === 'Legs'
        ? goalProfile.conditioning || goalProfile.core || goalProfile.posture
          ? 3
          : 2
        : category === 'Waist'
          ? 2
          : category === 'Conditioning'
            ? 2
            : profile.sessionDuration >= 50
              ? 2
              : 1

    rotatedPool.slice(0, maxForCategory).forEach((exercise) => {
      if (!exercise || selectedExercises.has(exercise.id)) return

      selectedExercises.set(exercise.id, {
        exerciseId: exercise.id,
        name: exercise.name,
        sets: buildExerciseSet(profile.experienceLevel, profile.goals, exercise.category, bodyStatus),
        notes:
          exercise.category === 'Conditioning'
            ? bodyStatus === 'overweight' || bodyStatus === 'obese'
              ? 'Low-impact cardio focus. Keep the effort steady and joint-friendly.'
              : 'Cardio interval focus. Keep your pace sustainable and steady.'
            : exercise.id.includes('glute') || exercise.id.includes('hip')
              ? 'Glute-focused work for endurance, hip drive, and pelvic support.'
              : undefined,
      })
    })
  })

  const exercises = Array.from(selectedExercises.values())

  return { day, focus, exercises, goalDrivers: getGoalDriversForFocus(profile.goals, focus, categories) }
}

export function generateWorkoutPlan(profile: UserProfile): WorkoutPlan {
  const split = determineSplit(profile.workoutDays)
  const schedule: WorkoutDay[] = []
  
  for (let day = 1; day <= profile.workoutDays; day++) {
    let workoutDay: WorkoutDay
    
    switch (split) {
      case 'full_body':
      case 'full_body_3x':
        workoutDay = buildDay(day, 'Full Body', getPreferredCategories(profile, split, day), profile)
        break
      case 'upper_lower':
        workoutDay = buildDay(
          day,
          day % 2 === 1 ? 'Upper Body' : 'Lower Body',
          getPreferredCategories(profile, split, day),
          profile,
        )
        break
      case 'push_pull_legs':
        workoutDay = buildDay(
          day,
          day % 3 === 1 ? 'Push' : day % 3 === 2 ? 'Pull' : 'Legs',
          getPreferredCategories(profile, split, day),
          profile,
        )
        break
      default:
        workoutDay = buildDay(day, 'Full Body', getPreferredCategories(profile, 'full_body', day), profile)
    }
    
    schedule.push(workoutDay)
  }
  
  const splitNames: Record<string, string> = {
    'full_body': 'Full Body',
    'full_body_3x': 'Full Body (3x/week)',
    'upper_lower': 'Upper/Lower Split',
    'push_pull_legs': 'Push/Pull/Legs'
  }
  
  return {
    name: `${splitNames[split] || 'Custom'} Plan`,
    description: `Personalized ${profile.workoutDays}-day/week plan for ${profile.experienceLevel} ${profile.goals.join(', ')}`,
    split,
    schedule,
    estimatedDuration: profile.sessionDuration
  }
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(e => e.id === id)
}

export function getAllExercises(): Exercise[] {
  return EXERCISE_DATABASE
}
