import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string,
    public details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.details,
    })
  }
  // Prisma unique constraint
  if ((err as any).code === 'P2002') {
    return res.status(409).json({ success: false, error: 'A record with this value already exists', code: 'DUPLICATE' })
  }
  console.error('[Unhandled]', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
}
