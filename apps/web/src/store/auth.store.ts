import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id:string; name:string; phone:string; email?:string|null; role:string; county?:string|null; isVerified:boolean; referralCode?:string }

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user:User, token:string) => void
  setToken: (token:string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(persist(
  set => ({
    user: null, accessToken: null, isAuthenticated: false,
    setAuth: (user, accessToken) => { localStorage.setItem('accessToken', accessToken); set({ user, accessToken, isAuthenticated:true }) },
    setToken: accessToken => { localStorage.setItem('accessToken', accessToken); set({ accessToken }) },
    logout: () => { localStorage.removeItem('accessToken'); set({ user:null, accessToken:null, isAuthenticated:false }) },
  }),
  { name:'shamba-auth', partialize: s => ({ user:s.user, accessToken:s.accessToken, isAuthenticated:s.isAuthenticated }) },
))
