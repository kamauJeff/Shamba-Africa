import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { farmerApi, loanApi, insuranceApi, marketApi, walletApi, weatherApi, predictApi, groupApi, supplyApi } from '../api/endpoints'

const qf = (key:any,fn:()=>Promise<any>,opts?:any) => useQuery({ queryKey:Array.isArray(key)?key:[key], queryFn:()=>fn().then(r=>r.data.data), ...opts })

export const useDashboard    = () => qf('dashboard',    farmerApi.dashboard)
export const useProfile      = () => qf('profile',      farmerApi.profile)
export const useCredit       = () => qf('credit',       farmerApi.credit)
export const useLoans        = () => qf('loans',        loanApi.list)
export const usePolicies     = () => qf('policies',     insuranceApi.list)
export const useThresholds   = () => qf('thresholds',   insuranceApi.thresholds, { staleTime:Infinity })
export const useListings     = (p?:any) => qf(['listings',p], ()=>marketApi.listings(p), { staleTime:2*60*1000 })
export const useMyListings   = () => qf('my-listings',  marketApi.myListings)
export const usePrices       = (p?:any) => qf(['prices',p], ()=>marketApi.prices(p), { staleTime:5*60*1000 })
export const useOrders       = (role?:string) => qf(['orders',role], ()=>marketApi.orders(role))
export const useWallet       = () => qf('wallet',       walletApi.get)
export const useFarmerWeather= () => qf('weather',      weatherApi.myFarm, { staleTime:30*60*1000 })
export const usePredictHistory = () => qf('pred-history', predictApi.history)
export const useGroups       = (p?:any) => qf(['groups',p], ()=>groupApi.list(p))
export const useMyGroups     = () => qf('my-groups',    groupApi.mine)
export const useSupply       = (p?:any) => qf(['supply',p], ()=>supplyApi.list(p))

const mut = (fn:any,invalidate?:string[]) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn:fn, onSuccess:()=>invalidate?.forEach(k=>qc.invalidateQueries({queryKey:[k]})) })
}

export const useUpsertProfile  = () => mut((d:any)=>farmerApi.upsert(d).then(r=>r.data), ['profile','dashboard'])
export const useRefreshCredit  = () => mut(()=>farmerApi.refreshCredit().then(r=>r.data), ['credit'])
export const useApplyLoan      = () => mut((d:any)=>loanApi.apply(d).then(r=>r.data), ['loans','credit'])
export const useRepayLoan      = () => mut(({id,...d}:any)=>loanApi.repay(id,d).then(r=>r.data), ['loans'])
export const useCreatePolicy   = () => mut((d:any)=>insuranceApi.create(d).then(r=>r.data), ['policies'])
export const useCreateListing  = () => mut((d:any)=>marketApi.create(d).then(r=>r.data), ['my-listings'])
export const usePlaceOrder     = () => mut((d:any)=>marketApi.order(d).then(r=>r.data), ['orders'])
export const useConfirmDelivery= () => mut((id:string)=>marketApi.confirm(id).then(r=>r.data), ['orders','wallet'])
export const useWithdraw       = () => mut((d:any)=>walletApi.withdraw(d).then(r=>r.data), ['wallet'])
export const usePredict        = () => useMutation({ mutationFn:(d:any)=>predictApi.predict(d).then(r=>r.data.data) })
export const useJoinGroup      = () => mut(({id}:{id:string})=>groupApi.join(id).then(r=>r.data), ['groups','my-groups'])
export const useContribute     = () => mut(({id,...d}:any)=>groupApi.contribute(id,d).then(r=>r.data), ['groups'])
