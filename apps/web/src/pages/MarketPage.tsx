import { useState } from 'react'
import { Search, Plus, MapPin, Scale, Star, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useListings, useMyListings, useOrders, useCreateListing, usePlaceOrder, useConfirmDelivery, usePrices } from '@/hooks/useApi'
import { formatKes, formatDate, orderStatusBadge } from '@/lib/utils'
import { CROPS } from '@shamba/shared'

const GRADES = ['A','B','C','ORGANIC','EXPORT']

function ListingCard({ listing, onOrder }: { listing: any; onOrder: () => void }) {
  const days = Math.ceil((new Date(listing.availableUntil).getTime()-Date.now())/86400000)
  return (
    <div className="card-hover p-5">
      <div className="flex justify-between items-start mb-3">
        <div><h3 className="font-semibold text-gray-900">{listing.cropName}{listing.variety?` · ${listing.variety}`:''}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="badge-gray flex items-center gap-1"><MapPin className="h-2.5 w-2.5"/>{listing.county}</span>
            <span className="badge-gray flex items-center gap-1"><Scale className="h-2.5 w-2.5"/>{listing.quantityKg.toLocaleString()}kg</span>
            <span className={`badge-${listing.grade==='EXPORT'?'blue':'green'}`}>{listing.grade}</span>
          </div>
        </div>
        <div className="text-right shrink-0"><p className="text-lg font-bold text-shamba-700">{formatKes(listing.pricePerKgKes)}</p><p className="text-xs text-gray-400">/kg</p></div>
      </div>
      {listing.description&&<p className="text-xs text-gray-500 mb-3 line-clamp-2">{listing.description}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {listing.seller?.isVerified&&<Star className="h-3 w-3 text-amber-500 fill-amber-500"/>}
          <span className="text-xs text-gray-400">{listing.seller?.name}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className={`text-xs font-medium ${days<7?'text-red-500':'text-gray-400'}`}>{days}d left</span>
        </div>
        <button onClick={onOrder} className="btn-primary py-1.5 px-3 text-xs">Order</button>
      </div>
    </div>
  )
}

export default function MarketPage() {
  const [tab, setTab] = useState<'browse'|'sell'|'orders'|'prices'>('browse')
  const [search, setSearch] = useState('')
  const [orderFor, setOrderFor] = useState<any>(null)
  const [orderQty, setOrderQty] = useState('')
  const [orderAddr, setOrderAddr] = useState('')

  const { data, isLoading } = useListings({ crop: search||undefined, pageSize:20 })
  const { data: myListings } = useMyListings()
  const { data: orders } = useOrders()
  const { data: prices } = usePrices({ pageSize:30 })
  const createListing = useCreateListing()
  const placeOrder = usePlaceOrder()

  const [lForm, setLForm] = useState({ cropName:'', quantityKg:'', pricePerKgKes:'', county:'', region:'', grade:'B', harvestDate:'', availableFrom:new Date().toISOString().slice(0,10), availableUntil:new Date(Date.now()+30*86400000).toISOString().slice(0,10), description:'', minimumOrderKg:'50' })

  async function submitListing(e: React.FormEvent) {
    e.preventDefault()
    await createListing.mutateAsync({ ...lForm, quantityKg:Number(lForm.quantityKg), pricePerKgKes:Number(lForm.pricePerKgKes), minimumOrderKg:Number(lForm.minimumOrderKg), harvestDate:new Date(lForm.harvestDate).toISOString(), availableFrom:new Date(lForm.availableFrom).toISOString(), availableUntil:new Date(lForm.availableUntil).toISOString() })
    setTab('sell')
  }

  async function submitOrder() {
    if (!orderFor || !orderQty) return
    await placeOrder.mutateAsync({ listingId:orderFor.id, quantityKg:Number(orderQty), deliveryAddress:orderAddr })
    setOrderFor(null); setOrderQty(''); setOrderAddr('')
  }

  const TABS = [['browse','Browse'],['sell','My Listings'],['orders','Orders'],['prices','Prices']]

  return (
    <div className="page-fade space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="font-display text-2xl font-semibold">B2B Marketplace</h1><p className="text-gray-500 text-sm mt-1">Connect directly with buyers · 7% commission on sales</p></div>
        {tab==='sell'&&<button onClick={()=>setTab('sell')} className="btn-primary"><Plus className="h-4 w-4"/>List produce</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===v?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab==='browse' && (
        <>
          <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/><input className="input pl-9" placeholder="Search crop…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-44 rounded-2xl"/>)}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items?.map((l:any)=><ListingCard key={l.id} listing={l} onOrder={()=>setOrderFor(l)}/>)}
          </div>
        </>
      )}

      {tab==='sell' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">List new produce</h2>
            <form onSubmit={submitListing} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><label className="label">Crop *</label><select className="input" value={lForm.cropName} onChange={e=>setLForm({...lForm,cropName:e.target.value})} required><option value="">Select</option>{CROPS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              {[['quantityKg','Quantity (kg)','number'],['pricePerKgKes','Price/kg (KES)','number'],['county','County','text'],['region','Region','text'],['minimumOrderKg','Min order (kg)','number']].map(([k,label,type])=>(
                <div key={k}><label className="label">{label}</label><input type={type} className="input" value={(lForm as any)[k]} onChange={e=>setLForm({...lForm,[k]:e.target.value})} required /></div>
              ))}
              <div><label className="label">Grade</label><select className="input" value={lForm.grade} onChange={e=>setLForm({...lForm,grade:e.target.value})}>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
              {[['harvestDate','Harvest date','date'],['availableFrom','Available from','date'],['availableUntil','Available until','date']].map(([k,label,type])=>(
                <div key={k}><label className="label">{label}</label><input type={type} className="input" value={(lForm as any)[k]} onChange={e=>setLForm({...lForm,[k]:e.target.value})} /></div>
              ))}
              <div className="col-span-2 sm:col-span-3"><label className="label">Description</label><input className="input" placeholder="Quality notes, certifications…" value={lForm.description} onChange={e=>setLForm({...lForm,description:e.target.value})} /></div>
              <button type="submit" disabled={createListing.isPending} className="btn-primary col-span-2 sm:col-span-1 justify-center">
                {createListing.isPending&&<Loader2 className="h-4 w-4 animate-spin"/>}Publish listing
              </button>
            </form>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myListings?.map((l:any)=><ListingCard key={l.id} listing={l} onOrder={()=>{}}/>)}
          </div>
        </div>
      )}

      {tab==='orders' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500"><tr>{['Crop','Qty','Total','Status','Date'].map(h=><th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {orders?.map((o:any)=>(
              <tr key={o.id}><td className="px-4 py-3 font-medium">{o.listing?.cropName}</td><td className="px-4 py-3 text-gray-500">{o.quantityKg}kg</td><td className="px-4 py-3 font-semibold text-shamba-700">{formatKes(o.totalAmountKes)}</td><td className="px-4 py-3"><span className={orderStatusBadge(o.status)}>{o.status}</span></td><td className="px-4 py-3 text-gray-400">{formatDate(o.createdAt)}</td></tr>
            ))}
          </tbody></table>
          {orders?.length===0&&<div className="py-8 text-center text-gray-400 text-sm">No orders yet</div>}
        </div>
      )}

      {tab==='prices' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500"><tr>{['Crop','County','Region','Price','Unit','Date'].map(h=><th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {prices?.items?.map((p:any)=>(
              <tr key={p.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{p.crop}</td><td className="px-4 py-3 text-gray-500">{p.county}</td><td className="px-4 py-3 text-gray-500">{p.region}</td><td className="px-4 py-3 font-bold text-shamba-700">{formatKes(p.priceKes)}</td><td className="px-4 py-3 text-gray-400">{p.unit}</td><td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.recordedAt)}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}

      {/* Order modal */}
      {orderFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <h3 className="font-semibold text-lg mb-1">Order {orderFor.cropName}</h3>
            <p className="text-sm text-gray-500 mb-4">Available: {orderFor.quantityKg.toLocaleString()}kg · Min: {orderFor.minimumOrderKg}kg</p>
            <div className="space-y-3">
              <div><label className="label">Quantity (kg)</label><input type="number" className="input" value={orderQty} onChange={e=>setOrderQty(e.target.value)} placeholder={`Min ${orderFor.minimumOrderKg}`} /></div>
              <div><label className="label">Delivery address</label><input className="input" value={orderAddr} onChange={e=>setOrderAddr(e.target.value)} placeholder="Where to deliver?" /></div>
              {orderQty && <div className="rounded-xl bg-gray-50 p-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatKes(Number(orderQty)*orderFor.pricePerKgKes)}</span></div><div className="flex justify-between"><span className="text-gray-500">Commission (7%)</span><span>{formatKes(Number(orderQty)*orderFor.pricePerKgKes*0.07)}</span></div></div>}
              <div className="flex gap-3"><button onClick={()=>setOrderFor(null)} className="btn-ghost flex-1">Cancel</button><button onClick={submitOrder} disabled={placeOrder.isPending||!orderQty} className="btn-primary flex-1 justify-center">{placeOrder.isPending&&<Loader2 className="h-4 w-4 animate-spin"/>}Place order</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
