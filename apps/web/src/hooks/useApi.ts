import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

// ─── Auth ──────────────────────────────────────────────────────
export const useMe = () => useQuery({ queryKey:['me'], queryFn: () => api.get('/auth/me').then(r=>r.data.data) })

// ─── Farmer ────────────────────────────────────────────────────
export const useDashboard = () => useQuery({ queryKey:['dashboard'], queryFn: () => api.get('/farmer/dashboard').then(r=>r.data.data) })
export const useProfile   = () => useQuery({ queryKey:['profile'],   queryFn: () => api.get('/farmer/profile').then(r=>r.data.data) })
export const useCreditScore = () => useQuery({ queryKey:['credit'],  queryFn: () => api.get('/farmer/credit').then(r=>r.data.data) })
export const useCreditHistory = () => useQuery({ queryKey:['credit-history'], queryFn: () => api.get('/farmer/credit/history').then(r=>r.data.data) })
export const useYieldHistory = () => useQuery({ queryKey:['yield-history'], queryFn: () => api.get('/farmer/yield-history').then(r=>r.data.data) })

export const useUpsertProfile = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.put('/farmer/profile',d).then(r=>r.data), onSuccess: () => { qc.invalidateQueries({queryKey:['profile']}); qc.invalidateQueries({queryKey:['dashboard']}) } })
}
export const useRefreshCredit = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => api.post('/farmer/credit/refresh').then(r=>r.data), onSuccess: () => qc.invalidateQueries({queryKey:['credit']}) })
}

// ─── Loans ─────────────────────────────────────────────────────
export const useLoans = () => useQuery({ queryKey:['loans'], queryFn: () => api.get('/loans').then(r=>r.data.data) })
export const useLoan  = (id:string) => useQuery({ queryKey:['loans',id], queryFn: () => api.get(`/loans/${id}`).then(r=>r.data.data), enabled:!!id })
export const useApplyLoan = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.post('/loans/apply',d).then(r=>r.data), onSuccess: () => { qc.invalidateQueries({queryKey:['loans']}); qc.invalidateQueries({queryKey:['credit']}) } })
}
export const useRepayLoan = (id:string) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.post(`/loans/${id}/repay`,d).then(r=>r.data), onSuccess: () => qc.invalidateQueries({queryKey:['loans']}) })
}

// ─── Insurance ─────────────────────────────────────────────────
export const usePolicies   = () => useQuery({ queryKey:['policies'],   queryFn: () => api.get('/insurance').then(r=>r.data.data) })
export const useThresholds = () => useQuery({ queryKey:['thresholds'], queryFn: () => api.get('/insurance/thresholds').then(r=>r.data.data), staleTime:Infinity })
export const useCreatePolicy = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.post('/insurance',d).then(r=>r.data), onSuccess: () => qc.invalidateQueries({queryKey:['policies']}) })
}

// ─── Market ────────────────────────────────────────────────────
export const useListings    = (p?:any) => useQuery({ queryKey:['listings',p],  queryFn: () => api.get('/market/listings',{params:p}).then(r=>r.data.data), staleTime:2*60*1000 })
export const useMyListings  = () => useQuery({ queryKey:['my-listings'],        queryFn: () => api.get('/market/listings/mine').then(r=>r.data.data) })
export const useListing     = (id:string) => useQuery({ queryKey:['listings',id], queryFn: () => api.get(`/market/listings/${id}`).then(r=>r.data.data), enabled:!!id })
export const usePrices      = (p?:any) => useQuery({ queryKey:['prices',p],    queryFn: () => api.get('/market/prices',{params:p}).then(r=>r.data.data), staleTime:5*60*1000 })
export const useOrders      = (role?:string) => useQuery({ queryKey:['orders',role], queryFn: () => api.get('/market/orders',{params:{role}}).then(r=>r.data.data) })
export const useCreateListing = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.post('/market/listings',d).then(r=>r.data), onSuccess: () => qc.invalidateQueries({queryKey:['my-listings']}) })
}
export const usePlaceOrder = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.post('/market/orders',d).then(r=>r.data), onSuccess: () => qc.invalidateQueries({queryKey:['orders']}) })
}
export const useConfirmDelivery = (id:string) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => api.post(`/market/orders/${id}/confirm-delivery`).then(r=>r.data), onSuccess: () => { qc.invalidateQueries({queryKey:['orders']}); qc.invalidateQueries({queryKey:['wallet']}) } })
}

