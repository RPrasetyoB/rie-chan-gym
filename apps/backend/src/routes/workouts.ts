import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import {
  appendWorkoutSessionLog,
  completeWorkoutSession,
  createWorkoutSession,
  getCurrentWorkoutPlanForUser,
  getWorkoutHistory,
} from '../services/workoutDbService.js'

export const workoutsRouter = Router()

workoutsRouter.use(requireAuth)

workoutsRouter.get('/plan/current', async (req: AuthenticatedRequest, res, next) => {
  try {
    const plan = await getCurrentWorkoutPlanForUser(req.user!.id)
    res.json({ plan })
  } catch (error) {
    next(error)
  }
})

workoutsRouter.get('/history', async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessions = await getWorkoutHistory(req.user!.id)
    res.json({ sessions })
  } catch (error) {
    next(error)
  }
})

workoutsRouter.post('/sessions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const session = await createWorkoutSession(req.user!.id, {
      planName: req.body?.planName ?? 'Manual Workout',
      exercises: Number(req.body?.exercises ?? 0),
      sets: Number(req.body?.sets ?? 0),
      startedAt: req.body?.startedAt ?? new Date().toISOString(),
    })

    res.status(201).json({ session: { id: session.id } })
  } catch (error) {
    next(error)
  }
})

workoutsRouter.post('/sessions/:id/logs', async (req: AuthenticatedRequest, res, next) => {
  try {
    const exerciseId = String(req.body?.exerciseId ?? '').trim()
    if (!exerciseId) {
      return res.status(400).json({ error: 'Bad Request', message: 'exerciseId is required' })
    }

    const session = await appendWorkoutSessionLog(req.user!.id, String(req.params.id), {
      exerciseId,
      exerciseName: String(req.body?.exerciseName ?? 'Exercise'),
      setIndex: Number(req.body?.setIndex ?? 0),
      exerciseIndex: Number(req.body?.exerciseIndex ?? 0),
      reps: Number(req.body?.reps ?? 0),
      weight: Number(req.body?.weight ?? 0),
      restSeconds: Number(req.body?.restSeconds ?? 0),
      completedAt: String(req.body?.completedAt ?? new Date().toISOString()),
    })

    if (!session) {
      return res.status(404).json({ error: 'Not Found', message: 'Workout session not found' })
    }

    res.json({ session })
  } catch (error) {
    next(error)
  }
})

workoutsRouter.post('/sessions/:id/complete', async (req: AuthenticatedRequest, res, next) => {
  try {
    const session = await completeWorkoutSession(req.user!.id, String(req.params.id), {
      planName: req.body?.planName ?? 'Workout',
      exercises: Number(req.body?.exercises ?? 0),
      sets: Number(req.body?.sets ?? 0),
    })

    res.json({ session })
  } catch (error) {
    next(error)
  }
})
