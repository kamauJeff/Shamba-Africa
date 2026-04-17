import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { signAccess, signRefresh, verifyRefresh, refreshExpiresAt } from '../../services/jwt.service'
import { sendSms } from '../../services/sms.service'

const COOKIE = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, maxAge: 7 * 24 * 60 * 60 * 1000 }

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, phone, email, password, role, referralCode } = req.body
    const exists = await db.user.findFirst({ where: { OR: [{ phone }, ...(email ? [{ email }] : [])] } })
    if (exists) throw new AppError('Phone or email already registered', 409, 'DUPLICATE')

    let referredById: string | undefined
    if (referralCode) {
      const ref = await db.user.findUnique({ where: { referralCode } })
      if (ref) {
        referredById = ref.id
        // Credit referral bonus
        await db.wallet.upsert({ where: { userId: ref.id }, create: { userId: ref.id, balanceKes: 500, totalEarnedKes: 500 }, update: { balanceKes: { increment: 500 }, totalEarnedKes: { increment: 500 } } })
        await db.transaction.create({ data: { userId: ref.id, type: 'REFERRAL_BONUS', amountKes: 500, description: `Referral bonus — ${name} joined` } })
        await sendSms(ref.phone, `Shamba: ${name} joined using your referral! KES 500 credited to your wallet. 🌱`)
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: { name, phone, email: email || null, passwordHash, role, referredById },
      select: { id: true, name: true, phone: true, email: true, role: true, referralCode: true },
    })

    await db.wallet.create({ data: { userId: user.id } })

    const payload = { userId: user.id, role: user.role }
    const accessToken  = signAccess(payload)
    const refreshToken = signRefresh(payload)
    await db.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() } })
    res.cookie('refreshToken', refreshToken, COOKIE)

    res.status(201).json({ success: true, data: { user, tokens: { accessToken, expiresIn: 900 } } })
  } catch (e) { next(e) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body
    const user = await db.user.findUnique({ where: { phone } })
    if (!user || !user.isActive) throw new AppError('Invalid phone or password', 401, 'INVALID_CREDENTIALS')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new AppError('Invalid phone or password', 401, 'INVALID_CREDENTIALS')

    const payload = { userId: user.id, role: user.role }
    const accessToken  = signAccess(payload)
    const refreshToken = signRefresh(payload)
    await db.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() } })
    res.cookie('refreshToken', refreshToken, COOKIE)

    await db.activityLog.create({ data: { userId: user.id, action: 'LOGIN', ip: req.ip } })

    const { passwordHash: _, ...safe } = user
    res.json({ success: true, data: { user: safe, tokens: { accessToken, expiresIn: 900 } } })
  } catch (e) { next(e) }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken
    if (!token) throw new AppError('Refresh token required', 401, 'UNAUTHORIZED')

    const stored = await db.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new AppError('Invalid refresh token', 401, 'TOKEN_INVALID')

    const payload = verifyRefresh(token)
    const [, fresh] = await db.$transaction([
      db.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
      db.refreshToken.create({ data: { userId: payload.userId, token: signRefresh(payload), expiresAt: refreshExpiresAt() } }),
    ])

    res.cookie('refreshToken', fresh.token, COOKIE)
    res.json({ success: true, data: { tokens: { accessToken: signAccess(payload), expiresIn: 900 } } })
  } catch (e) { next(e) }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken
    if (token) await db.refreshToken.updateMany({ where: { token }, data: { revokedAt: new Date() } }).catch(() => {})
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Logged out' })
  } catch (e) { next(e) }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, name: true, phone: true, email: true, role: true, county: true, subscription: true, referralCode: true, isVerified: true, createdAt: true } })
    if (!user) throw new AppError('User not found', 404)
    res.json({ success: true, data: user })
  } catch (e) { next(e) }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, county } = req.body
    const user = await db.user.update({ where: { id: req.user!.userId }, data: { ...(name && { name }), ...(email && { email }), ...(county && { county }) }, select: { id: true, name: true, phone: true, email: true, role: true, county: true } })
    res.json({ success: true, data: user })
  } catch (e) { next(e) }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await db.user.findUniqueOrThrow({ where: { id: req.user!.userId } })
    if (!await bcrypt.compare(currentPassword, user.passwordHash)) throw new AppError('Incorrect current password', 401)
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } })
    await db.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Password changed. Please log in again.' })
  } catch (e) { next(e) }
}
