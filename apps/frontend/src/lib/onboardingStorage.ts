export interface OnboardingProfileData {
  name: string
  birthday: string
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
}

export interface OnboardingState {
  profile?: OnboardingProfileData
  goals?: string[]
  completedAt?: string
}

const STORAGE_KEY = 'rie-chan-onboarding'

function isClient() {
  return typeof window !== 'undefined'
}

export function loadOnboardingState(): OnboardingState {
  if (!isClient()) return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as OnboardingState) : {}
  } catch {
    return {}
  }
}

export function saveOnboardingProfile(profile: OnboardingProfileData) {
  if (!isClient()) return

  const current = loadOnboardingState()
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      profile,
    }),
  )
}

export function saveOnboardingGoals(goals: string[]) {
  if (!isClient()) return

  const current = loadOnboardingState()
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      goals,
    }),
  )
}

export function markOnboardingCompleted() {
  if (!isClient()) return

  const current = loadOnboardingState()
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      completedAt: new Date().toISOString(),
    }),
  )
}

export function clearOnboardingState() {
  if (!isClient()) return
  window.localStorage.removeItem(STORAGE_KEY)
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
