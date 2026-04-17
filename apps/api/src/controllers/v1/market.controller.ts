import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { REVENUE_CONFIG } from '@shamba/shared'

// ─── Listings ─────────────────────────────────────────────────
export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { cropName, variety, quantityKg, pricePerKgKes, county, region, grade, harvestDate, availableFrom, availableUntil, description, photos, certifications, minimumOrderKg, deliveryRadius } = req.body
    const listing = await db.productListing.create({
      data: { sellerId: req.user!.userId, cropName, variety, quantityKg, pricePerKgKes, totalValueKes: quantityKg * pricePerKgKes, county, region, grade, harvestDate: new Date(harvestDate), availableFrom: new Date(availableFrom), availableUntil: new Date(availableUntil), description, photos: photos ?? [], certifications: certifications ?? [], minimumOrderKg: minimumOrderKg ?? 50, deliveryRadius, status: 'ACTIVE' },
    })
    res.status(201).json({ success: true, data: listing })
  } catch (e) { next(e) }
}

export async function getListings(req: Request, res: Response, next: NextFunction) {
  try {
    const { crop, county, grade, minPrice, maxPrice, page = '1', pageSize = '20' } = req.query as Record<string, string>
    const where: any = { status: 'ACTIVE', availableUntil: { gte: new Date() } }
    if (crop)     where.cropName   = { contains: crop,   mode: 'insensitive' }
    if (county)   where.county     = { contains: county, mode: 'insensitive' }
    if (grade)    where.grade      = grade
    if (minPrice) where.pricePerKgKes = { ...where.pricePerKgKes, gte: Number(minPrice) }
    if (maxPrice) where.pricePerKgKes = { ...where.pricePerKgKes, lte: Number(maxPrice) }

    const skip = (Number(page) - 1) * Number(pageSize)
    const [items, total] = await Promise.all([
      db.productListing.findMany({ where, skip, take: Number(pageSize), include: { seller: { select: { name: true, county: true, isVerified: true } } }, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] }),
      db.productListing.count({ where }),
    ])
    res.json({ success: true, data: { items, total, page: Number(page), pageSize: Number(pageSize), totalPages: Math.ceil(total / Number(pageSize)) } })
  } catch (e) { next(e) }
}

export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await db.productListing.findUniqueOrThrow({ where: { id: req.params.id }, include: { seller: { select: { name: true, county: true, phone: true, isVerified: true } } } })
    await db.productListing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } })
    res.json({ success: true, data: listing })
  } catch (e) { next(e) }
}

export async function updateListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await db.productListing.findFirst({ where: { id: req.params.id, sellerId: req.user!.userId } })
    if (!listing) throw new AppError('Listing not found', 404)
    const updated = await db.productListing.update({ where: { id: listing.id }, data: req.body })
    res.json({ success: true, data: updated })
  } catch (e) { next(e) }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await db.productListing.findFirst({ where: { id: req.params.id, sellerId: req.user!.userId } })
    if (!listing) throw new AppError('Listing not found', 404)
    await db.productListing.update({ where: { id: listing.id }, data: { status: 'REMOVED' } })
    res.json({ success: true, message: 'Listing removed' })
  } catch (e) { next(e) }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await db.productListing.findMany({ where: { sellerId: req.user!.userId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { orders: true } } } })
    res.json({ success: true, data: listings })
  } catch (e) { next(e) }
}

// ─── Orders ───────────────────────────────────────────────────
export async function placeOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const buyerId = req.user!.userId
    const { listingId, quantityKg, deliveryAddress, deliveryDate, notes } = req.body

    const listing = await db.productListing.findFirst({ where: { id: listingId, status: 'ACTIVE' } })
    if (!listing) throw new AppError('Listing not available', 404)
    if (listing.sellerId === buyerId) throw new AppError('Cannot order your own listing', 422)
    if (quantityKg < listing.minimumOrderKg) throw new AppError(`Minimum order is ${listing.minimumOrderKg}kg`, 422)
    if (quantityKg > listing.quantityKg) throw new AppError(`Only ${listing.quantityKg}kg available`, 422)

    const total      = quantityKg * listing.pricePerKgKes
    const commission = total * (REVENUE_CONFIG.marketplace.commissionPct / 100)

    const order = await db.marketOrder.create({
      data: { listingId, buyerId, sellerId: listing.sellerId, quantityKg, agreedPricePerKgKes: listing.pricePerKgKes, totalAmountKes: total, commissionKes: commission, escrowAmountKes: total, deliveryAddress, deliveryDate: deliveryDate ? new Date(deliveryDate) : null, notes },
    })
    res.status(201).json({ success: true, data: order })
  } catch (e) { next(e) }
}

export async function confirmDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await db.marketOrder.findFirst({ where: { id: req.params.id, buyerId: req.user!.userId, status: 'IN_ESCROW' } })
    if (!order) throw new AppError('Order not found or not in escrow', 404)

    const sellerPayout = order.totalAmountKes - order.commissionKes
    await db.$transaction([
      db.marketOrder.update({ where: { id: order.id }, data: { status: 'COMPLETED', completedAt: new Date(), deliveredAt: new Date() } }),
      db.wallet.upsert({ where: { userId: order.sellerId }, create: { userId: order.sellerId, balanceKes: sellerPayout, totalEarnedKes: sellerPayout }, update: { balanceKes: { increment: sellerPayout }, escrowKes: { decrement: order.escrowAmountKes }, totalEarnedKes: { increment: sellerPayout } } }),
      db.transaction.create({ data: { userId: order.sellerId, orderId: order.id, type: 'MARKET_SALE', amountKes: sellerPayout, description: `Sale — KES ${order.totalAmountKes.toLocaleString()} less ${REVENUE_CONFIG.marketplace.commissionPct}% commission` } }),
      db.transaction.create({ data: { userId: order.sellerId, orderId: order.id, type: 'MARKET_COMMISSION', amountKes: order.commissionKes, description: `Shamba marketplace commission` } }),
    ])
    res.json({ success: true, message: 'Delivery confirmed. Funds released to seller.' })
  } catch (e) { next(e) }
}

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId
    const { role = 'buyer' } = req.query as { role?: string }
    const where = role === 'seller' ? { sellerId: userId } : { buyerId: userId }
    const orders = await db.marketOrder.findMany({ where, include: { listing: { select: { cropName: true, county: true, photos: true } } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: orders })
  } catch (e) { next(e) }
}

// ─── Prices ───────────────────────────────────────────────────
export async function getPrices(req: Request, res: Response, next: NextFunction) {
  try {
    const { crop, county, page = '1', pageSize = '30' } = req.query as Record<string, string>
    const where: any = {}
    if (crop)   where.crop   = { contains: crop,   mode: 'insensitive' }
    if (county) where.county = { contains: county, mode: 'insensitive' }
    const [items, total] = await Promise.all([
      db.cropPrice.findMany({ where, skip: (Number(page) - 1) * Number(pageSize), take: Number(pageSize), orderBy: { recordedAt: 'desc' } }),
      db.cropPrice.count({ where }),
    ])
    res.json({ success: true, data: { items, total, page: Number(page), totalPages: Math.ceil(total / Number(pageSize)) } })
  } catch (e) { next(e) }
}
