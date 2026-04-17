import axios from 'axios'
import { db } from '../config/db'
import { COUNTY_COORDS } from '@shamba/shared'

const OWM = 'https://api.openweathermap.org/data/2.5'
const key  = () => process.env.OPENWEATHER_API_KEY!

export async function getForecast(lat: number, lon: number) {
  const { data } = await axios.get(`${OWM}/forecast`, { params: { lat, lon, appid: key(), units: 'metric', cnt: 40 } })
  const byDay = new Map<string, any[]>()
  for (const item of data.list) {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(item)
  }
  const forecast = []
  for (const [date, items] of byDay) {
    const mid = items[Math.floor(items.length / 2)]
    const rain = items.reduce((s: number, i: any) => s + (i.rain?.['3h'] ?? 0), 0)
    const humidity = Math.round(items.reduce((s: number, i: any) => s + i.main.humidity, 0) / items.length)
    const advice = rain > 30 ? 'Avoid spraying. Check drainage.' : mid.main.temp_max > 35 ? 'Irrigate early morning.' : 'Good conditions for field work.'
    forecast.push({
      date,
      tempMin:    Math.round(Math.min(...items.map((i: any) => i.main.temp_min))),
      tempMax:    Math.round(Math.max(...items.map((i: any) => i.main.temp_max))),
      humidity,
      rainfallMm: Math.round(rain * 10) / 10,
      windSpeed:  Math.round(mid.wind.speed),
      description: mid.weather[0].description,
      icon:        mid.weather[0].icon,
      farmingAdvice: advice,
    })
    if (forecast.length === 7) break
  }
  return forecast
}

export async function getCurrentWeather(lat: number, lon: number) {
  const { data } = await axios.get(`${OWM}/weather`, { params: { lat, lon, appid: key(), units: 'metric' } })
  return {
    temp:        Math.round(data.main.temp),
    feelsLike:   Math.round(data.main.feels_like),
    humidity:    data.main.humidity,
    windSpeed:   Math.round(data.wind.speed),
    description: data.weather[0].description,
    icon:        data.weather[0].icon,
    visibility:  data.visibility,
    rainMm:      data.rain?.['1h'] ?? 0,
  }
}

export async function getWeatherForCounty(county: string) {
  // Check cache first (30min TTL)
  const cached = await db.weatherCache.findFirst({
    where: { county, expiresAt: { gt: new Date() } },
  })
  if (cached) return cached.data as any

  const coords = COUNTY_COORDS[county] ?? { lat: -1.286, lon: 36.82 }
  const [current, forecast] = await Promise.all([
    getCurrentWeather(coords.lat, coords.lon),
    getForecast(coords.lat, coords.lon),
  ])
  const result = { current, forecast }

  await db.weatherCache.upsert({
    where: { county },
    create: { county, data: result as any, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    update: { data: result as any, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  })
  return result
}
