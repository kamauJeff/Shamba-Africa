import { useState } from 'react'
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react'
import { useWallet, useWithdraw } from '@/hooks/useApi'
import { formatKes, formatDate, txIcon } from '@/lib/utils'

export default function WalletPage() {
  const { data } = useWallet()
  const withdraw = useWithdraw()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const wallet = data?.wallet
  const txs = data?.transactions ?? []

  return (
    <div className="page-fade space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">Shamba Wallet</h1><p className="text-gray-500 text-sm mt-1">Your earnings, payouts and transaction history</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[['Available',wallet?.balanceKes??0,'bg-shamba-600'],['In escrow',wallet?.escrowKes??0,'bg-blue-600'],['Total earned',wallet?.totalEarnedKes??0,'bg-amber-600']].map(([label,val,bg])=>(
          <div key={label as string} className={`${bg} rounded-2xl p-5 text-white`}><p className="text-sm opacity-80">{label}</p><p className="text-3xl font-bold mt-1">{formatKes(Number(val))}</p></div>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Withdraw to M-Pesa</h2>
        {error&&<div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <input type="number" className="input max-w-48" placeholder={`Max ${formatKes(wallet?.balanceKes??0)}`} value={amount} onChange={e=>setAmount(e.target.value)} />
          <button disabled={withdraw.isPending||!amount} onClick={async()=>{setError('');try{await withdraw.mutateAsync({amountKes:Number(amount)});setAmount('')}catch(err:any){setError(err.response?.data?.error??'Failed')}}} className="btn-primary gap-2">
            {withdraw.isPending&&<Loader2 className="h-4 w-4 animate-spin"/>}Withdraw
          </button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50"><h2 className="font-semibold">Transaction history</h2></div>
        <div className="divide-y divide-gray-50">
          {txs.map((tx:any)=>{
            const {positive}=txIcon(tx.type)
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${positive?'bg-shamba-100':'bg-red-50'}`}>
                  {positive?<ArrowDownCircle className="h-4 w-4 text-shamba-600"/>:<ArrowUpCircle className="h-4 w-4 text-red-500"/>}
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{tx.description??tx.type.replace(/_/g,' ')}</p><p className="text-xs text-gray-400">{formatDate(tx.createdAt)}{tx.reference?` · ${tx.reference.slice(0,12)}`:''}</p></div>
                <span className={`text-sm font-bold ${positive?'text-shamba-700':'text-red-600'}`}>{positive?'+':'-'}{formatKes(tx.amountKes)}</span>
              </div>
            )
          })}
          {txs.length===0&&<div className="py-8 text-center text-gray-400 text-sm">No transactions yet</div>}
        </div>
      </div>
    </div>
  )
}
