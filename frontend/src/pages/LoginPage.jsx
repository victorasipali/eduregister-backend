import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../utils/helpers'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ email, password }) {
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0
                      bg-brand-700 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center
                          font-display font-bold text-xl">E</div>
          <span className="font-display font-bold text-xl">EduRegister</span>
        </div>

        <div>
          <h1 className="font-display font-bold text-4xl leading-tight mb-4">
            Student Registration &amp; Fee Management
          </h1>
          <p className="text-brand-200 text-base leading-relaxed">
            Streamline student enrollment, track fee payments, and manage academic records — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Students', icon: '🎓' },
              { label: 'Fee Tracking', icon: '💳' },
              { label: 'Role Access', icon: '🔐' },
              { label: 'Analytics', icon: '📊' },
            ].map(({ label, icon }) => (
              <div key={label} className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-medium">
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>

        <p className="text-brand-300 text-xs">© {new Date().getFullYear()} EduRegister. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-slate-900">Sign in</h2>
            <p className="text-slate-500 mt-2 text-sm">Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input ${errors.password ? 'input-error' : ''}`}
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full justify-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-white rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demo accounts</p>
            <div className="space-y-1.5 text-xs text-slate-600 font-mono">
              <p>registrar@school.edu / password123</p>
              <p>teacher@school.edu &nbsp; / password123</p>
              <p>student@school.edu &nbsp; / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
