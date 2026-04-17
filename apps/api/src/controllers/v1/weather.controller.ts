import { Request, Response, NextFunction } from 'express'
import { db } from '../../config/db'
import { AppError } from '../../middleware/error'
import { getWeatherForCounty, getForecast, getCurrentWeather } from '../../services/weather.service'

export async function getFarmerWeather(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await db.farmerProfile.findUnique({ where: { userId: req.user!.userId } })
    if (!profile) throw new AppError('Complete your farmer profile first', 422)

    if (profile.latitude && profile.longitude) {
      const [current, forecast] = await Promise.all([
        getCurrentWeather(profile.latitude, profile.longitude),
        getForecast(profile.latitude, profile.longitude),
      ])
      return res.json({ success: true, data: { current, forecast, source: 'gps' } })
    }

    const data = await getWeatherForCounty(profile.county)
    res.json({ success: true, data: { ...data, source: 'county' } })
  } catch (e) { next(e) }
}

export async function getCountyWeather(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getWeatherForCounty(req.params.county)
    res.json({ success: true, data })
  } catch (e) { next(e) }
}