// ─── Wallet ────────────────────────────────────────────────────
export const useWallet   = () => useQuery({ queryKey:['wallet'], queryFn: () => api.get('/wallet').then(r=>r.data.data) })
export const useWithdraw = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d:any) => api.post('/wallet/withdraw',d).then(r=>r.data), onSuccess: () => qc.invalidateQueries({queryKey:['wallet']}) })
}

// ─── Weather ───────────────────────────────────────────────────
export const useFarmerWeather = () => useQuery({ queryKey:['weather'], queryFn: () => api.get('/weather/my-farm').then(r=>r.data.data), staleTime:30*60*1000 })
export const useCountyWeather = (c:string) => useQuery({ queryKey:['weather',c], queryFn: () => api.get(`/weather/county/${c}`).then(r=>r.data.data), enabled:!!c, staleTime:30*60*1000 })

// ─── Predict ───────────────────────────────────────────────────
export const usePredict = () => useMutation({ mutationFn: (d:any) => api.post('/predict',d).then(r=>r.data.data) })
export const usePredictHistory = () => useQuery({ queryKey:['predict-history'], queryFn: () => api.get('/predict/history').then(r=>r.data.data) })

// ─── Groups ────────────────────────────────────────────────────
export const useGroups     = (p?:any) => useQuery({ queryKey:['groups',p],   queryFn: () => api.get('/groups',{params:p}).then(r=>r.data.data) })
export const useMyGroups   = () => useQuery({ queryKey:['my-groups'],         queryFn: () => api.get('/groups/mine').then(r=>r.data.data) })
export const useGroup      = (id:string) => useQuery({ queryKey:['groups',id], queryFn: () => api.get(`/groups/${id}`).then(r=>r.data.data), enabled:!!id })
export const useJoinGroup  = (id:string) => { const qc=useQueryClient(); return useMutation({ mutationFn: () => api.post(`/groups/${id}/join`).then(r=>r.data), onSuccess:()=>{ qc.invalidateQueries({queryKey:['groups']}); qc.invalidateQueries({queryKey:['my-groups']}) } }) }
export const useContribute = (id:string) => { const qc=useQueryClient(); return useMutation({ mutationFn:(d:any)=>api.post(`/groups/${id}/contribute`,d).then(r=>r.data), onSuccess:()=>qc.invalidateQueries({queryKey:['groups',id]}) }) }

// ─── Supply ────────────────────────────────────────────────────
export const useSupply     = (p?:any) => useQuery({ queryKey:['supply',p],   queryFn: () => api.get('/supply',{params:p}).then(r=>r.data.data) })
export const useStakeholder= (id:string) => useQuery({ queryKey:['supply',id], queryFn: () => api.get(`/supply/${id}`).then(r=>r.data.data), enabled:!!id })

// ─── Admin ─────────────────────────────────────────────────────
export const useAdminRevenue  = (days?:number) => useQuery({ queryKey:['admin-revenue',days], queryFn: () => api.get('/admin/revenue',{params:{days}}).then(r=>r.data.data) })
export const useAdminUsers    = (p?:any) => useQuery({ queryKey:['admin-users',p], queryFn: () => api.get('/admin/users',{params:p}).then(r=>r.data.data) })
export const useAdminLoans    = (p?:any) => useQuery({ queryKey:['admin-loans',p], queryFn: () => api.get('/admin/loans',{params:p}).then(r=>r.data.data) })
export const useApproveAdminLoan = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(d:any)=>api.post(`/admin/loans/${d.id}/approve`,d).then(r=>r.data), onSuccess:()=>qc.invalidateQueries({queryKey:['admin-loans']}) }) }
