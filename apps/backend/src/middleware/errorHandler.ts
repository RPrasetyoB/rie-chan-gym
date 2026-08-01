import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { AppError } from '../lib/http.js'

function isDatabaseConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  if (!(error instanceof Error)) return false

  const message = `${error.name}: ${error.message}`.toLowerCase()
  return [
    'enotfound',
    'econnrefused',
    'etimedout',
    'database connection',
    "can't reach database server",
    'could not connect to the database',
    'tenant/user postgres',
    'postgresql://',
  ].some((pattern) => message.includes(pattern))
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isDatabaseConnectionError(error)) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database is not connected right now. Please try again in a moment.',
    })
  }

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
