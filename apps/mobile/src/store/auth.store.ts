import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User { id:string; name:string; phone:string; email?:string|null; role:string; county?:string|null }

interface AuthState {
  user: User | null; accessToken: string | null; isAuthenticated: boolean; isLoading: boolean
  setAuth: (user:User, token:string, refresh:string) => Promise<void>
  logout: () => Promise<void>
  load: () => Promise<void>
}

export const useAuthStore = create<AuthState>(set => ({
  user: null, accessToken: null, isAuthenticated: false, isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([['token',accessToken],['refresh',refreshToken],['user',JSON.stringify(user)]])
    set({ user, accessToken, isAuthenticated: true })
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token','refresh','user'])
    set({ user:null, accessToken:null, isAuthenticated:false })
  },

  load: async () => {
    try {
      const [[,token],[,userStr]] = await AsyncStorage.multiGet(['token','user'])
      if (token && userStr) set({ accessToken:token, user:JSON.parse(userStr), isAuthenticated:true })
    } finally { set({ isLoading:false }) }
  },
}))
