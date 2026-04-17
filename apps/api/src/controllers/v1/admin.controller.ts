import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { generateRepayments } from '../../services/credit.service'
import { sendSms } from '../../services/sms.service'

export async function getRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days ?? 30)
    const from = new Date(Date.now() - days * 86400000)

    const [insurance, marketplace, origination, totalUsers, activeLoans, activePolicies, repaymentPaid, repaymentTotal, marketVolume, totalLoans, recentTx] = await Promise.all([
      db.transaction.aggregate({ where: { type: 'INSURANCE_PREMIUM', createdAt: { gte: from } }, _sum: { amountKes: true }, _count: true }),
      db.transaction.aggregate({ where: { type: 'MARKET_COMMISSION', createdAt: { gte: from } }, _sum: { amountKes: true }, _count: true }),
      db.transaction.aggregate({ where: { type: 'ORIGINATION_FEE', createdAt: { gte: from } }, _sum: { amountKes: true }, _count: true }),
      db.user.count(),
      db.loan.count({ where: { status: { in: ['ACTIVE','PENDING','APPROVED'] } } }),
      db.insurancePolicy.count({ where: { status: 'ACTIVE' } }),
      db.repayment.count({ where: { status: 'PAID' } }),
      db.repayment.count({ where: { status: { in: ['PAID','LATE'] } } }),
      db.marketOrder.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: from } }, _sum: { totalAmountKes: true }, _count: true }),
      db.loan.aggregate({ _sum: { principalKes: true } }),
      db.transaction.groupBy({ by: ['createdAt'], where: { type: { in: ['ORIGINATION_FEE','INSURANCE_PREMIUM','MARKET_COMMISSION','LATE_FEE'] }, createdAt: { gte: from } }, _sum: { amountKes: true }, orderBy: { createdAt: 'asc' } }),
    ])

    const lateFeesData = await db.repayment.aggregate({ where: { status: 'LATE', paidAt: { gte: from } }, _sum: { lateFeeKes: true } })

    const loanInterest   = 0 // computed from actual repayments less principal
    const insuranceComm  = insurance._sum.amountKes ?? 0
    const marketComm     = marketplace._sum.amountKes ?? 0
    const origFees       = origination._sum.amountKes ?? 0
    const lateFeesTotal  = lateFeesData._sum.lateFeeKes ?? 0
    const total          = insuranceComm + marketComm + origFees + lateFeesTotal
    const repaymentRate  = repaymentTotal > 0 ? Math.round((repaymentPaid / repaymentTotal) * 100) : 100

    res.json({
      success: true,
      data: {
        period: { days, from },
        revenue: { loanInterest, insuranceCommission: insuranceComm, marketplaceCommission: marketComm, originationFees: origFees, lateFees: lateFeesTotal, total },
        platform: { totalUsers, activeLoans, activePolicies, repaymentRatePct: repaymentRate },
        volume: { totalLoansKes: totalLoans._sum.principalKes ?? 0, marketplaceKes: marketVolume._sum.totalAmountKes ?? 0, marketplaceOrders: marketVolume._count },
        trend: recentTx.map(t => ({ date: t.createdAt, revenueKes: t._sum.amountKes ?? 0 })),
      },
    })
  } catch (e) { next(e) }
}

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', role, search } = req.query as Record<string, string>
    const where: any = {}
    if (role)   where.role = role
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }]
    const [items, total] = await Promise.all([
      db.user.findMany({ where, skip: (Number(page)-1)*Number(pageSize), take: Number(pageSize), select: { id:true,name:true,phone:true,email:true,role:true,county:true,isVerified:true,subscription:true,createdAt:true }, orderBy: { createdAt: 'desc' } }),
      db.user.count({ where }),
    ])
    res.json({ success: true, data: { items, total, totalPages: Math.ceil(total/Number(pageSize)) } })
  } catch (e) { next(e) }
}

export async function getAllLoans(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page = '1' } = req.query as Record<string, string>
    const where: any = status ? { status } : {}
    const [items, total] = await Promise.all([
      db.loan.findMany({ where, skip: (Number(page)-1)*20, take: 20, include: { user: { select: { name:true,phone:true } }, repayments: { orderBy: { dueDate: 'asc' } }, vouchers: true }, orderBy: { createdAt: 'desc' } }),
      db.loan.count({ where }),
    ])
    res.json({ success: true, data: { items, total, totalPages: Math.ceil(total/20) } })
  } catch (e) { next(e) }
}

export async function approveLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await db.loan.findUniqueOrThrow({ where: { id: req.params.id } })
    if (loan.status !== 'PENDING') { res.status(422).json({ success:false, error:`Loan is ${loan.status}` }); return }

    const fee = loan.principalKes * (loan.originationFeePct / 100)
    const net = loan.principalKes - fee

    const voucher = await db.$transaction(async tx => {
      await tx.loan.update({ where: { id: loan.id }, data: { status: 'APPROVED', approvedAt: new Date() } })
      const v = await tx.voucher.create({
        data: { loanId: loan.id, userId: loan.userId, amountKes: net, dealerName: req.body.dealerName, dealerPhone: req.body.dealerPhone, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      })
      await tx.transaction.create({ data: { userId: loan.userId, loanId: loan.id, type: 'ORIGINATION_FEE', amountKes: fee, description: `${loan.originationFeePct}% origination fee` } })
      const schedules = generateRepayments(loan.id, loan.principalKes, loan.interestRatePct, loan.termMonths)
      await tx.repayment.createMany({ data: schedules })
      return v
    })

    const user = await db.user.findUnique({ where: { id: loan.userId }, select: { phone: true } })
    if (user?.phone) await sendSms(user.phone, `Shamba Finance: ✅ Loan of KES ${loan.principalKes.toLocaleString()} approved! Voucher: ${voucher.code}. Present at your agro-dealer. Valid 30 days.`)

    res.json({ success: true, data: { loan, voucher }, message: 'Loan approved' })
  } catch (e) { next(e) }
}

export async function getInsurancePolicies(req: Request, res: Response, next: NextFunction) {
  try {
    const policies = await db.insurancePolicy.findMany({ include: { user: { select: { name:true,phone:true } }, triggerLogs: { orderBy: { checkedAt: 'desc' }, take: 3 } }, orderBy: { createdAt: 'desc' }, take: 100 })
    res.json({ success: true, data: policies })
  } catch (e) { next(e) }
}

export async function verifyStakeholder(req: Request, res: Response, next: NextFunction) {
  try {
    const s = await db.stakeholder.update({ where: { id: req.params.id }, data: { verified: true } })
    res.json({ success: true, data: s })
  } catch (e) { next(e) }
}
