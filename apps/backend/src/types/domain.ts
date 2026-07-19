export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type WorkoutStatus = 'planned' | 'active' | 'completed' | 'skipped'

export interface WorkoutSetLog {
  exerciseId: string
  exerciseName: string
  setIndex: number
  exerciseIndex: number
  reps: number
  weight: number
  restSeconds: number
  completedAt: string
}
