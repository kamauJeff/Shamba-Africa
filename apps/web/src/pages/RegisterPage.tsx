import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Leaf, CheckCircle2, Circle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const PW_RULES = [
  { label:'8+ characters',      test:(p:string) => p.length >= 8 },
  { label:'One uppercase',       test:(p:string) => /[A-Z]/.test(p) },
  { label:'One number',          test:(p:string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', phone:'', email:'', password:'', role:'FARMER', referralCode:'' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const strength = PW_RULES.filter(r => r.test(form.password)).length

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (strength < 3) return setError('Please meet all password requirements.')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      const { user, tokens } = res.data.data
      setAuth(user, tokens.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      const d = err.response?.data?.details
      setError(d ? Object.values(d).flat().join('. ') : err.response?.data?.error ?? 'Registration failed.')
    } finally { setLoading(false) }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="flex min-h-screen items-center justify-center bg-earth-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-shamba-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-shamba-800">Shamba</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold mb-1">Create account</h1>
          <p className="text-gray-500 text-sm mb-6">Join 50,000+ farmers growing with data</p>

          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Full name *</label>
                <input className="input" placeholder="John Kamau" value={form.name} onChange={set('name')} required />
              </div>
              <div className="col-span-2">
                <label className="label">Phone number *</label>
                <input type="tel" className="input" placeholder="+254712345678" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="col-span-2">
                <label className="label">Email <span className="text-gray-400">(optional)</span></label>
                <input type="email" className="input" placeholder="john@example.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label">I am a *</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="FARMER">Farmer</option>
                  <option value="AGENT">Extension Agent</option>
                  <option value="BUYER">Buyer / Trader</option>
                </select>
              </div>
              <div>
                <label className="label">Referral code</label>
                <input className="input" placeholder="Optional" value={form.referralCode} onChange={set('referralCode')} />
              </div>
              <div className="col-span-2">
                <label className="label">Password *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                    value={form.password} onChange={set('password')} required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-2.5 text-gray-400">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && (
                  <ul className="mt-2 space-y-1">
                    {PW_RULES.map(r => (
                      <li key={r.label} className={cn('flex items-center gap-1.5 text-xs', r.test(form.password) ? 'text-shamba-700' : 'text-gray-400')}>
                        {r.test(form.password) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className={cn('btn-primary w-full py-3 mt-2')}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-shamba-600 hover:text-shamba-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
