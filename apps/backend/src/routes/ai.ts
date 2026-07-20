import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { AppError } from '../lib/http.js'
import { consumeDailyChatSlot } from '../services/aiChatQuota.js'
import { analyzeProgress, generateCoachReply, modifyWorkout, nutritionAdvice, recoveryAdvice } from '../services/aiCoachService.js'

export const aiRouter = Router()

aiRouter.use(requireAuth)

const coachMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
})

const chatSchema = z.object({
  prompt: z.string().min(1),
  messages: z.array(coachMessageSchema).optional(),
})

aiRouter.post('/chat', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { prompt, messages } = chatSchema.parse(req.body)
    await consumeDailyChatSlot(req)
    const reply = await generateCoachReply(prompt, messages)
    res.json({
      reply,
      available: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(400, error.message))
    }

    if (error instanceof Error && error.message === 'Gemini API key is not configured') {
      return next(new AppError(503, error.message))
    }

    next(error)
  }
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
