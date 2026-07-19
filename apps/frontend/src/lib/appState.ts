import { generateWorkoutPlan } from '@/lib/recommendationEngine'
import {
  loadOnboardingState,
  calculateAgeFromBirthday,
} from '@/lib/onboardingStorage'

export interface AuthSession {
  name: string
  email: string
  createdAt: string
}

export interface WorkoutCompletion {
  completedAt: string
  planName: string
  exercises: number
  sets: number
}

const AUTH_KEY = 'rie-chan-auth-session'
const WORKOUT_KEY = 'rie-chan-workout-history'

function isClient() {
  return typeof window !== 'undefined'
}

export function loadAuthSession(): AuthSession | null {
  if (!isClient()) return null

  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  if (!isClient()) return
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  if (!isClient()) return
  window.localStorage.removeItem(AUTH_KEY)
}

export function getResolvedProfile() {
  const onboardingState = loadOnboardingState()
  const profile = onboardingState.profile

  if (!profile) return null

  const age = calculateAgeFromBirthday(profile.birthday)

  return {
    ...profile,
    age,
    goals: onboardingState.goals ?? ['general_fitness'],
  }
}

export function getCurrentWorkoutPlan() {
  const profile = getResolvedProfile()
  if (!profile) return null

  return generateWorkoutPlan(profile)
}

export function loadWorkoutHistory(): WorkoutCompletion[] {
  if (!isClient()) return []

  try {
    const raw = window.localStorage.getItem(WORKOUT_KEY)
    return raw ? (JSON.parse(raw) as WorkoutCompletion[]) : []
  } catch {
    return []
  }
}

export function saveWorkoutCompletion(entry: WorkoutCompletion) {
  if (!isClient()) return

  const history = loadWorkoutHistory()
  window.localStorage.setItem(
    WORKOUT_KEY,
    JSON.stringify([entry, ...history].slice(0, 30)),
  )
}

export function getWorkoutStats() {
  const history = loadWorkoutHistory()
  const currentStreak = history.length > 0 ? Math.min(history.length, 7) : 0
  const totalWorkouts = history.length
  const totalVolume = history.reduce((sum, entry) => sum + entry.sets * 250, 0)

  return {
    currentStreak,
    totalWorkouts,
    totalVolume,
  }
}
