import type { NextFunction, Request, Response } from 'express'
import { ZodTypeAny } from 'zod'
import { AppError } from '../lib/http.js'

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new AppError(400, result.error.message))
    }

    req.body = result.data
    next()
  }
}
