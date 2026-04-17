import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '@/store/auth.store'

const qc = new QueryClient({ defaultOptions: { queries: { retry:1, staleTime:5*60*1000, refetchOnWindowFocus:false } } })

function Nav() {
  const { isAuthenticated, isLoading, load } = useAuthStore()
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!isLoading) router.replace(isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login')
  }, [isAuthenticated, isLoading])
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={qc}>
      <StatusBar style="light" />
      <Nav />
    </QueryClientProvider>
  )
}
