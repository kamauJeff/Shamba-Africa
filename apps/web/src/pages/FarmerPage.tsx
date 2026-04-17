import { useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useProfile, useUpsertProfile, useCreditScore, useRefreshCredit, useCreditHistory } from '@/hooks/useApi'
import { KENYA_COUNTIES, CROPS } from '@shamba/shared'
import { formatKes, formatDate, creditBadge, scorePercent } from '@/lib/utils'

const SOILS = ['LOAM','CLAY','SANDY','SILT','CLAY_LOAM','SANDY_LOAM','PEAT','CHALK']
const IRRIGATION = ['NONE','DRIP','SPRINKLER','FLOOD','FURROW']

export default function FarmerPage() {
  const { data, isLoading } = useProfile()
  const { data: credit } = useCreditScore()
  const { data: history } = useCreditHistory()
  const upsert = useUpsertProfile()
  const refresh = useRefreshCredit()
  const [form, setForm] = useState<any>(null)
  const [editing, setEditing] = useState(false)

  const profile = data?.profile
  const pct = credit ? scorePercent(credit.score) : 0
  const color = !credit ? '#9ca3af' : credit.score < 500 ? '#ef4444' : credit.score < 600 ? '#f59e0b' : '#15a552'

  function startEdit() { setForm({ ...profile }); setEditing(true) }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    await upsert.mutateAsync(form)
    setEditing(false)
  }

  const histChart = history?.map((h: any) => ({ date: formatDate(h.computedAt), score: h.score })).reverse() ?? []

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  return (
    <div className="page-fade space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="font-display text-2xl font-semibold">Farmer 360° Profile</h1><p className="text-gray-500 text-sm mt-1">Your profile determines your credit score and loan eligibility</p></div>
        <button onClick={() => refresh.mutate()} disabled={refresh.isPending} className="btn-outline gap-2">
          <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />Refresh score
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score */}
        <div className="card p-6 text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width={160} height={160}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="90%" startAngle={210} endAngle={-30} data={[{ value: pct, fill: color }]}>
                <RadialBar dataKey="value" cornerRadius={5} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute text-center"><div className="text-3xl font-bold">{credit?.score ?? '—'}</div><div className="text-xs text-gray-400">/ 850</div></div>
          </div>
          {credit && <span className={creditBadge(credit.rating)}>{credit.rating.replace('_',' ')}</span>}
          {credit?.eligible ? (
            <div className="rounded-xl bg-shamba-50 p-3"><p className="text-xs text-shamba-600">Max loan</p><p className="text-xl font-bold text-shamba-700">{formatKes(credit.maxLoanKes)}</p></div>
          ) : (
            <div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-600">Score ≥ 500 required for loans</p></div>
          )}
          {credit?.computedAt && <p className="text-xs text-gray-400">Computed {formatDate(credit.computedAt)}</p>}
        </div>

        {/* Breakdown */}
        {credit && (
          <div className="lg:col-span-2 card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Score breakdown</h2>
            {[
              { label:'Repayment history (40%)', score: credit.repaymentScore ?? 0, max: 220 },
              { label:'Yield consistency (20%)',  score: credit.yieldScore ?? 0,      max: 110 },
              { label:'Profile completeness (15%)', score: credit.completenessScore ?? 0, max: 82 },
              { label:'Loan usage (15%)',           score: credit.loanUsageScore ?? 0,    max: 82 },
              { label:'Market activity (10%)',      score: credit.marketActivityScore ?? 0, max: 55 },
            ].map(f => {
              const p = Math.round((f.score/f.max)*100)
              const c = p>=70 ? 'bg-shamba-500' : p>=40 ? 'bg-amber-400' : 'bg-red-400'
              return (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">{f.label}</span><span className="text-gray-400">{f.score}/{f.max}</span></div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${c}`} style={{ width:`${p}%` }} /></div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History chart */}
      {histChart.length > 1 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Credit score history</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={histChart}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" tick={{ fontSize:11 }} /><YAxis domain={[300,850]} tick={{ fontSize:11 }} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#15a552" strokeWidth={2} dot={{ r:4 }} /></LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Profile form */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Farm profile</h2>
          {!editing ? (
            <button onClick={startEdit} className="btn-outline text-xs py-1.5 px-3">Edit profile</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
              <button onClick={save} disabled={upsert.isPending} className="btn-primary text-xs py-1.5 px-3 gap-1">
                <Save className="h-3 w-3" />{upsert.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              ['Farm size', profile?.farmSizeAcres ? `${profile.farmSizeAcres} acres` : '—'],
              ['Primary crop', profile?.primaryCrop ?? '—'],
              ['County', profile?.county ?? '—'],
              ['Sub-county', profile?.subCounty ?? '—'],
              ['Soil type', profile?.soilType?.replace('_',' ') ?? '—'],
              ['Irrigation', profile?.irrigationType ?? '—'],
              ['Years farming', profile?.yearsFarming ?? '—'],
              ['Last yield', profile?.previousYieldKg ? `${profile.previousYieldKg} kg` : '—'],
              ['Has storage', profile?.hasStorage ? 'Yes' : 'No'],
              ['National ID', profile?.nationalId ? '••••••••' : '—'],
              ['KRA PIN', profile?.kraPin ? '••••••••' : '—'],
              ['Profile score', `${Math.round(profile?.completenessScore ?? 0)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        ) : form && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { k:'farmSizeAcres', label:'Farm size (acres)', type:'number' },
              { k:'yearsFarming',  label:'Years farming',    type:'number' },
              { k:'previousYieldKg', label:'Last yield (kg)',type:'number' },
            ].map(({ k, label, type }) => (
              <div key={k}><label className="label">{label}</label>
                <input type={type} className="input" value={form[k]??''} onChange={e => setForm({...form,[k]:Number(e.target.value)})} /></div>
            ))}
            <div><label className="label">Primary crop</label>
              <select className="input" value={form.primaryCrop??''} onChange={e => setForm({...form,primaryCrop:e.target.value})}>
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="label">County</label>
              <select className="input" value={form.county??''} onChange={e => setForm({...form,county:e.target.value})}>
                {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="label">Sub-county</label><input className="input" value={form.subCounty??''} onChange={e => setForm({...form,subCounty:e.target.value})} /></div>
            <div><label className="label">Soil type</label>
              <select className="input" value={form.soilType??'LOAM'} onChange={e => setForm({...form,soilType:e.target.value})}>
                {SOILS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select></div>
            <div><label className="label">Irrigation</label>
              <select className="input" value={form.irrigationType??'NONE'} onChange={e => setForm({...form,irrigationType:e.target.value})}>
                {IRRIGATION.map(i => <option key={i} value={i}>{i}</option>)}
              </select></div>
            <div><label className="label">National ID</label><input className="input" value={form.nationalId??''} onChange={e => setForm({...form,nationalId:e.target.value})} /></div>
            <div><label className="label">KRA PIN</label><input className="input" value={form.kraPin??''} onChange={e => setForm({...form,kraPin:e.target.value})} /></div>
            <div className="flex items-center gap-2 mt-4 col-span-2 sm:col-span-1"><input type="checkbox" id="storage" checked={form.hasStorage??false} onChange={e => setForm({...form,hasStorage:e.target.checked})} className="h-4 w-4 rounded text-shamba-600" /><label htmlFor="storage" className="text-sm text-gray-700">Has on-farm storage</label></div>
          </div>
        )}
      </div>
    </div>
  )
}
