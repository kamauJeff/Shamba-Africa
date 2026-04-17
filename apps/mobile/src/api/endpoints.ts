import api from './client'

export const authApi = {
  register: (d:any) => api.post('/auth/register',d),
  login:    (d:any) => api.post('/auth/login',d),
  logout:   ()      => api.post('/auth/logout'),
  me:       ()      => api.get('/auth/me'),
}
export const farmerApi = {
  dashboard:    () => api.get('/farmer/dashboard'),
  profile:      () => api.get('/farmer/profile'),
  upsert:       (d:any) => api.put('/farmer/profile',d),
  credit:       () => api.get('/farmer/credit'),
  refreshCredit:() => api.post('/farmer/credit/refresh'),
}
export const loanApi = {
  list:  () => api.get('/loans'),
  get:   (id:string) => api.get(`/loans/${id}`),
  apply: (d:any) => api.post('/loans/apply',d),
  repay: (id:string,d:any) => api.post(`/loans/${id}/repay`,d),
}
export const insuranceApi = {
  list:       () => api.get('/insurance'),
  thresholds: () => api.get('/insurance/thresholds'),
  create:     (d:any) => api.post('/insurance',d),
}
export const marketApi = {
  listings:  (p?:any) => api.get('/market/listings',{params:p}),
  myListings:() => api.get('/market/listings/mine'),
  prices:    (p?:any) => api.get('/market/prices',{params:p}),
  orders:    (role?:string) => api.get('/market/orders',{params:{role}}),
  create:    (d:any) => api.post('/market/listings',d),
  order:     (d:any) => api.post('/market/orders',d),
  confirm:   (id:string) => api.post(`/market/orders/${id}/confirm-delivery`),
}
export const walletApi = {
  get:      () => api.get('/wallet'),
  withdraw: (d:any) => api.post('/wallet/withdraw',d),
}
export const weatherApi = {
  myFarm:       () => api.get('/weather/my-farm'),
  county:       (c:string) => api.get(`/weather/county/${c}`),
}
export const predictApi = {
  predict: (d:any) => api.post('/predict',d),
  history: () => api.get('/predict/history'),
}
export const groupApi = {
  list:       (p?:any) => api.get('/groups',{params:p}),
  mine:       () => api.get('/groups/mine'),
  get:        (id:string) => api.get(`/groups/${id}`),
  join:       (id:string) => api.post(`/groups/${id}/join`),
  contribute: (id:string,d:any) => api.post(`/groups/${id}/contribute`,d),
}
export const supplyApi = {
  list:  (p?:any) => api.get('/supply',{params:p}),
  get:   (id:string) => api.get(`/supply/${id}`),
}
