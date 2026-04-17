import { Router } from 'express'
import { authenticate } from '../../middleware/auth'
import { getFarmerWeather, getCountyWeather } from '../../controllers/v1/weather.controller'
export const weatherRouter = Router()
weatherRouter.get('/my-farm', authenticate, getFarmerWeather)
weatherRouter.get('/county/:county', getCountyWeather)
