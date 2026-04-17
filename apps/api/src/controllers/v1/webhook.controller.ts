import { Request, Response } from 'express'
import { db } from '../../config/db'
import { sendSms } from '../../services/sms.service'

const ack = (res: Response) => res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

export async function mpesaStk(req: Request, res: Response) {
  try {
    const cb  = req.body?.Body?.stkCallback
    if (!cb || cb.ResultCode !== 0) return ack(res)
    const items   = cb.CallbackMetadata?.Item ?? []
    const get     = (n: string) => items.find((i: any) => i.Name === n)?.Value
    const ref     = get('MpesaReceiptNumber')
    const amount  = Number(get('Amount'))
    const checkId = cb.CheckoutRequestID

    const repayment = await db.repayment.findFirst({ where: { mpesaRef: checkId, status: 'PENDING' }, include: { loan: { include: { user: { select: { phone: true } } } } } })
    if (repayment && amount) {
      const late = new Date() > repayment.dueDate
      await db.$transaction([
        db.repayment.update({ where: { id: repayment.id }, data: { status: late ? 'LATE' : 'PAID', paidAt: new Date(), amountPaidKes: amount, mpesaRef: ref } }),
        db.transaction.create({ data: { userId: repayment.loan.userId, loanId: repayment.loanId, type: 'LOAN_REPAYMENT', amountKes: amount, reference: ref, description: 'M-Pesa STK repayment' } }),
      ])
      if (repayment.loan.user?.phone) await sendSms(repayment.loan.user.phone, `Shamba: KES ${amount.toLocaleString()} repayment received. Ref: ${ref}. Thank you! 🌱`)
    }
  } catch (e) { console.error('[STK]', e) }
  ack(res)
}

export async function mpesaB2CResult(req: Request, res: Response) {
  console.log('[B2C Result]', JSON.stringify(req.body))
  ack(res)
}

export async function mpesaB2CTimeout(req: Request, res: Response) {
  console.warn('[B2C Timeout]', req.body)
  ack(res)
}

export async function paystackWebhook(req: Request, res: Response) {
  try {
    const crypto = require('crypto')
    const hash   = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '').update(JSON.stringify(req.body)).digest('hex')
    if (hash !== req.headers['x-paystack-signature']) return res.sendStatus(401)

    if (req.body.event === 'charge.success') {
      const { reference, amount } = req.body.data
      const order = await db.marketOrder.findFirst({ where: { paymentRef: reference, status: 'PENDING' } })
      if (order) {
        await db.$transaction([
          db.marketOrder.update({ where: { id: order.id }, data: { status: 'IN_ESCROW', confirmedAt: new Date() } }),
          db.wallet.upsert({ where: { userId: order.sellerId }, create: { userId: order.sellerId, escrowKes: order.escrowAmountKes }, update: { escrowKes: { increment: order.escrowAmountKes } } }),
        ])
      }
    }
  } catch (e) { console.error('[Paystack]', e) }
  res.sendStatus(200)
}
