import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../middleware/auth'

export const signAccess  = (p: JwtPayload) => jwt.sign(p, process.env.JWT_ACCESS_SECRET!,  { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN  ?? '15m') as any })
export const signRefresh = (p: JwtPayload) => jwt.sign(p, process.env.JWT_REFRESH_SECRET!, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any })
export const verifyRefresh = (t: string) => jwt.verify(t, process.env.JWT_REFRESH_SECRET!) as JwtPayload
export const refreshExpiresAt = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
