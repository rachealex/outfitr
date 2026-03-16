import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword({ onComplete }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      // Sign out so the user logs in fresh with new password
      setTimeout(async () => {
        await supabase.auth.signOut()
        onComplete()
      }, 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm fade-up">
        <div className="text-center mb-10">
          <h1 className="font-serif text-5xl text-ivory tracking-wide mb-2">Outfitr</h1>
          <div className="w-12 h-0.5 bg-gold mx-auto mb-3" />
          <p className="text-muted text-sm">Set your new password</p>
        </div>

        <div className="bg-charcoal rounded-xl border border-white/8 p-7">
          {done ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">✓</div>
              <p className="text-ivory font-medium mb-1">Password updated</p>
              <p className="text-muted text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="text-ivory text-lg font-medium mb-6">Choose a new password</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-ink border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder-muted/50 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-muted text-xs mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                  disabled={loading || !password || !confirm}
                  className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Saving…' : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
