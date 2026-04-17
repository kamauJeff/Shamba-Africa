import { Router } from 'express'
import { authenticate, requireRole, validate } from '../../middleware/auth'
import { LoanApplicationSchema, RepaymentSchema } from '@shamba/shared'
import { apply, approve, disburse, repay, getLoans, getLoan } from '../../controllers/v1/loan.controller'
export const loanRouter = Router()
loanRouter.use(authenticate)
loanRouter.get('/', getLoans)
loanRouter.get('/:id', getLoan)
loanRouter.post('/apply', validate(LoanApplicationSchema), apply)
loanRouter.post('/:id/repay', validate(RepaymentSchema), repay)
loanRouter.post('/:id/approve', requireRole('ADMIN','SUPER_ADMIN'), approve)
loanRouter.post('/:id/disburse', requireRole('ADMIN','SUPER_ADMIN'), disburse)
