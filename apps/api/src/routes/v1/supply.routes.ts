import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { StakeholderSchema } from '@shamba/shared'
import { getStakeholders,getStakeholder,createStakeholder,reviewStakeholder } from '../../controllers/v1/supply.controller'
export const supplyRouter = Router()
supplyRouter.get('/', getStakeholders)
supplyRouter.get('/:id', getStakeholder)
supplyRouter.use(authenticate)
supplyRouter.post('/', validate(StakeholderSchema), createStakeholder)
supplyRouter.post('/:id/review', reviewStakeholder)
