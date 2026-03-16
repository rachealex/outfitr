import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('poulos.r.a@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://outfitr-swart.vercel.app',
      })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-rust/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-5xl text-ivory tracking-wide mb-2">Outfitr</h1>
          <div className="w-12 h-0.5 bg-gold mx-auto mb-3" />
          <p className="text-muted text-sm">Your personal wardrobe, curated.</p>
        </div>

        {/* Card */}
        <div className="bg-charcoal rounded-xl border border-white/8 p-7">
          {mode === 'login' ? (
            <>
              <h2 className="text-ivory text-lg font-medium mb-6">Sign in</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-rust text-sm bg-rust/10 border border-rust/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <button
                onClick={() => { setMode('reset'); setError(null) }}
                className="w-full text-center text-muted text-sm mt-4 hover:text-ivory transition-colors"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-ivory text-lg font-medium mb-2">Reset password</h2>
              <p className="text-muted text-sm mb-6">We'll send a reset link to your email.</p>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-3">✉</div>
                  <p className="text-ivory text-sm mb-1">Check your inbox</p>
                  <p className="text-muted text-xs">Reset link sent to {email}</p>
                  <button
                    onClick={() => { setMode('login'); setResetSent(false) }}
                    className="mt-6 text-gold text-sm hover:text-gold/80 transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20 transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-rust text-sm bg-rust/10 border border-rust/20 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null) }}
                    className="w-full text-center text-muted text-sm hover:text-ivory transition-colors"
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-muted/40 text-xs mt-8">Private & secure · Rachel Poulos</p>
      </div>
    </div>
  )
}
