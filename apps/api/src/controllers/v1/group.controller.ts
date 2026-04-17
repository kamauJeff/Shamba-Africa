import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'

export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const group = await db.farmerGroup.create({ data: req.body })
    await db.groupMember.create({ data: { groupId: group.id, userId, role: 'CHAIRPERSON' } })
    res.status(201).json({ success: true, data: group })
  } catch (e) { next(e) }
}

export async function getGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const { county, type } = req.query as Record<string, string>
    const where: any = {}
    if (county) where.county = { contains: county, mode: 'insensitive' }
    if (type)   where.type   = type
    const groups = await db.farmerGroup.findMany({ where, include: { _count: { select: { members: true } } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: groups })
  } catch (e) { next(e) }
}

export async function getGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const group = await db.farmerGroup.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { members: { include: { user: { select: { id: true, name: true, phone: true } } } }, contributions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    res.json({ success: true, data: group })
  } catch (e) { next(e) }
}

export async function joinGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await db.groupMember.findUnique({ where: { groupId_userId: { groupId: req.params.id, userId: req.user!.userId } } })
    if (existing) throw new AppError('Already a member', 409)
    await db.groupMember.create({ data: { groupId: req.params.id, userId: req.user!.userId } })
    res.json({ success: true, message: 'Joined group successfully' })
  } catch (e) { next(e) }
}

export async function contribute(req: Request, res: Response, next: NextFunction) {
  try {
    const { amountKes, mpesaRef, notes } = req.body
    const member = await db.groupMember.findFirst({ where: { groupId: req.params.id, userId: req.user!.userId, isActive: true } })
    if (!member) throw new AppError('Not a group member', 403)

    await db.$transaction([
      db.groupContribution.create({ data: { groupId: req.params.id, userId: req.user!.userId, amountKes, mpesaRef, notes } }),
      db.farmerGroup.update({ where: { id: req.params.id }, data: { totalSavingsKes: { increment: amountKes } } }),
      db.transaction.create({ data: { userId: req.user!.userId, type: 'GROUP_SAVING', amountKes, reference: mpesaRef, description: `Group contribution — ${req.params.id.slice(0, 8)}` } }),
    ])
    res.json({ success: true, message: 'Contribution recorded' })
  } catch (e) { next(e) }
}

export async function getMyGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const memberships = await db.groupMember.findMany({ where: { userId: req.user!.userId, isActive: true }, include: { group: { include: { _count: { select: { members: true } } } } } })
    res.json({ success: true, data: memberships })
  } catch (e) { next(e) }
}
