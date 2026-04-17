import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { REVENUE_CONFIG } from '@shamba/shared'

export async function createPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { cropType, county, region, coverageAmountKes, startDate, endDate, loanId } = req.body

    const premiumKes    = coverageAmountKes * (REVENUE_CONFIG.insurance.premiumRatePct / 100)
    const commissionKes = premiumKes * (REVENUE_CONFIG.insurance.commissionPct / 100)
    const policyRef     = `SHM-${Date.now().toString(36).toUpperCase()}`

    const policy = await db.insurancePolicy.create({
      data: { userId, loanId: loanId ?? null, cropType, county, region, coverageAmountKes, premiumKes, platformCommissionKes: commissionKes, startDate: new Date(startDate), endDate: new Date(endDate), policyRef },
    })

    await db.transaction.create({ data: { userId, policyId: policy.id, type: 'INSURANCE_PREMIUM', amountKes: commissionKes, description: `Insurance commission — ${policyRef}` } })

    res.status(201).json({ success: true, data: policy })
  } catch (e) { next(e) }
}

export async function getPolicies(req: Request, res: Response, next: NextFunction) {
  try {
    const policies = await db.insurancePolicy.findMany({
      where: { userId: req.user!.userId },
      include: { triggerLogs: { orderBy: { checkedAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: policies })
  } catch (e) { next(e) }
}

export async function getPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const policy = await db.insurancePolicy.findFirstOrThrow({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { triggerLogs: { orderBy: { checkedAt: 'desc' } } },
    })
    res.json({ success: true, data: policy })
  } catch (e) { next(e) }
}

export async function getThresholds(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      DROUGHT: { description: 'Rainfall < 2mm/day for 21+ consecutive days', payoutTrigger: '50% of coverage', affectedCrops: ['Maize','Beans','Wheat','Sorghum'] },
      FLOOD:   { description: 'Rainfall > 150mm in 24 hours',                payoutTrigger: '50% of coverage', affectedCrops: ['All crops'] },
      HEAT:    { description: 'Temperature > 38°C for 5+ consecutive days',  payoutTrigger: '50% of coverage', affectedCrops: ['Tomatoes','Coffee','Tea'] },
      FROST:   { description: 'Temperature < 2°C during growing season',     payoutTrigger: '50% of coverage', affectedCrops: ['Potatoes','Peas','Wheat'] },
      WIND:    { description: 'Wind speed > 25 m/s (sustained)',             payoutTrigger: '50% of coverage', affectedCrops: ['Bananas','Sugarcane','Maize'] },
    },
  })
}
