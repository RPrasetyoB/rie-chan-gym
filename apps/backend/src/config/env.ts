import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().default('dev-jwt-secret'),
  REFRESH_TOKEN_SECRET: z.string().default('dev-refresh-secret'),
  AI_PROVIDER_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  AI_PROVIDER_MODEL: z.string().default('gemini-2.5-flash'),
  AI_PROMPT_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  AI_CHAT_DAILY_LIMIT_PER_IP: z.coerce.number().int().positive().default(10),
})

export const env = envSchema.parse(process.env)
