import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'

export async function getStakeholders(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, county, page = '1', pageSize = '20' } = req.query as Record<string, string>
    const where: any = {}
    if (type)   where.type   = type
    if (county) where.county = { contains: county, mode: 'insensitive' }
    const [items, total] = await Promise.all([
      db.stakeholder.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), include: { _count: { select: { reviews: true } } }, orderBy: [{ verified: 'desc' }, { rating: 'desc' }] }),
      db.stakeholder.count({ where }),
    ])
    res.json({ success: true, data: { items, total, totalPages: Math.ceil(total/Number(pageSize)) } })
  } catch (e) { next(e) }
}

export async function getStakeholder(req: Request, res: Response, next: NextFunction) {
  try {
    const s = await db.stakeholder.findUniqueOrThrow({ where: { id: req.params.id }, include: { reviews: { orderBy: { createdAt: 'desc' }, take: 10 } } })
    res.json({ success: true, data: s })
  } catch (e) { next(e) }
}

export async function createStakeholder(req: Request, res: Response, next: NextFunction) {
  try {
    const s = await db.stakeholder.create({ data: req.body })
    res.status(201).json({ success: true, data: s })
  } catch (e) { next(e) }
}

export async function reviewStakeholder(req: Request, res: Response, next: NextFunction) {
  try {
    const { rating, comment } = req.body
    if (rating < 1 || rating > 5) throw new AppError('Rating must be 1–5', 422)
    const review = await db.stakeholderReview.create({ data: { stakeholderId: req.params.id, userId: req.user!.userId, rating, comment } })
    // Recalculate average
    const { _avg, _count } = await db.stakeholderReview.aggregate({ where: { stakeholderId: req.params.id }, _avg: { rating: true }, _count: true })
    await db.stakeholder.update({ where: { id: req.params.id }, data: { rating: _avg.rating ?? 0, ratingCount: _count } })
    res.status(201).json({ success: true, data: review })
  } catch (e) { next(e) }
}
