import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { InsurancePolicySchema } from '@shamba/shared'
import { createPolicy, getPolicies, getPolicy, getThresholds } from '../../controllers/v1/insurance.controller'
export const insuranceRouter = Router()
insuranceRouter.get('/thresholds', getThresholds)
insuranceRouter.use(authenticate)
insuranceRouter.get('/', getPolicies)
insuranceRouter.get('/:id', getPolicy)
insuranceRouter.post('/', validate(InsurancePolicySchema), createPolicy)
