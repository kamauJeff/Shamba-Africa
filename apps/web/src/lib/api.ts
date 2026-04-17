import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

let refreshing = false
let queue: Array<{ resolve:(t:string)=>void; reject:(e:unknown)=>void }> = []

api.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status !== 401 || orig._retry) return Promise.reject(err)

  if (refreshing) {
    return new Promise((resolve, reject) => queue.push({ resolve, reject }))
      .then(t => { orig.headers.Authorization = `Bearer ${t}`; return api(orig) })
  }

  orig._retry = true; refreshing = true
  try {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL ?? '/api/v1'}/auth/refresh`, {}, { withCredentials: true })
    const token = data.data.tokens.accessToken
    localStorage.setItem('accessToken', token)
    queue.forEach(q => q.resolve(token)); queue = []
    orig.headers.Authorization = `Bearer ${token}`
    return api(orig)
  } catch (e) {
    queue.forEach(q => q.reject(e)); queue = []
    localStorage.removeItem('accessToken')
    window.location.href = '/login'
    return Promise.reject(e)
  } finally { refreshing = false }
})

export default api
