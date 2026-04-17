import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { FarmerProfileSchema } from '@shamba/shared'
import { getProfile, upsertProfile, getCreditScore, refreshCredit, getCreditHistory, getDashboardStats, getYieldHistory } from '../../controllers/v1/farmer.controller'
export const farmerRouter = Router()
farmerRouter.use(authenticate)
farmerRouter.get('/dashboard',       getDashboardStats)
farmerRouter.get('/profile',         getProfile)
farmerRouter.put('/profile',         validate(FarmerProfileSchema), upsertProfile)
farmerRouter.get('/credit',          getCreditScore)
farmerRouter.post('/credit/refresh', refreshCredit)
farmerRouter.get('/credit/history',  getCreditHistory)
farmerRouter.get('/yield-history',   getYieldHistory)
