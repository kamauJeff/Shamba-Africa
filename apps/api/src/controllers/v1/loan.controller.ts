import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { computeCredit, getLoanRate, generateRepayments } from '../../services/credit.service'
import { sendSms } from '../../services/sms.service'
import { b2c, normalizeMpesaPhone } from '../../services/mpesa.service'

export async function apply(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { principalKes, termMonths, purpose, purposeDetails, dealerName, dealerPhone } = req.body

    const credit = await (async () => {
      const recent = await db.creditScore.findFirst({ where: { userId }, orderBy: { computedAt: 'desc' } })
      if (recent && Date.now() - recent.computedAt.getTime() < 24 * 60 * 60 * 1000) return recent
      return computeCredit(userId)
    })()

    if (!credit.eligible) throw new AppError(`Credit score ${credit.score} — minimum 500 required`, 422, 'NOT_ELIGIBLE')
    if (principalKes > credit.maxLoanKes) throw new AppError(`Amount exceeds your limit of KES ${credit.maxLoanKes.toLocaleString()}`, 422, 'EXCEEDS_LIMIT')

    const active = await db.loan.findFirst({ where: { userId, status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] } } })
    if (active) throw new AppError('You already have an active loan', 422, 'ACTIVE_LOAN_EXISTS')

    const interestRatePct = getLoanRate(credit.rating)
    const loan = await db.loan.create({
      data: { userId, principalKes, interestRatePct, termMonths, purpose, purposeDetails, creditScoreAtApp: credit.score, status: 'PENDING' },
    })

    const user = await db.user.findUnique({ where: { id: userId }, select: { phone: true, name: true } })
    await sendSms(user!.phone, `Shamba Finance: Loan application of KES ${principalKes.toLocaleString()} received. Ref: ${loan.id.slice(0, 8).toUpperCase()}. Review within 24h.`)

    res.status(201).json({ success: true, data: { loan, interestRatePct }, message: 'Application submitted successfully' })
  } catch (e) { next(e) }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await db.loan.findUniqueOrThrow({ where: { id: req.params.id } })
    if (loan.status !== 'PENDING') throw new AppError(`Loan is ${loan.status}`, 422)

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
    await sendSms(user!.phone, `Shamba Finance: ✅ Approved! KES ${loan.principalKes.toLocaleString()} loan. Voucher: ${voucher.code}. Present at agro-dealer. Expires in 30 days.`)

    res.json({ success: true, data: { loan, voucher }, message: 'Loan approved and voucher issued' })
  } catch (e) { next(e) }
}

export async function disburse(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await db.loan.findFirstOrThrow({ where: { id: req.params.id }, include: { vouchers: true } })
    if (loan.status !== 'APPROVED') throw new AppError('Loan must be APPROVED before disbursal', 422)

    const user = await db.user.findUniqueOrThrow({ where: { id: loan.userId }, select: { phone: true } })
    const mpesaPhone = normalizeMpesaPhone(user.phone)

    let b2cRef = 'VOUCHER_ONLY'
    if (req.body.disburseMpesa) {
      const result = await b2c(mpesaPhone, loan.principalKes, `LoanID:${loan.id}`)
      b2cRef = result.conversationId
    }

    await db.loan.update({ where: { id: loan.id }, data: { status: 'ACTIVE', disbursedAt: new Date(), mpesaDisbursementRef: b2cRef } })
    await sendSms(user.phone, `Shamba Finance: KES ${loan.principalKes.toLocaleString()} disbursed via voucher. Check your Shamba app for repayment schedule.`)

    res.json({ success: true, data: { b2cRef }, message: 'Loan disbursed' })
  } catch (e) { next(e) }
}

export async function repay(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { mpesaRef, amountKes } = req.body
    const loan = await db.loan.findFirstOrThrow({ where: { id: req.params.id, userId }, include: { repayments: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' } } } })
    if (!['ACTIVE', 'APPROVED'].includes(loan.status)) throw new AppError('Loan is not repayable', 422)
    const next_ = loan.repayments[0]
    if (!next_) throw new AppError('No pending repayments', 422)

    const isLate = new Date() > next_.dueDate
    const late   = isLate ? Math.round(next_.amountDueKes * 0.05) : 0

    await db.$transaction([
      db.repayment.update({ where: { id: next_.id }, data: { status: isLate ? 'LATE' : 'PAID', paidAt: new Date(), amountPaidKes: amountKes, lateFeeKes: late, mpesaRef } }),
      db.transaction.create({ data: { userId, loanId: loan.id, type: 'LOAN_REPAYMENT', amountKes, reference: mpesaRef, description: `Repayment — ${next_.dueDate.toLocaleDateString()}` } }),
      ...(loan.repayments.length === 1 ? [db.loan.update({ where: { id: loan.id }, data: { status: 'CLOSED', closedAt: new Date() } })] : []),
    ])

    res.json({ success: true, message: 'Repayment recorded', data: { isLate, lateFeeKes: late } })
  } catch (e) { next(e) }
}

export async function getLoans(req: Request, res: Response, next: NextFunction) {
  try {
    const loans = await db.loan.findMany({
      where: { userId: req.user!.userId },
      include: { repayments: { orderBy: { dueDate: 'asc' } }, vouchers: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: loans })
  } catch (e) { next(e) }
}

export async function getLoan(req: Request, res: Response, next: NextFunction) {
  try {
    const loan = await db.loan.findFirstOrThrow({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { repayments: { orderBy: { dueDate: 'asc' } }, vouchers: true, transactions: { orderBy: { createdAt: 'desc' } } },
    })
    res.json({ success: true, data: loan })
  } catch (e) { next(e) }
}
