import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Leaf } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { user, tokens } = res.data.data
      setAuth(user, tokens.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-shamba-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 30% 70%, #22c566 0%, transparent 60%), radial-gradient(circle at 80% 20%, #15a552 0%, transparent 50%)'}} />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-semibold">Shamba</span>
        </div>
        <div className="relative">
          <p className="text-shamba-300 text-sm font-medium mb-4 uppercase tracking-widest">From seed to sale</p>
          <h2 className="font-display text-4xl font-light leading-tight text-white/90">
            "Empowering<br />smallholder farmers<br />across East Africa."
          </h2>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['50K+','Farmers'],['47','Counties'],['KES 2M','Max credit']].map(([n,l]) => (
              <div key={l} className="rounded-xl bg-white/10 p-4 text-center">
                <div className="font-display text-2xl font-semibold">{n}</div>
                <div className="text-shamba-300 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-shamba-400 text-xs">© 2025 Shamba Technologies Ltd. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-earth-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-shamba-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-shamba-800">Shamba</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your farm dashboard</p>

          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Phone number</label>
              <input type="tel" className="input" placeholder="+254712345678" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className={cn('btn-primary w-full py-3', loading && 'opacity-70')}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-shamba-600 hover:text-shamba-700">Register</Link>
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-400">
            <p className="font-semibold mb-1 text-gray-500">Demo accounts</p>
            <p>Farmer: +254712345678 / Farmer@1234</p>
            <p>Admin:  +254700000001 / Admin@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
