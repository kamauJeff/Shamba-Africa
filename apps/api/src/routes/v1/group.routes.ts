import { Router } from 'express'
import { authenticate, validate } from '../../middleware/auth'
import { CreateGroupSchema, GroupContributionSchema } from '@shamba/shared'
import { createGroup,getGroups,getGroup,joinGroup,contribute,getMyGroups } from '../../controllers/v1/group.controller'
export const groupRouter = Router()
groupRouter.get('/', getGroups)
groupRouter.get('/:id', getGroup)
groupRouter.use(authenticate)
groupRouter.get('/mine', getMyGroups)
groupRouter.post('/', validate(CreateGroupSchema), createGroup)
groupRouter.post('/:id/join', joinGroup)
groupRouter.post('/:id/contribute', validate(GroupContributionSchema), contribute)
