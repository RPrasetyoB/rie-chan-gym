import { Router } from 'express'
import { exerciseCatalog } from '../data/exercises.js'
import { deriveBodyParts } from '../lib/exerciseTaxonomy.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const exercisesRouter = Router()

exercisesRouter.use(requireAuth)

exercisesRouter.get('/', (_req, res) => {
  res.json({
    exercises: exerciseCatalog.map((exercise) => ({
      ...exercise,
      bodyParts: deriveBodyParts(exercise),
    })),
    count: exerciseCatalog.length,
  })
})

exercisesRouter.get('/:id', (req, res) => {
  const exercise = exerciseCatalog.find((item) => item.id === req.params.id)
  if (!exercise) {
    return res.status(404).json({ error: 'Not Found', message: 'Exercise not found' })
  }

  res.json({
    exercise: {
      ...exercise,
      bodyParts: deriveBodyParts(exercise),
    },
  })
})
