import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import FarmerPage from './pages/FarmerPage'
import LoansPage from './pages/LoansPage'
import InsurancePage from './pages/InsurancePage'
import MarketPage from './pages/MarketPage'
import WalletPage from './pages/WalletPage'
import WeatherPage from './pages/WeatherPage'
import PredictPage from './pages/PredictPage'
import GroupsPage from './pages/GroupsPage'
import SupplyPage from './pages/SupplyPage'
import AdminPage from './pages/AdminPage'

function Auth({ children }: { children: React.ReactNode }) {
  const ok = useAuthStore(s => s.isAuthenticated)
  return ok ? <>{children}</> : <Navigate to="/login" replace />
}
function Guest({ children }: { children: React.ReactNode }) {
  const ok = useAuthStore(s => s.isAuthenticated)
  return ok ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<Guest><LoginPage /></Guest>} />
      <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
      <Route element={<Auth><AppLayout /></Auth>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/farmer"    element={<FarmerPage />} />
        <Route path="/loans"     element={<LoansPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/market"    element={<MarketPage />} />
        <Route path="/wallet"    element={<WalletPage />} />
        <Route path="/weather"   element={<WeatherPage />} />
        <Route path="/predict"   element={<PredictPage />} />
        <Route path="/groups"    element={<GroupsPage />} />
        <Route path="/supply"    element={<SupplyPage />} />
        <Route path="/admin"     element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
