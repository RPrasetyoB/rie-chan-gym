import type { ActivityLevel, ExperienceLevel, Gender, WorkoutSetLog, WorkoutStatus } from '../types/domain.js'

export interface AuthUserRecord {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

export interface ProfileRecord {
  userId: string
  birthday: string
  gender: Gender
  height: number
  weight: number
  bodyFat?: number
  goalWeight?: number
  activityLevel: ActivityLevel
  experienceLevel: ExperienceLevel
  injuries?: string
  equipment?: string
  workoutDays: number
  sessionDuration: number
  goals: string[]
}

export interface WorkoutSessionRecord {
  id: string
  userId: string
  planName: string
  exercises: number
  sets: number
  status: WorkoutStatus
  startedAt?: string
  completedAt?: string
  updatedAt?: string
  logs?: WorkoutSetLog[]
}

export const users = new Map<string, AuthUserRecord>()
export const profiles = new Map<string, ProfileRecord>()
export const sessions: WorkoutSessionRecord[] = [
  {
    id: 'session_seed_1',
    userId: 'seed-user',
    planName: 'Upper Body Push',
    exercises: 6,
    sets: 18,
    status: 'completed',
    completedAt: new Date(Date.now() - 86400000).toISOString(),
  },
]
