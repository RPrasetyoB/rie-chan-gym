import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/http.js'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.name, message: error.message })
  }

  if (error instanceof Error) {
    console.error(error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    })
  }

  console.error(error)
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server.',
  })
}
