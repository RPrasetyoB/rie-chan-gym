import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', env.NODE_ENV === 'production')

  app.use(helmet())
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? true : env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

  app.get('/', (_req, res) => {
    res.json({
      name: 'Rie-chan Gym API',
      version: '1.0.0',
      health: '/api/v1/health',
    })
  })

  app.use('/api/v1', apiRouter)
  app.use(notFound)
  app.use(errorHandler)

  return app
}
