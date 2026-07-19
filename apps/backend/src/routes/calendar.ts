import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { getCurrentWorkoutPlanForUser, getWorkoutSessions } from '../services/workoutDbService.js'

export const calendarRouter = Router()

calendarRouter.use(requireAuth)

calendarRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const [plan, sessions] = await Promise.all([
      getCurrentWorkoutPlanForUser(req.user!.id),
      getWorkoutSessions(req.user!.id),
    ])

    res.json({
      plan,
      sessions,
    })
  } catch (error) {
    next(error)
  }
})
