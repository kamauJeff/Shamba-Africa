import { MapPin, Sprout, CreditCard, TrendingUp, Wallet, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useDashboard, useCreditScore, usePrices } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth.store'
import { formatKes, formatDate, creditBadge, scorePercent } from '@/lib/utils'

function ScoreRing({ score }: { score: number }) {
  const pct = scorePercent(score)
  const color = score < 500 ? '#ef4444' : score < 600 ? '#f59e0b' : score < 700 ? '#eab308' : '#15a552'
  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="90%" startAngle={210} endAngle={-30} data={[{ value: pct, fill: color }]}>
          <RadialBar dataKey="value" cornerRadius={5} background={{ fill: '#f3f4f6' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-gray-900">{score}</div>
        <div className="text-xs text-gray-500">/ 850</div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'shamba', to }: any) {
  return (
    <div className="card-hover p-5 flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${color}-100 shrink-0`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {to && <Link to={to} className="ml-auto text-gray-300 hover:text-shamba-600 transition-colors"><ArrowRight className="h-4 w-4" /></Link>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useDashboard()
  const { data: credit } = useCreditScore()
  const { data: prices } = usePrices({ pageSize: 8 })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (isLoading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="page-fade space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your farm overview for today.</p>
        </div>
        <Link to="/predict" className="btn-primary hidden sm:flex">
          <Sprout className="h-4 w-4" />AI Predict
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet}     label="Wallet balance" value={formatKes(data?.wallet?.balanceKes ?? 0)} sub="Available" color="shamba" to="/wallet" />
        <StatCard icon={CreditCard} label="Credit score"   value={credit?.score ?? '—'} sub={credit?.rating?.replace('_',' ')} color="amber" to="/farmer" />
        <StatCard icon={TrendingUp} label="Total sales"    value={formatKes(data?.marketplace?.totalRevenue ?? 0)} sub={`${data?.marketplace?.completedSales ?? 0} sales`} color="blue" to="/market" />
        <StatCard icon={ShieldCheck}label="Insurance"      value={data?.insurance?.active ?? 0} sub={`${formatKes(data?.insurance?.totalCoverage ?? 0)} covered`} color="purple" to="/insurance" />
      </div>

      {/* Credit + prices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit card */}
        <div className="card p-6 flex flex-col items-center gap-4">
          {credit ? (
            <>
              <ScoreRing score={credit.score} />
              <span className={creditBadge(credit.rating)}>{credit.rating.replace('_',' ')}</span>
              <div className="w-full rounded-xl bg-shamba-50 p-4 text-center">
                <p className="text-xs text-shamba-600">Max loan eligibility</p>
                <p className="text-2xl font-bold text-shamba-700 mt-0.5">{formatKes(credit.maxLoanKes ?? 0)}</p>
              </div>
              <Link to="/loans" className="btn-primary w-full justify-center">Apply for loan</Link>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Complete your profile to get a credit score</p>
              <Link to="/farmer" className="btn-primary mt-4">Set up profile</Link>
            </div>
          )}
        </div>

        {/* Market prices */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Market prices today</h2>
            <Link to="/market" className="text-xs text-shamba-600 font-medium hover:text-shamba-700">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {prices?.items?.slice(0, 7).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.crop}</p>
                  <p className="text-xs text-gray-400">{p.county}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-shamba-700">{formatKes(p.priceKes)}</p>
                  <p className="text-xs text-gray-400">per {p.unit === 'KG' ? 'kg' : p.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to:'/loans',     label:'Apply Loan',    bg:'bg-shamba-600',  icon:Landmark },
          { to:'/insurance', label:'Get Insured',   bg:'bg-blue-600',    icon:ShieldCheck },
          { to:'/market',    label:'Sell Produce',  bg:'bg-amber-600',   icon:Sprout },
          { to:'/groups',    label:'Join Group',    bg:'bg-purple-600',  icon:TrendingUp },
        ].map(({ to, label, bg, icon: Icon }) => (
          <Link key={to} to={to}
            className={`${bg} flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity`}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Fix missing import
function Landmark({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" /></svg>
}
