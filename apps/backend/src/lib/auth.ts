import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'

export interface TokenPayload {
  sub: string
  email: string
  name: string
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' })
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}
