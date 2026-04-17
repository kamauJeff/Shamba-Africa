import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

const api = axios.create({ baseURL:BASE, timeout:15000, headers:{'Content-Type':'application/json'} })

api.interceptors.request.use(async cfg => {
  const t = await AsyncStorage.getItem('accessToken')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status !== 401 || orig._retry) return Promise.reject(err)
  orig._retry = true
  try {
    const rt = await AsyncStorage.getItem('refreshToken')
    if (!rt) throw new Error('no refresh token')
    const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt })
    const newToken = data.data.tokens.accessToken
    await AsyncStorage.setItem('accessToken', newToken)
    orig.headers.Authorization = `Bearer ${newToken}`
    return api(orig)
  } catch {
    await AsyncStorage.multiRemove(['accessToken','refreshToken','user'])
    return Promise.reject(err)
  }
})

export default api
