import { exerciseCatalog } from '../data/exercises.js'

function withRieChanTone(message: string) {
  return `Rie-chan here 💙 ${message}`
}

export function generateCoachReply(prompt: string) {
  const lower = prompt.toLowerCase()

  if (lower.includes('protein')) {
    return withRieChanTone('Aim for roughly 1.6-2.2g of protein per kg of body weight and keep recovery simple and consistent.')
  }

  if (lower.includes('bench')) {
    return withRieChanTone('To improve your bench, keep the setup tight, progress slowly, and track your reps and load week by week.')
  }

  if (lower.includes('hurt') || lower.includes('pain')) {
    return withRieChanTone('If something hurts, stop that movement, reduce load, and consult a healthcare professional if it continues.')
  }

  return withRieChanTone('Tell me your goal, current training split, and equipment, and I’ll help you choose a safe next step.')
}

export function modifyWorkout(constraint: string) {
  const lower = constraint.toLowerCase()

  if (lower.includes('no bench')) {
    return {
      summary: 'Bench Press swapped for Dumbbell Press and Push Ups.',
      exercises: exerciseCatalog.filter((exercise) => ['incline_db_press', 'push_up'].includes(exercise.id)),
    }
  }

  if (lower.includes('no cable')) {
    return {
      summary: 'Cable work swapped for dumbbell and bodyweight variations.',
      exercises: exerciseCatalog.filter((exercise) => ['incline_db_press', 'lateral_raise', 'bicep_curl'].includes(exercise.id)),
    }
  }

  return {
    summary: 'Kept the plan structure and adjusted for your constraint.',
    exercises: exerciseCatalog.slice(0, 3),
  }
}

export function analyzeProgress() {
  return {
    summary: 'Your pushing strength is trending up. Keep the same exercise selection and add small load jumps when reps feel steady.',
    confidence: 'medium',
  }
}

export function recoveryAdvice() {
  return {
    score: 74,
    summary: 'Recovery looks solid. One mobility or rest day would keep your weekly quality high.',
  }
}

export function nutritionAdvice() {
  return {
    calories: 2200,
    summary: 'Try a small carb increase today to support recovery and training performance.',
  }
}
