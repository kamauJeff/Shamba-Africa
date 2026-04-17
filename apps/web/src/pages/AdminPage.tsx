import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useAdminRevenue, useAdminUsers, useAdminLoans, useApproveAdminLoan } from '@/hooks/useApi'
import { formatKes, formatDate, loanStatusBadge } from '@/lib/utils'

const COLORS = ['#15a552','#d97706','#2563eb','#9333ea','#ef4444']

export default function AdminPage() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useAdminRevenue(days)
  const { data: users } = useAdminUsers({ pageSize:10 })
  const { data: loans } = useAdminLoans({ pageSize:20 })
  const approveL = useApproveAdminLoan()

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="skeleton h-32 rounded-2xl"/>)}</div>
  if (!data) return null

  const { revenue, platform, volume, trend } = data
  const pieData = [
    { name:'Loan interest', value:revenue.loanInterest },
    { name:'Origination', value:revenue.originationFees },
    { name:'Late fees', value:revenue.lateFees },
    { name:'Insurance', value:revenue.insuranceCommission },
    { name:'Marketplace', value:revenue.marketplaceCommission },
  ]

  return (
    <div className="page-fade space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="font-display text-2xl font-semibold">Revenue Dashboard</h1><p className="text-gray-500 text-sm mt-1">Platform P&L and operational metrics</p></div>
        <select className="input w-auto" value={days} onChange={e=>setDays(Number(e.target.value))}>
          {[7,14,30,90].map(d=><option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="xl:col-span-2 rounded-2xl bg-shamba-600 p-5 text-white">
          <p className="text-sm text-shamba-200">Total revenue</p>
          <p className="text-3xl font-bold mt-1">{formatKes(revenue.total)}</p>
        </div>
        {[['Loan interest',revenue.loanInterest,'shamba'],['Insurance',revenue.insuranceCommission,'blue'],['Marketplace',revenue.marketplaceCommission,'purple'],['Orig. fees',revenue.originationFees,'amber']].map(([l,v,c])=>(
          <div key={l as string} className={`card p-4`}><p className="text-xs text-gray-500">{l}</p><p className={`text-xl font-bold text-${c}-700 mt-0.5`}>{formatKes(Number(v))}</p></div>
        ))}
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[['Total farmers',platform.totalUsers,''],['Active loans',platform.activeLoans,'text-shamba-700'],['Active policies',platform.activePolicies,'text-blue-700'],['Loan book',formatKes(volume.totalLoansKes),'text-amber-700'],['Repayment rate',`${platform.repaymentRatePct}%`,platform.repaymentRatePct>=90?'text-shamba-700':platform.repaymentRatePct>=75?'text-amber-700':'text-red-700']].map(([l,v,c])=>(
          <div key={l as string} className="card p-4"><p className="text-xs text-gray-500">{l}</p><p className={`text-xl font-bold mt-0.5 ${c}`}>{v}</p></div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5"><h3 className="font-semibold mb-4">Revenue trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend?.map((t:any)=>({date:new Date(t.date).toLocaleDateString('en-KE',{month:'short',day:'numeric'}),rev:Math.round(t.revenueKes)}))||[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/><Tooltip formatter={(v:any)=>[`KES ${v.toLocaleString()}`,'Revenue']}/><Line type="monotone" dataKey="rev" stroke="#15a552" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5"><h3 className="font-semibold mb-4">Revenue mix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v:any)=>`KES ${v.toLocaleString()}`}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loan portfolio */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between"><h3 className="font-semibold">Loan portfolio</h3><span className="text-sm text-gray-400">{loans?.total ?? 0} total</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500"><tr>{['Farmer','Amount','Purpose','Rate','Status','Applied','Action'].map(h=><th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loans?.items?.map((l:any)=>(
              <tr key={l.id}>
                <td className="px-4 py-3"><p className="font-medium">{l.user?.name}</p><p className="text-xs text-gray-400">{l.user?.phone}</p></td>
                <td className="px-4 py-3 font-semibold text-shamba-700">{formatKes(l.principalKes)}</td>
                <td className="px-4 py-3 text-gray-500">{l.purpose.replace('_',' ')}</td>
                <td className="px-4 py-3">{l.interestRatePct}%</td>
                <td className="px-4 py-3"><span className={loanStatusBadge(l.status)}>{l.status}</span></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(l.createdAt)}</td>
                <td className="px-4 py-3">
                  {l.status==='PENDING'&&<button onClick={()=>approveL.mutate({id:l.id})} className="btn-primary py-1 px-3 text-xs">Approve</button>}
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>

      {/* Users */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50"><h3 className="font-semibold">Recent users</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500"><tr>{['Name','Phone','Role','County','Joined'].map(h=><th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {users?.items?.map((u:any)=>(
              <tr key={u.id}><td className="px-4 py-3 font-medium">{u.name}</td><td className="px-4 py-3 text-gray-500">{u.phone}</td><td className="px-4 py-3"><span className={u.role==='ADMIN'?'badge-red':'badge-green'}>{u.role}</span></td><td className="px-4 py-3 text-gray-400">{u.county??'—'}</td><td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td></tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}
