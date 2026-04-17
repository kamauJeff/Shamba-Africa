import { db } from '../config/db'
import { CREDIT_TIERS } from '@shamba/shared'

export async function computeCredit(userId: string) {
  const [profile, loans, orders] = await Promise.all([
    db.farmerProfile.findUnique({ where: { userId } }),
    db.loan.findMany({ where: { userId }, include: { repayments: true } }),
    db.marketOrder.findMany({ where: { sellerId: userId, status: 'COMPLETED' } }),
  ])

  // 1. Repayment history (40%)
  const allRepayments = loans.flatMap(l => l.repayments)
  let repaymentRaw = 40
  if (allRepayments.length > 0) {
    const paid   = allRepayments.filter(r => r.status === 'PAID').length
    const late   = allRepayments.filter(r => r.status === 'LATE').length
    const defaulted = loans.filter(l => l.status === 'DEFAULTED').length
    repaymentRaw = Math.max(0, Math.round((paid / allRepayments.length) * 100) - late * 5 - defaulted * 25)
  }
  const repaymentScore = Math.round(repaymentRaw * 0.40 * 5.5)

  // 2. Yield consistency (20%)
  const yieldRaw = !profile?.previousYieldKg ? 5
    : profile.previousYieldKg > 2000 ? 10 : profile.previousYieldKg > 500 ? 7 : 4
  const yieldScore = Math.round(yieldRaw * 0.20 * 11)

  // 3. Profile completeness (15%)
  const fields = [profile?.farmSizeAcres, profile?.primaryCrop, profile?.county,
    profile?.yearsFarming, profile?.nationalId, profile?.soilType, profile?.kraPin]
  const pctComplete = fields.filter(Boolean).length / fields.length
  const completenessScore = Math.round(pctComplete * 0.15 * 550)

  // 4. Loan usage (15%)
  const closed = loans.filter(l => l.status === 'CLOSED').length
  const loanUsageScore = Math.min(Math.round(0.15 * 550), Math.round(closed * 12))

  // 5. Market activity (10%)
  const marketScore = Math.min(Math.round(0.10 * 550), Math.round(orders.length * 8))

  const total = 300 + repaymentScore + yieldScore + completenessScore + loanUsageScore + marketScore
  const score = Math.min(850, Math.max(300, total))

  const tier = CREDIT_TIERS.find(t => score >= t.min && score <= t.max) ?? CREDIT_TIERS[0]

  const result = await db.creditScore.create({
    data: {
      userId,
      score,
      rating: tier.rating as any,
      eligible: score >= 500,
      maxLoanKes: tier.maxLoanKes,
      repaymentScore,
      yieldScore,
      completenessScore,
      loanUsageScore,
      marketActivityScore: marketScore,
    },
  })

  return {
    ...result,
    breakdown: {
      repaymentHistory:    { score: repaymentScore,    max: Math.round(0.40 * 550), detail: allRepayments.length ? `${allRepayments.filter(r => r.status === 'PAID').length}/${allRepayments.length} on time` : 'No history' },
      yieldConsistency:    { score: yieldScore,         max: Math.round(0.20 * 550), detail: profile?.previousYieldKg ? `${profile.previousYieldKg} kg last season` : 'No yield data' },
      profileCompleteness: { score: completenessScore,  max: Math.round(0.15 * 550), detail: `${Math.round(pctComplete * 100)}% complete` },
      loanUsage:           { score: loanUsageScore,     max: Math.round(0.15 * 550), detail: `${closed} loan(s) repaid` },
      marketActivity:      { score: marketScore,        max: Math.round(0.10 * 550), detail: `${orders.length} completed sale(s)` },
    },
  }
}

export function getLoanRate(rating: string): number {
  const rates: Record<string, number> = { POOR: 0, FAIR: 18, GOOD: 15, VERY_GOOD: 13, EXCELLENT: 11 }
  return rates[rating] ?? 15
}

export function generateRepayments(loanId: string, principal: number, annualRate: number, months: number, start = new Date()) {
  const mr = annualRate / 100 / 12
  const emi = mr === 0 ? principal / months
    : (principal * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1)
  return Array.from({ length: months }, (_, i) => {
    const due = new Date(start)
    due.setMonth(due.getMonth() + i + 1)
    return { loanId, dueDate: due, amountDueKes: Math.round(emi * 100) / 100 }
  })
}
