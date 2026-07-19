import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { getWorkoutHistory, getWorkoutSummary } from '../services/workoutDbService.js'

export const progressRouter = Router()

progressRouter.use(requireAuth)

progressRouter.get('/summary', async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      summary: await getWorkoutSummary(req.user!.id),
    })
  } catch (error) {
    next(error)
  }
})

progressRouter.get('/history', async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({ sessions: await getWorkoutHistory(req.user!.id) })
  } catch (error) {
    next(error)
  }
})
