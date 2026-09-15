import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../lib/auth.js'
import { AppError } from '../lib/http.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing bearer token'))
  }

  try {
    const token = header.slice(7)
    const decoded = verifyAccessToken(token)
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role ?? 'user',
    }
    next()
  } catch {
    next(new AppError(401, 'Invalid token'))
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return next(new AppError(403, 'You do not have permission to access this area'))
    }
    next()
  }
}
