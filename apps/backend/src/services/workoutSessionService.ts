import { sessions, type ProfileRecord, type WorkoutSessionRecord } from '../store/memory.js'
import { calculateAgeFromBirthday, generateWorkoutPlan, type ProfileInput } from './workoutPlanService.js'
import type { WorkoutSetLog } from '../types/domain.js'

export function getCurrentWorkoutPlanForProfile(profile: ProfileRecord) {
  const normalized: ProfileInput = {
    ...profile,
    age: calculateAgeFromBirthday(profile.birthday),
    goals: profile.goals.length > 0 ? profile.goals : ['general_fitness'],
  }

  return generateWorkoutPlan(normalized)
}

export function getWorkoutHistory(userId: string) {
  return sessions.filter((session) => session.userId === userId && session.status === 'completed')
}

export function saveWorkoutSession(partial: Partial<WorkoutSessionRecord> & Pick<WorkoutSessionRecord, 'id' | 'userId' | 'planName' | 'exercises' | 'sets'>) {
  const record: WorkoutSessionRecord = {
    ...partial,
    status: partial.completedAt ? 'completed' : partial.status ?? 'active',
    startedAt: partial.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: partial.logs ?? [],
  }

  sessions.unshift(record)
  return record
}

export function appendWorkoutSessionLog(userId: string, sessionId: string, log: WorkoutSetLog) {
  const session = sessions.find((item) => item.id === sessionId && item.userId === userId)
  if (!session) {
    return null
  }

  session.logs = [...(session.logs ?? []), log]
  session.updatedAt = new Date().toISOString()
  session.status = 'active'
  return session
}

export function completeWorkoutSession(
  userId: string,
  sessionId: string,
  payload: Pick<WorkoutSessionRecord, 'planName' | 'exercises' | 'sets'>,
) {
  const existing = sessions.find((item) => item.id === sessionId && item.userId === userId)
  if (existing) {
    existing.planName = payload.planName
    existing.exercises = payload.exercises
    existing.sets = payload.sets
    existing.status = 'completed'
    existing.completedAt = new Date().toISOString()
    existing.updatedAt = new Date().toISOString()
    return existing
  }

  return saveWorkoutSession({
    id: sessionId,
    userId,
    planName: payload.planName,
    exercises: payload.exercises,
    sets: payload.sets,
    status: 'completed',
    completedAt: new Date().toISOString(),
  })
}
