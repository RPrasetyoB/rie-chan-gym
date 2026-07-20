import type { Request } from 'express'
import { createHmac } from 'node:crypto'
import { env } from '../config/env.js'
import { AppError } from '../lib/http.js'
import { prisma } from '../lib/prisma.js'

type QuotaRow = {
  count: number
}

function getUtcDayKey(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

function getRequestIp(req: Request) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    const value = forwardedFor[0]?.trim()
    if (value) return value
  }

  return req.ip || req.socket.remoteAddress || 'unknown'
}

function hashIp(ip: string) {
  return createHmac('sha256', env.JWT_SECRET).update(ip).digest('hex')
}

export async function consumeDailyChatSlot(req: Request) {
  const ipHash = hashIp(getRequestIp(req))
  const dateKey = getUtcDayKey()
  const limit = env.AI_CHAT_DAILY_LIMIT_PER_IP

  const rows = await prisma.$queryRaw<QuotaRow[]>`
    WITH updated AS (
      INSERT INTO "AiChatUsageByIp" ("ipHash", "dateKey", "count", "createdAt", "updatedAt")
      VALUES (${ipHash}, ${dateKey}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("ipHash", "dateKey")
      DO UPDATE SET
        "count" = "AiChatUsageByIp"."count" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "AiChatUsageByIp"."count" < ${limit}
      RETURNING "count"
    )
    SELECT "count" FROM updated
  `

  const count = rows[0]?.count
  if (!count) {
    throw new AppError(429, `Daily chat limit reached for today. Try again tomorrow. Limit: ${limit} chats per day.`)
  }

  return {
    remaining: limit - count,
    count,
  }
}
