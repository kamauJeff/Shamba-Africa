import { Router } from 'express'
import { handleUssd } from '../../controllers/v1/ussd.controller'
export const ussdRouter = Router()
ussdRouter.post('/', handleUssd)
