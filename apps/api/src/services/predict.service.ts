import { BASELINE_YIELDS, PRICE_ESTIMATES, getCurrentSeason } from '@shamba/shared'
import type { YieldPredictionInput } from '@shamba/shared'

const SOIL_MULT: Record<string, number> = { LOAM: 1.0, CLAY_LOAM: 0.95, SANDY_LOAM: 0.88, SILT: 0.92, CLAY: 0.82, SANDY: 0.72, PEAT: 0.90, CHALK: 0.78 }
const SEASON_MULT: Record<string, number> = { LONG_RAINS: 1.0, SHORT_RAINS: 0.85, DRY: 0.55 }
const OPTIMAL_RAIN: Record<string, [number, number]> = {
  Maize: [400, 800], Wheat: [300, 600], Rice: [800, 1500],
  Potatoes: [500, 900], Tomatoes: [400, 700], Beans: [300, 600],
  Coffee: [1200, 2000], Tea: [1500, 2500], DEFAULT: [300, 800],
}

function rainMult(crop: string, mm: number, irrigated: boolean): number {
  const [min, max] = OPTIMAL_RAIN[crop] ?? OPTIMAL_RAIN.DEFAULT
  if (irrigated) return Math.max(0.92, mm < min * 0.5 ? 0.80 : 1.0)
  if (mm < min * 0.5) return 0.48
  if (mm < min)       return 0.75
  if (mm <= max)      return 1.0
  if (mm <= max * 1.5) return 0.87
  return 0.70
}

function tempMult(t: number): number {
  if (t < 10) return 0.58; if (t < 15) return 0.82; if (t <= 28) return 1.0
  if (t <= 33) return 0.90; return 0.72
}

export function predictYield(input: YieldPredictionInput) {
  const base  = BASELINE_YIELDS[input.crop] ?? 800
  const yield_pa = base * (SOIL_MULT[input.soilType] ?? 0.85)
    * (SEASON_MULT[input.season] ?? 0.85)
    * rainMult(input.crop, input.rainfallMm, input.irrigated)
    * tempMult(input.tempAvgC)
    * (input.fertilizerUsed ? 1.28 : 1.0)

  const totalYield = yield_pa * input.areaAcres
  const price      = PRICE_ESTIMATES[input.crop] ?? 60
  const revenue    = totalYield * price

  let confidence = 80
  if (input.rainfallMm < 200 && !input.irrigated) confidence -= 14
  if (input.tempAvgC > 34) confidence -= 10
  if (input.season === 'DRY' && !input.irrigated) confidence -= 12
  if (!BASELINE_YIELDS[input.crop]) confidence -= 8
  confidence = Math.max(42, Math.min(94, confidence))

  const recommendations: string[] = []
  const riskFactors: string[] = []

  if (!input.fertilizerUsed) recommendations.push('Apply balanced NPK fertilizer — can boost yield by up to 28%.')
  if (!input.irrigated && input.season === 'DRY') recommendations.push('Install drip irrigation — critical during dry season for yield protection.')
  if (input.soilType === 'SANDY') recommendations.push('Add organic matter (compost/manure) to improve water and nutrient retention.')
  if (input.soilType === 'CLAY') recommendations.push('Improve field drainage to prevent waterlogging and root disease.')
  if (input.tempAvgC > 30) recommendations.push('Use shade netting and mulching to manage heat stress during critical growth stages.')
  if (recommendations.length === 0) recommendations.push('Conditions are favourable. Maintain regular crop scouting and pest monitoring.')

  if (input.season === 'DRY' && !input.irrigated) riskFactors.push('High drought risk — no irrigation during dry season.')
  if (input.rainfallMm > 1200) riskFactors.push('Excess rainfall risk — waterlogging and fungal disease likely.')
  if (input.tempAvgC > 33) riskFactors.push('Heat stress risk during flowering and pod-filling stages.')
  if (input.soilType === 'SANDY') riskFactors.push('Sandy soil has low nutrient and water retention — leaching risk.')
  if (riskFactors.length === 0) riskFactors.push('No major risk factors under current input conditions.')

  // Harvest window estimate
  const seasonMap: Record<string, string> = { LONG_RAINS: 'July–August', SHORT_RAINS: 'January–February', DRY: 'Depends on irrigation schedule' }
  const optimalHarvestWindow = seasonMap[input.season] ?? 'Consult county extension officer'

  return {
    cropName: input.crop,
    predictedYieldKg:      Math.round(totalYield),
    predictedYieldPerAcre: Math.round(yield_pa),
    confidencePct:         confidence,
    estimatedRevenueKes:   Math.round(revenue),
    recommendations,
    riskFactors,
    optimalHarvestWindow,
  }
}
