import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { goalCatalog } from '../data/goals.js'

export interface PersistedProfile {
  name?: string
  birthday: string
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  bodyFat?: number | null
  goalWeight?: number | null
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  injuries?: string | null
  equipment?: string | null
  workoutDays: number
  sessionDuration: number
  goals: string[]
}

export interface ProfileUpsertInput {
  birthday: string
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  bodyFat?: number | null
  goalWeight?: number | null
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  injuries?: string | null
  equipment?: string | string[] | null
  workoutDays: number
  sessionDuration: number
  goals: string[]
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function serializeEquipment(equipment?: string | string[] | null) {
  if (!equipment) return null
  if (Array.isArray(equipment)) {
    const cleaned = Array.from(
      new Set(
        equipment
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0),
      ),
    )
    return cleaned.length > 0 ? cleaned.join(', ') : null
  }

  const cleaned = equipment
    .split(/[,;|\n]/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  return cleaned.length > 0 ? Array.from(new Set(cleaned)).join(', ') : null
}

async function ensureGoal(tx: Prisma.TransactionClient, goalKey: string) {
  const seededGoal = goalCatalog.find((goal) => goal.key === goalKey)
  return tx.goal.upsert({
    where: { key: goalKey },
    update: {
      title: seededGoal?.title ?? goalKey.replace(/_/g, ' '),
      description: seededGoal?.title ?? goalKey.replace(/_/g, ' '),
    },
    create: {
      key: goalKey,
      title: seededGoal?.title ?? goalKey.replace(/_/g, ' '),
      description: seededGoal?.title ?? goalKey.replace(/_/g, ' '),
    },
  })
}

export async function getProfileForUser(userId: string): Promise<PersistedProfile | null> {
  const [profile, user, goals] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.userGoal.findMany({
      where: { userId },
      include: { goal: { select: { key: true } } },
      orderBy: { goalId: 'asc' },
    }),
  ])

  if (!profile) {
    return null
  }

  return {
    name: user?.name,
    birthday: formatDate(profile.birthday),
    gender: profile.gender,
    height: profile.height,
    weight: profile.weight,
    bodyFat: profile.bodyFat,
    goalWeight: profile.goalWeight,
    activityLevel: profile.activityLevel,
    experienceLevel: profile.experienceLevel,
    injuries: profile.injuries,
    equipment: profile.equipment,
    workoutDays: profile.workoutDays,
    sessionDuration: profile.sessionDuration,
    goals: goals.map((entry) => entry.goal.key),
  }
}

export async function upsertProfileForUser(userId: string, input: ProfileUpsertInput) {
  const goals = Array.from(new Set(input.goals.length > 0 ? input.goals : ['general_fitness']))

  const profile = await prisma.$transaction(async (tx) => {
    const savedProfile = await tx.profile.upsert({
      where: { userId },
      update: {
        birthday: new Date(input.birthday),
        gender: input.gender,
        height: input.height,
        weight: input.weight,
        bodyFat: input.bodyFat ?? null,
        goalWeight: input.goalWeight ?? null,
        activityLevel: input.activityLevel,
        experienceLevel: input.experienceLevel,
        injuries: input.injuries ?? null,
        equipment: serializeEquipment(input.equipment),
        workoutDays: input.workoutDays,
        sessionDuration: input.sessionDuration,
      },
      create: {
        userId,
        birthday: new Date(input.birthday),
        gender: input.gender,
        height: input.height,
        weight: input.weight,
        bodyFat: input.bodyFat ?? null,
        goalWeight: input.goalWeight ?? null,
        activityLevel: input.activityLevel,
        experienceLevel: input.experienceLevel,
        injuries: input.injuries ?? null,
        equipment: serializeEquipment(input.equipment),
        workoutDays: input.workoutDays,
        sessionDuration: input.sessionDuration,
      },
    })

    await tx.userGoal.deleteMany({ where: { userId } })

    for (const goalKey of goals) {
      const goal = await ensureGoal(tx, goalKey)
      await tx.userGoal.create({
        data: {
          userId,
          goalId: goal.id,
        },
      })
    }

    return savedProfile
  })

  return {
    birthday: formatDate(profile.birthday),
    gender: profile.gender,
    height: profile.height,
    weight: profile.weight,
    bodyFat: profile.bodyFat,
    goalWeight: profile.goalWeight,
    activityLevel: profile.activityLevel,
    experienceLevel: profile.experienceLevel,
    injuries: profile.injuries,
    equipment: profile.equipment,
    workoutDays: profile.workoutDays,
    sessionDuration: profile.sessionDuration,
    goals,
  } satisfies PersistedProfile
}
