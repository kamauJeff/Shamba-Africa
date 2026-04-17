import { Request, Response } from 'express'
import { db } from '../../config/db'

const bye  = (msg: string) => `END ${msg}`
const menu = (msg: string) => `CON ${msg}`

const MAIN = menu(`Welcome to Shamba 🌱\n1. Market prices\n2. My credit score\n3. Loan status\n4. Weather alert\n5. My wallet balance\n0. Exit`)

async function getUser(phone: string) {
  const normalized = phone.replace('+254', '0')
  return db.user.findFirst({ where: { OR: [{ phone }, { phone: normalized }] }, select: { id:true, name:true, phone:true } })
}

export async function handleUssd(req: Request, res: Response) {
  const { phoneNumber, text } = req.body
  const parts = (text as string).split('*').filter(Boolean)
  const level = parts.length

  res.set('Content-Type', 'text/plain')

  if (level === 0) return res.send(MAIN)
  if (parts[0] === '0') return res.send(bye('Thank you for using Shamba. Happy farming! 🌱'))

  // 1 — Market prices
  if (parts[0] === '1') {
    if (level === 1) return res.send(menu('Select crop:\n1. Maize\n2. Beans\n3. Tomatoes\n4. Potatoes\n5. Wheat'))
    const crops: Record<string, string> = { '1':'Maize','2':'Beans','3':'Tomatoes','4':'Potatoes','5':'Wheat' }
    const crop = crops[parts[1]]
    if (!crop) return res.send(bye('Invalid selection.'))
    const price = await db.cropPrice.findFirst({ where: { crop: { contains: crop, mode: 'insensitive' } }, orderBy: { recordedAt: 'desc' } })
    if (!price) return res.send(bye(`No price data for ${crop}. Try the Shamba app.`))
    return res.send(bye(`${price.crop} - ${price.county}\nKES ${price.priceKes}/${price.unit}\nUpdated: ${price.recordedAt.toLocaleDateString()}`))
  }

  // 2 — Credit score
  if (parts[0] === '2') {
    const user = await getUser(phoneNumber)
    if (!user) return res.send(bye('Register on Shamba app to access credit services.'))
    const score = await db.creditScore.findFirst({ where: { userId: user.id }, orderBy: { computedAt: 'desc' } })
    if (!score) return res.send(bye(`Hi ${user.name}! No credit score yet. Complete your profile on the Shamba app.`))
    return res.send(bye(`Hi ${user.name}!\nCredit Score: ${score.score}/850\nRating: ${score.rating}\nMax Loan: KES ${score.maxLoanKes.toLocaleString()}\n\nFor details, open the Shamba app.`))
  }

  // 3 — Loan status
  if (parts[0] === '3') {
    const user = await getUser(phoneNumber)
    if (!user) return res.send(bye('Register on Shamba app to access loan services.'))
    const loan = await db.loan.findFirst({ where: { userId: user.id, status: { in: ['PENDING','APPROVED','ACTIVE'] } }, include: { repayments: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' }, take: 1 } }, orderBy: { createdAt: 'desc' } })
    if (!loan) return res.send(bye('No active loans. Apply via the Shamba app.'))
    const next = loan.repayments[0]
    return res.send(bye(`Loan: KES ${loan.principalKes.toLocaleString()}\nStatus: ${loan.status}\n${next ? `Next payment: KES ${next.amountDueKes.toLocaleString()} due ${next.dueDate.toLocaleDateString()}` : 'No pending payments'}`))
  }

  // 4 — Weather
  if (parts[0] === '4') {
    const user = await getUser(phoneNumber)
    if (!user) return res.send(bye('Register on Shamba app for weather services.'))
    const profile = await db.farmerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return res.send(bye('Add your farm on the Shamba app to get local weather.'))
    const cached = await db.weatherCache.findFirst({ where: { county: profile.county, expiresAt: { gt: new Date() } } })
    const weather = cached?.data as any
    return res.send(bye(`${profile.county} Weather\n${weather?.current ? `${weather.current.temp}°C, ${weather.current.description}` : 'Check Shamba app for forecast'}\n\nShamba: From seed to sale.`))
  }

  // 5 — Wallet
  if (parts[0] === '5') {
    const user = await getUser(phoneNumber)
    if (!user) return res.send(bye('Register on Shamba app to access your wallet.'))
    const wallet = await db.wallet.findUnique({ where: { userId: user.id } })
    return res.send(bye(`Hi ${user.name}!\nWallet balance: KES ${(wallet?.balanceKes ?? 0).toLocaleString()}\nEscrow: KES ${(wallet?.escrowKes ?? 0).toLocaleString()}\n\nWithdraw via the Shamba app.`))
  }

  res.send(bye('Invalid option. Please try again.'))
}
