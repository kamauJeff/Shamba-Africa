import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { predictYield } from '../../services/predict.service'
import { getCurrentSeason } from '@shamba/shared'

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const result = predictYield(req.body)
    // Persist
    await db.yieldPrediction.create({
      data: { userId: req.user!.userId, crop: req.body.crop, season: req.body.season ?? getCurrentSeason(), soilType: req.body.soilType, areaAcres: req.body.areaAcres, rainfallMm: req.body.rainfallMm, tempAvgC: req.body.tempAvgC, fertilizerUsed: req.body.fertilizerUsed, irrigated: req.body.irrigated, predictedYieldKg: result.predictedYieldKg, predictedYieldPerAcre: result.predictedYieldPerAcre, confidencePct: result.confidencePct, estimatedRevenueKes: result.estimatedRevenueKes, recommendations: result.recommendations, riskFactors: result.riskFactors },
    })
    res.json({ success: true, data: result })
  } catch (e) { next(e) }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await db.yieldPrediction.findMany({ where: { userId: req.user!.userId }, orderBy: { predictedAt: 'desc' }, take: 20 })
    res.json({ success: true, data: history })
  } catch (e) { next(e) }
}
