import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { CreateListingSchema, PlaceOrderSchema } from '@shamba/shared'
import { createListing,getListings,getListing,updateListing,deleteListing,getMyListings,placeOrder,confirmDelivery,getOrders,getPrices } from '../../controllers/v1/market.controller'
export const marketRouter = Router()
marketRouter.get('/prices', getPrices)
marketRouter.get('/listings', getListings)
marketRouter.use(authenticate)
marketRouter.get('/listings/mine', getMyListings)
marketRouter.get('/listings/:id', getListing)
marketRouter.post('/listings', validate(CreateListingSchema), createListing)
marketRouter.patch('/listings/:id', updateListing)
marketRouter.delete('/listings/:id', deleteListing)
marketRouter.get('/orders', getOrders)
marketRouter.post('/orders', validate(PlaceOrderSchema), placeOrder)
marketRouter.post('/orders/:id/confirm-delivery', confirmDelivery)
