import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth'
import { getRevenue,getUsers,getAllLoans,getInsurancePolicies,verifyStakeholder,approveLoan } from '../../controllers/v1/admin.controller'
export const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN','SUPER_ADMIN'))
adminRouter.get('/revenue', getRevenue)
adminRouter.get('/users', getUsers)
adminRouter.get('/loans', getAllLoans)
adminRouter.post('/loans/:id/approve', approveLoan)
adminRouter.get('/insurance', getInsurancePolicies)
adminRouter.post('/supply/:id/verify', verifyStakeholder)
