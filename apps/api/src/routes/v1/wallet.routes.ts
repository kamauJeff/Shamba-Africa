import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { WithdrawSchema } from '@shamba/shared'
import { getWallet, withdraw } from '../../controllers/v1/wallet.controller'
export const walletRouter = Router()
walletRouter.use(authenticate)
walletRouter.get('/', getWallet)
walletRouter.post('/withdraw', validate(WithdrawSchema), withdraw)
