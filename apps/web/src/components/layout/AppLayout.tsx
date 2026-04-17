import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, User, Landmark, Shield, ShoppingBag,
  Wallet, Cloud, Sprout, Users, Truck, BarChart3,
  Menu, X, Leaf, LogOut, ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const NAV = [
  { to:'/dashboard', label:'Dashboard',   icon:LayoutDashboard },
  { to:'/farmer',    label:'My Profile',  icon:User },
  { to:'/predict',   label:'AI Predict',  icon:Sprout },
  { to:'/weather',   label:'Weather',     icon:Cloud },
  { to:'/market',    label:'Marketplace', icon:ShoppingBag },
  { to:'/loans',     label:'Loans',       icon:Landmark },
  { to:'/insurance', label:'Insurance',   icon:Shield },
  { to:'/wallet',    label:'Wallet',      icon:Wallet },
  { to:'/groups',    label:'Groups',      icon:Users },
  { to:'/supply',    label:'Supply Chain',icon:Truck },
]

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => {})
    logout()
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-gray-100 transition-transform duration-200 lg:static lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-shamba-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-display text-xl font-semibold text-shamba-800">Shamba</span>
          <span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-shamba-500/70">Africa</span>
        </div>
        <button onClick={() => setOpen(false)} className="ml-auto lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-shamba-50 text-shamba-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors mt-2 border-t border-gray-100 pt-4',
              isActive ? 'bg-shamba-50 text-shamba-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}>
            <BarChart3 className="h-4 w-4 shrink-0" />
            Admin
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-shamba-100 text-shamba-700 text-sm font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <LogOut className="h-4 w-4" />Log out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-earth-50">
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-3 border-b border-gray-100 bg-white px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-shamba-600" />
            <span className="font-display font-semibold text-shamba-800">Shamba</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
