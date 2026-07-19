import { prisma } from '../lib/prisma.js'
import type { WorkoutSetLog } from '../types/domain.js'
import { calculateAgeFromBirthday, generateWorkoutPlan, type ProfileInput } from './workoutPlanService.js'
import { getProfileForUser, type PersistedProfile } from './profileDbService.js'

export interface WorkoutSessionView {
  id: string
  planName: string
  exercises: number
  sets: number
  status: 'planned' | 'active' | 'completed' | 'skipped'
  startedAt?: string
  completedAt?: string
  updatedAt?: string
}

interface SessionMetadata {
  planName?: string
  exercises?: number
  sets?: number
}

function encodeMetadata(metadata: SessionMetadata) {
  return JSON.stringify(metadata)
}

function decodeMetadata(notes?: string | null): SessionMetadata {
  if (!notes) return {}

  try {
    const parsed = JSON.parse(notes) as SessionMetadata
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function serializeSession(session: {
  id: string
  status: 'planned' | 'active' | 'completed' | 'skipped'
  startedAt: Date
  endedAt: Date | null
  notes: string | null
  exercises: Array<{ id: string }>
  logs: Array<{ id: string }>
}): WorkoutSessionView {
  const metadata = decodeMetadata(session.notes)

  return {
    id: session.id,
    planName: metadata.planName ?? 'Workout',
    exercises: metadata.exercises ?? session.exercises.length,
    sets: metadata.sets ?? session.logs.length,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.endedAt?.toISOString(),
    updatedAt: session.endedAt?.toISOString() ?? session.startedAt.toISOString(),
  }
}

async function loadSession(sessionId: string, userId: string) {
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      exercises: { select: { id: true } },
      logs: { select: { id: true } },
    },
  })
}

export async function getCurrentWorkoutPlanForUser(userId: string) {
  const profile = await getProfileForUser(userId)
  if (!profile) {
    return null
  }

  const normalized: ProfileInput = {
    ...profile,
    age: calculateAgeFromBirthday(profile.birthday),
    bodyFat: profile.bodyFat ?? undefined,
    goalWeight: profile.goalWeight ?? undefined,
    injuries: profile.injuries ?? undefined,
    equipment: profile.equipment ?? undefined,
    goals: profile.goals.length > 0 ? profile.goals : ['general_fitness'],
  }

  return generateWorkoutPlan(normalized)
}

export async function getWorkoutHistory(userId: string) {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, status: 'completed' },
    orderBy: { startedAt: 'desc' },
    include: {
      exercises: { select: { id: true } },
      logs: { select: { id: true } },
    },
  })

  return sessions.map((session) => serializeSession(session))
}

export async function getWorkoutSessions(userId: string) {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    include: {
      exercises: { select: { id: true } },
      logs: { select: { id: true } },
    },
  })

  return sessions.map((session) => serializeSession(session))
}

export async function createWorkoutSession(
  userId: string,
  payload: { planName: string; exercises: number; sets: number; startedAt?: string },
) {
  const session = await prisma.workoutSession.create({
    data: {
      userId,
      status: 'active',
      startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
      notes: encodeMetadata({
        planName: payload.planName,
        exercises: payload.exercises,
        sets: payload.sets,
      }),
    },
    include: {
      exercises: { select: { id: true } },
      logs: { select: { id: true } },
    },
  })

  return serializeSession(session)
}

export async function appendWorkoutSessionLog(
  userId: string,
  sessionId: string,
  log: WorkoutSetLog,
) {
  const session = await loadSession(sessionId, userId)
  if (!session) {
    return null
  }

  let sessionExercise = await prisma.workoutSessionExercise.findFirst({
    where: {
      sessionId: session.id,
      exerciseId: log.exerciseId,
      order: log.exerciseIndex,
    },
  })

  if (!sessionExercise) {
    sessionExercise = await prisma.workoutSessionExercise.create({
      data: {
        sessionId: session.id,
        exerciseId: log.exerciseId,
        order: log.exerciseIndex,
      },
    })
  }

  await prisma.workoutLog.create({
    data: {
      sessionId: session.id,
      sessionExerciseId: sessionExercise.id,
      setNumber: log.setIndex + 1,
      reps: log.reps,
      weight: log.weight,
      completedAt: new Date(log.completedAt),
    },
  })

  const updated = await loadSession(sessionId, userId)
  return updated ? serializeSession(updated) : null
}

export async function completeWorkoutSession(
  userId: string,
  sessionId: string,
  payload: { planName: string; exercises: number; sets: number },
) {
  const existing = await loadSession(sessionId, userId)
  const notes = encodeMetadata({
    planName: payload.planName,
    exercises: payload.exercises,
    sets: payload.sets,
  })

  const session = existing
    ? await prisma.workoutSession.update({
        where: { id: existing.id },
        data: {
          status: 'completed',
          endedAt: new Date(),
          notes,
        },
        include: {
          exercises: { select: { id: true } },
          logs: { select: { id: true } },
        },
      })
    : await prisma.workoutSession.create({
        data: {
          id: sessionId,
          userId,
          status: 'completed',
          startedAt: new Date(),
          endedAt: new Date(),
          notes,
        },
        include: {
          exercises: { select: { id: true } },
          logs: { select: { id: true } },
        },
      })

  return serializeSession(session)
}

export async function getWorkoutSummary(userId: string) {
  const history = await getWorkoutHistory(userId)

  const logs = await prisma.workoutLog.findMany({
    where: {
      session: {
        userId,
        status: 'completed',
      },
    },
    select: {
      reps: true,
      weight: true,
    },
  })

  const totalVolume = logs.reduce((sum, log) => sum + log.reps * (log.weight ?? 0), 0)

  return {
    streak: history.length > 0 ? Math.min(history.length, 7) : 0,
    totalWorkouts: history.length,
    totalVolume,
  }
}
