import { Router } from 'express'
import { mpesaStk,mpesaB2CResult,mpesaB2CTimeout,paystackWebhook } from '../../controllers/v1/webhook.controller'
export const webhookRouter = Router()
webhookRouter.post('/mpesa/stk', mpesaStk)
webhookRouter.post('/mpesa/b2c/result', mpesaB2CResult)
webhookRouter.post('/mpesa/b2c/timeout', mpesaB2CTimeout)
webhookRouter.post('/paystack', paystackWebhook)
