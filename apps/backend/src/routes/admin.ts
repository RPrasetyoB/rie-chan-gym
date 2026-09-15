import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { AppError } from '../lib/http.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireRole('admin'))

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        profile: { select: { experienceLevel: true, goalWeight: true } },
        _count: { select: { workoutSessions: true, progress: true } },
      },
    })
    res.json({ users })
  } catch (error) { next(error) }
})

adminRouter.patch('/users/:id/role', async (req: AuthenticatedRequest, res, next) => {
  try {
    const role = z.enum(['admin', 'user', 'client']).parse(req.body?.role)
    const userId = String(req.params.id)
    if (userId === req.user!.id) throw new AppError(400, 'You cannot change your own role')
    const user = await prisma.user.update({ where: { id: userId }, data: { role }, select: { id: true, role: true } })
    res.json({ user })
  } catch (error) { next(error) }
})

adminRouter.delete('/users/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = String(req.params.id)
    if (userId === req.user!.id) throw new AppError(400, 'You cannot delete your own admin account')
    const deleteAllData = z.boolean().optional().default(true).parse(req.body?.deleteAllData)
    if (deleteAllData) {
      await prisma.user.delete({ where: { id: userId } })
    } else {
      await prisma.$transaction([
        prisma.profile.deleteMany({ where: { userId } }),
        prisma.userGoal.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.aiUsage.deleteMany({ where: { userId } }),
        prisma.refreshToken.deleteMany({ where: { userId } }),
        prisma.meal.deleteMany({ where: { userId } }),
        prisma.user.update({ where: { id: userId }, data: { name: 'Deleted user', email: `deleted-${userId}@deleted.invalid`, passwordHash: 'account-disabled', role: 'user' } }),
      ])
    }
    res.json({ message: deleteAllData ? 'User and all data deleted' : 'User access removed; fitness history retained' })
  } catch (error) { next(error) }
})
