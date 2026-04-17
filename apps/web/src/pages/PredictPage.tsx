import { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { usePredict } from '@/hooks/useApi'
import { CROPS, getCurrentSeason } from '@shamba/shared'
import { formatKes, formatNum } from '@/lib/utils'

const SOILS=['LOAM','CLAY','SANDY','SILT','CLAY_LOAM','SANDY_LOAM','PEAT','CHALK']

export default function PredictPage() {
  const predict = usePredict()
  const [form, setForm] = useState({ crop:'Maize', soilType:'LOAM', areaAcres:'', rainfallMm:'', tempAvgC:'', fertilizerUsed:false, irrigated:false, season:getCurrentSeason() })
  const [result, setResult] = useState<any>(null)
  const s=(k:string)=>(e:any)=>setForm(f=>({...f,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}))

  return (
    <div className="page-fade space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">AI Yield Prediction</h1><p className="text-gray-500 text-sm mt-1">Kenya-specific crop yield estimates powered by local data</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Prediction inputs</h2>
          <form onSubmit={async e=>{e.preventDefault();const r=await predict.mutateAsync({...form,areaAcres:Number(form.areaAcres),rainfallMm:Number(form.rainfallMm),tempAvgC:Number(form.tempAvgC)});setResult(r)}} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Crop</label><select className="input" value={form.crop} onChange={s('crop')}>{CROPS.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="label">Soil type</label><select className="input" value={form.soilType} onChange={s('soilType')}>{SOILS.map(st=><option key={st} value={st}>{st.replace('_',' ')}</option>)}</select></div>
              <div><label className="label">Area (acres) *</label><input type="number" className="input" value={form.areaAcres} onChange={s('areaAcres')} required min="0.1" step="0.1"/></div>
              <div><label className="label">Rainfall (mm) *</label><input type="number" className="input" value={form.rainfallMm} onChange={s('rainfallMm')} required min="0"/></div>
              <div><label className="label">Avg temp (°C) *</label><input type="number" className="input" value={form.tempAvgC} onChange={s('tempAvgC')} required min="0" max="50"/></div>
              <div><label className="label">Season</label><select className="input" value={form.season} onChange={s('season')}><option value="LONG_RAINS">Long Rains</option><option value="SHORT_RAINS">Short Rains</option><option value="DRY">Dry Season</option></select></div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" className="h-4 w-4 rounded text-shamba-600" checked={form.fertilizerUsed} onChange={s('fertilizerUsed')}/>Using fertilizer</label>
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" className="h-4 w-4 rounded text-shamba-600" checked={form.irrigated} onChange={s('irrigated')}/>Irrigated</label>
            </div>
            <button type="submit" disabled={predict.isPending} className="btn-primary w-full justify-center py-3">
              {predict.isPending?<><Loader2 className="h-4 w-4 animate-spin"/>Calculating…</>:<><Zap className="h-4 w-4"/>Predict yield</>}
            </button>
          </form>
        </div>
        <div>
          {result ? (
            <div className="card overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-shamba-700 to-shamba-800 px-6 py-5 text-white">
                <p className="text-shamba-200 text-sm">Predicted yield for</p>
                <h2 className="font-display text-2xl font-semibold">{result.cropName}</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[['Total yield',`${formatNum(result.predictedYieldKg)} kg`,'shamba'],['Per acre',`${formatNum(result.predictedYieldPerAcre)} kg`,'blue'],['Revenue',formatKes(result.estimatedRevenueKes),'amber']].map(([l,v,c])=>(
                    <div key={l} className={`rounded-xl bg-${c}-50 p-3 text-center`}><p className={`text-2xl font-bold text-${c}-700`}>{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p></div>
                  ))}
                </div>
                <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Confidence: {result.confidencePct}%</p><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${result.confidencePct>=75?'bg-shamba-500':result.confidencePct>=55?'bg-amber-400':'bg-red-400'}`} style={{width:`${result.confidencePct}%`}}/></div></div>
                <div><p className="text-xs font-semibold text-shamba-600 uppercase mb-2">Recommendations</p><ul className="space-y-1">{result.recommendations.map((r:string,i:number)=><li key={i} className="flex gap-2 text-sm text-gray-600"><span className="text-shamba-500 shrink-0">→</span>{r}</li>)}</ul></div>
                <div><p className="text-xs font-semibold text-amber-600 uppercase mb-2">Risk factors</p><ul className="space-y-1">{result.riskFactors.map((r:string,i:number)=><li key={i} className="flex gap-2 text-sm text-gray-600"><span className="text-amber-500 shrink-0">⚠</span>{r}</li>)}</ul></div>
                <div className="rounded-xl bg-gray-50 px-4 py-2 text-sm"><span className="text-gray-500">Optimal harvest: </span><span className="font-medium">{result.optimalHarvestWindow}</span></div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <Zap className="h-12 w-12 opacity-20 mb-3"/>
              <p>Fill in the form to get your yield prediction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
