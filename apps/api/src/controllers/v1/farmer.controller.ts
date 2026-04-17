import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { computeCredit } from '../../services/credit.service'

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const [profile, score] = await Promise.all([
      db.farmerProfile.findUnique({ where: { userId: req.user!.userId } }),
      db.creditScore.findFirst({ where: { userId: req.user!.userId }, orderBy: { computedAt: 'desc' } }),
    ])
    res.json({ success: true, data: { profile, creditScore: score } })
  } catch (e) { next(e) }
}

export async function upsertProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const data = req.body
    const fields = [data.farmSizeAcres, data.primaryCrop, data.county, data.subCounty, data.yearsFarming, data.nationalId, data.soilType, data.kraPin]
    const completenessScore = (fields.filter(Boolean).length / fields.length) * 100

    const profile = await db.farmerProfile.upsert({
      where: { userId },
      create: { userId, ...data, completenessScore },
      update: { ...data, completenessScore, updatedAt: new Date() },
    })
    res.json({ success: true, data: profile })
  } catch (e) { next(e) }
}

export async function getCreditScore(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const recent = await db.creditScore.findFirst({
      where: { userId, computedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { computedAt: 'desc' },
    })
    if (recent) return res.json({ success: true, data: recent, meta: { fresh: false } })
    const result = await computeCredit(userId)
    res.json({ success: true, data: result, meta: { fresh: true } })
  } catch (e) { next(e) }
}

export async function refreshCredit(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await computeCredit(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (e) { next(e) }
}

export async function getCreditHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await db.creditScore.findMany({ where: { userId: req.user!.userId }, orderBy: { computedAt: 'desc' }, take: 12, select: { score: true, rating: true, computedAt: true } })
    res.json({ success: true, data: history })
  } catch (e) { next(e) }
}

export async function getYieldHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await db.yieldPrediction.findMany({ where: { userId: req.user!.userId }, orderBy: { predictedAt: 'desc' }, take: 20 })
    res.json({ success: true, data })
  } catch (e) { next(e) }
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const [profile, loans, policies, orders, wallet, creditScore] = await Promise.all([
      db.farmerProfile.findUnique({ where: { userId } }),
      db.loan.findMany({ where: { userId }, select: { status: true, principalKes: true } }),
      db.insurancePolicy.findMany({ where: { userId }, select: { status: true, coverageAmountKes: true } }),
      db.marketOrder.findMany({ where: { sellerId: userId, status: 'COMPLETED' }, select: { totalAmountKes: true } }),
      db.wallet.findUnique({ where: { userId } }),
      db.creditScore.findFirst({ where: { userId }, orderBy: { computedAt: 'desc' } }),
    ])
    res.json({
      success: true,
      data: {
        profile,
        creditScore,
        wallet: wallet ?? { balanceKes: 0, escrowKes: 0 },
        loans: { total: loans.length, active: loans.filter(l => l.status === 'ACTIVE').length, totalBorrowed: loans.reduce((s, l) => s + l.principalKes, 0) },
        insurance: { active: policies.filter(p => p.status === 'ACTIVE').length, totalCoverage: policies.reduce((s, p) => s + p.coverageAmountKes, 0) },
        marketplace: { completedSales: orders.length, totalRevenue: orders.reduce((s, o) => s + o.totalAmountKes, 0) },
      },
    })
  } catch (e) { next(e) }
}
