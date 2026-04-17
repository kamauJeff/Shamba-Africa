import { useState } from 'react'
import { MapPin, Star, CheckCircle2, Phone } from 'lucide-react'
import { useSupply, useStakeholder } from '@/hooks/useApi'

const TYPES = ['AGRO_DEALER','TRANSPORTER','COLD_STORAGE','PROCESSOR','EXPORTER']
const TYPE_COLORS: Record<string,string> = { AGRO_DEALER:'badge-green', TRANSPORTER:'badge-blue', COLD_STORAGE:'badge-amber', PROCESSOR:'badge-gray', EXPORTER:'badge-blue' }

export default function SupplyPage() {
  const [type, setType] = useState('')
  const [county, setCounty] = useState('')
  const { data, isLoading } = useSupply({ type:type||undefined, county:county||undefined })

  return (
    <div className="page-fade space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">Supply Chain Directory</h1><p className="text-gray-500 text-sm mt-1">Verified agro-dealers, transporters, cold storage & processors near you</p></div>
      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={type} onChange={e=>setType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
        </select>
        <input className="input w-auto" placeholder="Filter by county…" value={county} onChange={e=>setCounty(e.target.value)}/>
      </div>
      {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-44 rounded-2xl"/>)}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items?.map((s:any)=>(
          <div key={s.id} className="card-hover p-5">
            <div className="flex items-start justify-between mb-2">
              <div><p className="font-semibold">{s.name}</p><div className="flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3 text-gray-400"/><span className="text-xs text-gray-500">{s.county}</span></div></div>
              <span className={TYPE_COLORS[s.type]??'badge-gray'}>{s.type.replace('_',' ')}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {s.verified&&<span className="flex items-center gap-1 text-xs text-shamba-600"><CheckCircle2 className="h-3 w-3"/>Verified</span>}
              <span className="flex items-center gap-1 text-xs text-amber-600"><Star className="h-3 w-3 fill-amber-400"/>{s.rating.toFixed(1)} ({s.ratingCount})</span>
            </div>
            {s.services?.length>0&&<div className="flex flex-wrap gap-1 mb-3">{s.services.map((sv:string)=><span key={sv} className="badge-gray text-[10px]">{sv}</span>)}</div>}
            {s.capacity&&<p className="text-xs text-gray-400 mb-2">Capacity: {s.capacity}</p>}
            <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-sm text-shamba-600 hover:text-shamba-700"><Phone className="h-3.5 w-3.5"/>{s.phone}</a>
          </div>
        ))}
      </div>
    </div>
  )
}
