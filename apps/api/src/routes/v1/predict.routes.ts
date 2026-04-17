import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { YieldPredictionSchema } from '@shamba/shared'
import { predict, getHistory } from '../../controllers/v1/predict.controller'
export const predictRouter = Router()
predictRouter.use(authenticate)
predictRouter.post('/', validate(YieldPredictionSchema), predict)
predictRouter.get('/history', getHistory)
