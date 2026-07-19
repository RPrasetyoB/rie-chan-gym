import { Router } from 'express'
import { aiRouter } from './ai.js'
import { authRouter } from './auth.js'
import { calendarRouter } from './calendar.js'
import { exercisesRouter } from './exercises.js'
import { healthRouter } from './health.js'
import { progressRouter } from './progress.js'
import { profileRouter } from './profile.js'
import { workoutsRouter } from './workouts.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/profile', profileRouter)
apiRouter.use('/exercises', exercisesRouter)
apiRouter.use('/workouts', workoutsRouter)
apiRouter.use('/progress', progressRouter)
apiRouter.use('/calendar', calendarRouter)
apiRouter.use('/ai', aiRouter)
