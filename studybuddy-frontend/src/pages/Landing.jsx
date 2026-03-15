import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'

export default function Landing({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'StudyBuddy — Login'
  }, [])

  const finishAuth = (res) => {
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess(res)
    } else {
      localStorage.setItem('student_id', res.student_id)
      localStorage.setItem('student_name', res.name)
    }
    navigate('/app')
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    try {
      let res
      if (mode === 'signup') {
        res = await api.registerStudent(normalizedName, normalizedEmail)
      } else {
        res = await api.loginStudent(normalizedEmail)
      }

      finishAuth(res)
    } catch (err) {
      const message = err?.message || 'Authentication failed. Please try again.'
      const lowered = String(message).toLowerCase()

      if (
        mode === 'signup' &&
        (lowered.includes('already registered') ||
          lowered.includes('already exist') ||
          lowered.includes('duplicate') ||
          lowered.includes('unique'))
      ) {
        setError('This email already has an account. Please use Login tab.')
      } else {
        setError(message)
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      // Supabase starts provider auth and redirects back to /auth/callback.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#080B14] flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="portal-blob" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.08),transparent_60%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_55%),radial-gradient(circle_at_60%_80%,rgba(139,92,246,0.06),transparent_55%)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      <div className="relative z-10 w-full max-w-[420px] space-y-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
        >
          <span className="text-lg leading-none">←</span>
          <span className="underline-offset-4 group-hover:underline">Back to portal</span>
        </button>

        <div className="sb-card" style={{ padding: '40px' }}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.18)]">
              <span className="h-4 w-4 rounded-lg bg-white/90" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">StudyBuddy</p>
              <p className="text-xs text-[#4B5563]">Focused study space with AI guidance</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-white">Get Started</h1>
          <p className="text-sm text-[#4B5563] mt-1 mb-6">New here? Create account. Returning? Login with email.</p>

          <div className="grid grid-cols-2 gap-1 bg-[#161B27] rounded-xl p-1 border border-[#1C2333]">
            <button
              type="button"
              onClick={() => { setMode('signup'); setError('') }}
              className={`rounded-lg py-2 text-sm font-medium transition-all ${mode === 'signup' ? 'bg-white/5 text-white border border-[#21262D]' : 'text-[#4B5563]'}`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              className={`rounded-lg py-2 text-sm font-medium transition-all ${mode === 'login' ? 'bg-white/5 text-white border border-[#21262D]' : 'text-[#4B5563]'}`}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.1em] text-[#4B5563]">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sb-input w-full"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.1em] text-[#4B5563]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sb-input w-full"
                placeholder="name@email.com"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="sb-btn-primary w-full justify-center"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <LoadingSpinner />
                  <span>{mode === 'signup' ? 'Creating account...' : 'Logging in...'}</span>
                </span>
              ) : (
                mode === 'signup' ? 'Create Account' : 'Continue to Study'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#1C2333]"></span>
            </div>
            <div className="relative flex justify-center text-[11px] text-[#4B5563] uppercase">
              <span className="bg-[#0D1117] px-3">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold rounded-xl py-3 transition-all duration-200 hover:bg-[#F3F4F6] disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
