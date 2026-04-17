import { useState } from 'react'
import { Shield, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { usePolicies, useThresholds, useCreatePolicy } from '@/hooks/useApi'
import { formatKes, formatDate } from '@/lib/utils'

export default function InsurancePage() {
  const { data: policies } = usePolicies()
  const { data: thresholds } = useThresholds()
  const create = useCreatePolicy()
  const [form, setForm] = useState({ cropType:'', county:'', region:'', coverageAmountKes:'', startDate: new Date().toISOString().slice(0,10), endDate: new Date(Date.now()+180*86400000).toISOString().slice(0,10) })
  const [error, setError] = useState('')
  const coverage = Number(form.coverageAmountKes)||0
  const premium = coverage*0.04

  return (
    <div className="page-fade space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">Parametric Insurance</h1><p className="text-gray-500 text-sm mt-1">Weather-triggered automatic payouts — no forms needed</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Get crop insurance</h2>
          {error && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={async e => { e.preventDefault(); setError(''); try { await create.mutateAsync({...form,coverageAmountKes:Number(form.coverageAmountKes),startDate:new Date(form.startDate).toISOString(),endDate:new Date(form.endDate).toISOString()}); setForm({cropType:'',county:'',region:'',coverageAmountKes:'',startDate:new Date().toISOString().slice(0,10),endDate:new Date(Date.now()+180*86400000).toISOString().slice(0,10)}) } catch(err:any){setError(err.response?.data?.error??'Failed')}}} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['cropType','Crop type','Maize'],['county','County','Nakuru'],['region','Region','Rift Valley']].map(([k,label,ph])=>(
                <div key={k}><label className="label">{label}</label><input className="input" placeholder={ph} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required /></div>
              ))}
              <div><label className="label">Coverage (KES)</label><input type="number" className="input" placeholder="50000" value={form.coverageAmountKes} onChange={e=>setForm({...form,coverageAmountKes:e.target.value})} required /></div>
              <div><label className="label">Start date</label><input type="date" className="input" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} /></div>
              <div><label className="label">End date</label><input type="date" className="input" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} /></div>
            </div>
            {coverage>0 && <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div><p className="text-xs text-blue-600">Premium</p><p className="font-bold text-blue-800">{formatKes(premium)}</p><p className="text-xs text-blue-500">4% of coverage</p></div>
              <div><p className="text-xs text-blue-600">Max payout</p><p className="font-bold text-blue-800">{formatKes(coverage*0.5)}</p><p className="text-xs text-blue-500">50% on trigger</p></div>
              <div><p className="text-xs text-blue-600">Our commission</p><p className="font-bold text-blue-800">{formatKes(premium*0.12)}</p><p className="text-xs text-blue-500">12% of premium</p></div>
            </div>}
            <button type="submit" disabled={create.isPending} className="btn-primary w-full justify-center py-3 bg-blue-600 hover:bg-blue-700">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{create.isPending?'Creating…':'Get insured'}
            </button>
          </form>
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="font-semibold">Trigger events</h2>
          {thresholds && Object.entries(thresholds).map(([type,info]:any)=>(
            <div key={type} className="flex gap-3 rounded-xl bg-gray-50 p-3"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><div><p className="text-sm font-semibold">{type}</p><p className="text-xs text-gray-500">{info.description}</p><p className="text-xs text-shamba-600 mt-0.5">{info.payoutTrigger}</p></div></div>
          ))}
        </div>
      </div>
      <div><h2 className="font-semibold mb-3">Your policies</h2>
        <div className="space-y-3">
          {policies?.map((p:any)=>(
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3"><div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center"><Shield className="h-5 w-5 text-blue-600"/></div>
                  <div><p className="font-semibold">{p.cropType} Insurance</p><p className="text-sm text-gray-500">{p.county} · {p.policyRef}</p></div></div>
                <span className={`badge-${p.status==='ACTIVE'?'green':p.status==='TRIGGERED'?'amber':'gray'}`}>{p.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center text-sm">
                <div className="rounded-xl bg-gray-50 p-2"><p className="text-xs text-gray-400">Coverage</p><p className="font-bold">{formatKes(p.coverageAmountKes)}</p></div>
                <div className="rounded-xl bg-gray-50 p-2"><p className="text-xs text-gray-400">Premium</p><p className="font-bold">{formatKes(p.premiumKes)}</p></div>
                <div className="rounded-xl bg-gray-50 p-2"><p className="text-xs text-gray-400">Expires</p><p className="font-bold text-xs">{formatDate(p.endDate)}</p></div>
              </div>
              {p.status==='TRIGGERED'&&p.payoutAmountKes&&<div className="mt-3 flex items-center gap-2 rounded-xl bg-shamba-50 px-3 py-2 text-sm text-shamba-800"><ShieldCheck className="h-4 w-4"/><span>Payout of {formatKes(p.payoutAmountKes)} credited to your wallet</span></div>}
            </div>
          ))}
          {policies?.length===0&&<div className="card p-8 text-center text-gray-400 text-sm">No policies yet</div>}
        </div>
      </div>
    </div>
  )
}
