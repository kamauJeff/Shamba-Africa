import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react'
import { useFarmerWeather } from '@/hooks/useApi'

function WeatherIcon({ icon, size=6 }: { icon:string; size?:number }) {
  const cls = `h-${size} w-${size}`
  if(icon.includes('01')) return <Sun className={`${cls} text-amber-400`}/>
  if(icon.includes('09')||icon.includes('10')) return <CloudRain className={`${cls} text-blue-500`}/>
  return <Cloud className={`${cls} text-gray-400`}/>
}

const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function WeatherPage() {
  const { data, isLoading } = useFarmerWeather()
  if(isLoading) return <div className="space-y-4">{[1,2].map(i=><div key={i} className="skeleton h-40 rounded-2xl"/>)}</div>
  if(!data) return <div className="card p-8 text-center text-gray-400">Add your farm location to see hyperlocal weather</div>

  return (
    <div className="page-fade space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">Weather Forecast</h1><p className="text-gray-500 text-sm mt-1">Hyperlocal 7-day forecast for your farm location</p></div>
      {data.current && (
        <div className="card p-6 bg-gradient-to-br from-shamba-800 to-shamba-900 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-5xl font-bold">{data.current.temp}°C</p><p className="text-shamba-200 capitalize mt-1">{data.current.description}</p><p className="text-shamba-300 text-sm mt-0.5">Feels like {data.current.feelsLike}°C</p></div>
            <WeatherIcon icon={data.current.icon} size={16}/>
          </div>
          <div className="flex gap-6 mt-4 text-sm text-shamba-200">
            <span className="flex items-center gap-1"><Droplets className="h-4 w-4"/>{data.current.humidity}%</span>
            <span className="flex items-center gap-1"><Wind className="h-4 w-4"/>{data.current.windSpeed}m/s</span>
            <span className="flex items-center gap-1"><Thermometer className="h-4 w-4"/>Rain: {data.current.rainMm}mm/h</span>
          </div>
        </div>
      )}
      {data.forecast && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">7-Day Forecast</h2>
          <div className="grid grid-cols-7 gap-2">
            {data.forecast.slice(0,7).map((day:any)=>{
              const d=new Date(day.date)
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 px-1 text-center">
                  <p className="text-xs text-gray-400 font-medium">{DAYS[d.getDay()]}</p>
                  <WeatherIcon icon={day.icon} size={5}/>
                  <p className="text-sm font-bold">{day.tempMax}°</p>
                  <p className="text-xs text-gray-400">{day.tempMin}°</p>
                  {day.rainfallMm>0&&<p className="text-xs text-blue-500">{day.rainfallMm}mm</p>}
                  <p className="text-[9px] text-shamba-600 text-center leading-tight px-1">{day.farmingAdvice?.split('.')[0]}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
