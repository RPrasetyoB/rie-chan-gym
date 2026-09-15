import { Router } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'
import { prisma } from '../lib/prisma.js'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

notificationsRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 })
    const unreadCount = notifications.filter((notification) => !notification.readAt).length
    res.json({ notifications, unreadCount })
  } catch (error) { next(error) }
})

notificationsRouter.patch('/:id/read', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: req.user!.id }, data: { readAt: new Date() } })
    if (result.count === 0) return res.status(404).json({ message: 'Notification not found' })
    res.json({ message: 'Notification marked as read' })
  } catch (error) { next(error) }
})

notificationsRouter.post('/read-all', async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, readAt: null }, data: { readAt: new Date() } })
    res.json({ message: 'All notifications marked as read' })
  } catch (error) { next(error) }
})
