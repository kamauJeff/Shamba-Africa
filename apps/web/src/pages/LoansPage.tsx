import { useState } from 'react'
import { Loader2, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle, Ticket } from 'lucide-react'
import { useLoans, useApplyLoan, useCreditScore } from '@/hooks/useApi'
import { formatKes, formatDate, loanStatusBadge } from '@/lib/utils'

const PURPOSES = ['SEEDS','FERTILIZER','PESTICIDES','EQUIPMENT','IRRIGATION','LABOR','STORAGE','OTHER']

function LoanCard({ loan }: { loan: any }) {
  const [open, setOpen] = useState(false)
  const paid = loan.repayments?.filter((r: any) => r.status === 'PAID').length ?? 0
  const total = loan.repayments?.length ?? 0
  return (
    <div className="card overflow-hidden">
      <button className="w-full flex items-start gap-4 p-5 text-left" onClick={() => setOpen(!open)}>
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <span className="text-amber-700 font-bold text-lg">₭</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{formatKes(loan.principalKes)}</span>
            <span className={loanStatusBadge(loan.status)}>{loan.status}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{loan.purpose.replace('_',' ')} · {loan.interestRatePct}% p.a. · {loan.termMonths} months</p>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 max-w-32 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-shamba-500 rounded-full" style={{ width:`${(paid/total)*100}%` }} />
              </div>
              <span className="text-xs text-gray-400">{paid}/{total} paid</span>
            </div>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />}
      </button>
      {open && (
        <div className="border-t border-gray-50 px-5 pb-5 space-y-4">
          {loan.vouchers?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Input Vouchers</p>
              {loan.vouchers.map((v: any) => (
                <div key={v.id} className={`rounded-xl border-2 p-3 ${v.status==='ISSUED'?'border-shamba-300 bg-shamba-50':'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1"><Ticket className="h-4 w-4 text-shamba-600" /><span className="text-xs font-bold uppercase text-shamba-700">Input Voucher · {v.status}</span></div>
                  <p className="text-xl font-bold text-gray-900">{formatKes(v.amountKes)}</p>
                  <p className="font-mono text-shamba-700 font-semibold text-lg">{v.code}</p>
                  {v.dealerName && <p className="text-xs text-gray-500 mt-1">Dealer: {v.dealerName}</p>}
                  <p className="text-xs text-gray-400">Expires {formatDate(v.expiresAt)}</p>
                </div>
              ))}
            </div>
          )}
          {loan.repayments?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Repayment schedule</p>
              <div className="space-y-1.5">
                {loan.repayments.map((r: any, i: number) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                    {r.status==='PAID' ? <CheckCircle2 className="h-4 w-4 text-shamba-600" /> : r.status==='LATE' ? <AlertCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                    <div className="flex-1"><p className="text-sm font-medium">Instalment {i+1}</p><p className="text-xs text-gray-400">{formatDate(r.dueDate)}</p></div>
                    <span className={`text-sm font-bold ${r.status==='PAID'?'text-gray-400 line-through':'text-gray-900'}`}>{formatKes(r.amountDueKes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans()
  const { data: credit } = useCreditScore()
  const applyLoan = useApplyLoan()
  const [form, setForm] = useState({ principalKes:'', termMonths:'6', purpose:'SEEDS', purposeDetails:'' })
  const [error, setError] = useState('')
  const hasActive = loans?.some((l: any) => ['PENDING','APPROVED','ACTIVE'].includes(l.status))

  const rate = { POOR:0,FAIR:18,GOOD:15,VERY_GOOD:13,EXCELLENT:11 }[credit?.rating??'']??15
  const principal = Number(form.principalKes)||0
  const months = Number(form.termMonths)||6
  const mr = rate/100/12
  const emi = mr===0 ? principal/months : (principal*mr*Math.pow(1+mr,months))/(Math.pow(1+mr,months)-1)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    try {
      await applyLoan.mutateAsync({ principalKes:Number(form.principalKes), termMonths:Number(form.termMonths), purpose:form.purpose, purposeDetails:form.purposeDetails||undefined })
      setForm({ principalKes:'', termMonths:'6', purpose:'SEEDS', purposeDetails:'' })
    } catch (err: any) { setError(err.response?.data?.error ?? 'Application failed') }
  }

  return (
    <div className="page-fade space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">Input Financing</h1><p className="text-gray-500 text-sm mt-1">Low-interest loans disbursed as agro-dealer vouchers</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apply form */}
        {!hasActive && credit?.eligible ? (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Apply for input loan</h2>
            {error && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Amount (KES)</label>
                  <input type="number" className="input" placeholder={`Max: ${formatKes(credit.maxLoanKes)}`} value={form.principalKes} onChange={e => setForm({...form,principalKes:e.target.value})} required min="1000" max={credit.maxLoanKes} /></div>
                <div><label className="label">Term</label>
                  <select className="input" value={form.termMonths} onChange={e => setForm({...form,termMonths:e.target.value})}>
                    {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{m} months</option>)}
                  </select></div>
              </div>
              <div><label className="label">Purpose</label>
                <select className="input" value={form.purpose} onChange={e => setForm({...form,purpose:e.target.value})}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p.replace('_',' ')}</option>)}
                </select></div>
              {principal > 0 && (
                <div className="rounded-xl bg-shamba-50 border border-shamba-100 p-4 grid grid-cols-3 gap-3 text-center text-sm">
                  <div><p className="text-xs text-shamba-600">Rate</p><p className="font-bold text-shamba-800">{rate}% p.a.</p></div>
                  <div><p className="text-xs text-shamba-600">Monthly EMI</p><p className="font-bold text-shamba-800">{formatKes(Math.round(emi))}</p></div>
                  <div><p className="text-xs text-shamba-600">Total</p><p className="font-bold text-shamba-800">{formatKes(Math.round(emi*months))}</p></div>
                </div>
              )}
              <button type="submit" disabled={applyLoan.isPending} className="btn-primary w-full justify-center py-3">
                {applyLoan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {applyLoan.isPending ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>
        ) : hasActive ? (
          <div className="card p-6 flex items-center gap-3 text-amber-800 bg-amber-50 border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <div><p className="font-semibold">Active loan in progress</p><p className="text-sm mt-0.5">Repay your current loan before applying for a new one.</p></div>
          </div>
        ) : (
          <div className="card p-8 text-center"><p className="text-gray-500">Complete your farmer profile to get a credit score and unlock loans.</p></div>
        )}

        {/* Loans list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Your loans</h2>
          {isLoading && [1,2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          {!isLoading && loans?.length === 0 && <div className="card p-8 text-center text-gray-400 text-sm">No loans yet</div>}
          {loans?.map((l: any) => <LoanCard key={l.id} loan={l} />)}
        </div>
      </div>
    </div>
  )
}
