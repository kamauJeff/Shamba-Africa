import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { AppError } from './error'

export interface JwtPayload { userId: string; role: string }

declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.slice(7)
  if (!token) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401, 'TOKEN_INVALID'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    if (!roles.includes(req.user.role)) return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
    next()
  }
}

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const details: Record<string, string[]> = {}
      result.error.errors.forEach(e => {
        const key = e.path.join('.') || 'root'
        details[key] = [...(details[key] ?? []), e.message]
      })
      return next(new AppError('Validation failed', 422, 'VALIDATION_ERROR', details))
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) return next(new AppError('Invalid query parameters', 422, 'VALIDATION_ERROR'))
    req.query = result.data as any
    next()
  }
}
