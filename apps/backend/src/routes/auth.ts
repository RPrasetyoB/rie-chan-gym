import { Router } from 'express'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { hashPassword, signAccessToken, signRefreshToken, verifyAccessToken, verifyPassword, verifyRefreshToken } from '../lib/auth.js'
import { AppError } from '../lib/http.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js'

export const authRouter = Router()

function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function storeRefreshToken(userId: string, token: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt,
    },
  })
}

async function rotateRefreshToken(userId: string, oldToken: string, nextToken: string) {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      tokenHash: hashRefreshToken(oldToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  await storeRefreshToken(userId, nextToken)
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body)
    const passwordHash = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    const accessToken = signAccessToken({ sub: user.id, email: user.email, name: user.name })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email, name: user.name })
    await storeRefreshToken(user.id, refreshToken)

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      next(new AppError(409, 'Email already registered'))
      return
    }
    next(error)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    })
    if (!user) {
      throw new AppError(401, 'Invalid email or password')
    }

    const isValid = await verifyPassword(data.password, user.passwordHash)
    if (!isValid) {
      throw new AppError(401, 'Invalid email or password')
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, name: user.name })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email, name: user.name })
    await storeRefreshToken(user.id, refreshToken)

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = z.string().min(1).safeParse(req.body?.refreshToken)
    if (!token.success) {
      throw new AppError(401, 'Missing refresh token')
    }

    const decoded = verifyRefreshToken(token.data)
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        userId: decoded.sub,
        tokenHash: hashRefreshToken(token.data),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!storedToken) {
      throw new AppError(401, 'Invalid refresh token')
    }

    const accessToken = signAccessToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
    })
    const refreshToken = signRefreshToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
    })

    await rotateRefreshToken(storedToken.user.id, token.data, refreshToken)

    res.json({
      accessToken,
      refreshToken,
      user: storedToken.user,
    })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    next(new AppError(401, 'Missing token'))
    return
  }

  try {
    const decoded = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      throw new AppError(401, 'Unknown user')
    }

    res.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/forgot-password', (req, res) => {
  const email = z.string().email().safeParse(req.body?.email)
  if (!email.success) {
    throw new AppError(400, 'Invalid email address')
  }

  res.json({
    message: `Password reset instructions would be sent to ${email.data}.`,
  })
})

authRouter.post('/logout', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id },
    })

    res.json({ message: 'Logged out' })
  } catch (error) {
    next(error)
  }
})
