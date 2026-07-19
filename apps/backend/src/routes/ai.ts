import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { analyzeProgress, generateCoachReply, modifyWorkout, nutritionAdvice, recoveryAdvice } from '../services/aiCoachService.js'

export const aiRouter = Router()

aiRouter.use(requireAuth)

aiRouter.post('/chat', (req: AuthenticatedRequest, res) => {
  const prompt = z.string().min(1).parse(req.body?.prompt)
  res.json({
    reply: generateCoachReply(prompt),
    available: true,
  })
})

aiRouter.post('/workout-modifier', (req: AuthenticatedRequest, res) => {
  const constraint = z.string().min(1).parse(req.body?.constraint)
  res.json(modifyWorkout(constraint))
})

aiRouter.get('/progress-analysis', (_req, res) => {
  res.json(analyzeProgress())
})

aiRouter.get('/recovery', (_req, res) => {
  res.json(recoveryAdvice())
})

aiRouter.get('/nutrition', (_req, res) => {
  res.json(nutritionAdvice())
})
