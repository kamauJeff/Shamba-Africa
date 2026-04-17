import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { b2c, normalizeMpesaPhone } from '../../services/mpesa.service'

export async function getWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const [wallet, txs] = await Promise.all([
      db.wallet.findUnique({ where: { userId } }),
      db.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    ])
    const incoming = txs.filter(t => ['INSURANCE_PAYOUT','MARKET_SALE','WALLET_TOPUP','REFERRAL_BONUS'].includes(t.type)).reduce((s, t) => s + t.amountKes, 0)
    const outgoing = txs.filter(t => ['LOAN_REPAYMENT','INSURANCE_PREMIUM','WALLET_WITHDRAWAL','ORIGINATION_FEE'].includes(t.type)).reduce((s, t) => s + t.amountKes, 0)
    res.json({ success: true, data: { wallet: wallet ?? { balanceKes: 0, escrowKes: 0, totalEarnedKes: 0 }, transactions: txs, summary: { incoming, outgoing, net: incoming - outgoing } } })
  } catch (e) { next(e) }
}

export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { amountKes } = req.body
    const wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balanceKes < amountKes) throw new AppError(`Insufficient balance. Available: KES ${wallet?.balanceKes?.toLocaleString() ?? 0}`, 422)

    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { phone: true } })
    const result = await b2c(normalizeMpesaPhone(user.phone), amountKes, 'Shamba Wallet Withdrawal')

    await db.$transaction([
      db.wallet.update({ where: { userId }, data: { balanceKes: { decrement: amountKes }, totalPaidKes: { increment: amountKes } } }),
      db.transaction.create({ data: { userId, type: 'WALLET_WITHDRAWAL', amountKes, reference: result.conversationId, description: `M-Pesa withdrawal to ${user.phone}` } }),
    ])
    res.json({ success: true, message: `KES ${amountKes.toLocaleString()} sent to ${user.phone}` })
  } catch (e) { next(e) }
}
