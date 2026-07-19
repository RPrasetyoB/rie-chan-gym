import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { AppError } from '../lib/http.js'
import { getProfileForUser, upsertProfileForUser } from '../services/profileDbService.js'

export const profileRouter = Router()

const profileSchema = z.object({
  birthday: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(100),
  weight: z.number().min(30),
  bodyFat: z.number().min(0).max(100).optional(),
  goalWeight: z.number().min(30).max(300).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  injuries: z.string().optional(),
  equipment: z.string().optional(),
  workoutDays: z.number().min(1).max(7),
  sessionDuration: z.number().min(15).max(180),
  goals: z.array(z.string()).default([]),
})

profileRouter.use(requireAuth)

profileRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const profile = await getProfileForUser(req.user!.id)
    if (!profile) {
      return res.json({ profile: null })
    }

    res.json({ profile })
  } catch (error) {
    next(error)
  }
})

profileRouter.put('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = profileSchema.parse(req.body)
    await upsertProfileForUser(req.user!.id, data)
    const profile = await getProfileForUser(req.user!.id)
    res.json({ profile })
  } catch (error) {
    next(new AppError(400, error instanceof Error ? error.message : 'Invalid profile'))
  }
})
