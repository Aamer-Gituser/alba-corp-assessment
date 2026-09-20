'use client'

import { useActionState, useState } from 'react'
import { signIn, signUp, forgotPassword, type AuthState } from './actions'

const EMPTY: AuthState = { error: null, notice: null }

const DEMO_EMAIL    = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? ''
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? ''

type Mode = 'signin' | 'signup' | 'forgot'

const field = `w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-all focus:ring-2`
const fieldStyle = {
  background: 'oklch(1 0 0 / 72%)',
  border: '1px solid oklch(0.72 0.03 252 / 52%)',
  color: 'var(--color-ink)',
}
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')

  const signInAction  = mode === 'signin'  ? signIn     : undefined
  const signUpAction  = mode === 'signup'  ? signUp     : undefined
  const forgotAction  = mode === 'forgot'  ? forgotPassword : undefined
  const action = signInAction ?? signUpAction ?? forgotAction ?? signIn

  const [state, formAction, pending] = useActionState(action, EMPTY)

  return (
    <main
      className="min-h-dvh lg:grid lg:grid-cols-[1.1fr_0.9fr]"
      style={{ background: 'var(--color-canvas)' }}
    >
      {/* ── Left: Hero ── */}
      <section className="relative flex flex-col overflow-hidden px-8 py-12 sm:px-14 lg:grid lg:grid-rows-[auto_1fr] lg:py-16"
        style={{ background: 'linear-gradient(145deg,oklch(0.965 0.012 252),oklch(0.945 0.018 251))' }}
      >
        {/* Ambient blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />
          <div className="noise" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3 fade-up">
          <div className="brand-mark">FC</div>
          <span className="text-[14px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            Forecourt
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-[440px] py-16 lg:self-center lg:py-0 lg:-translate-y-[4vh]">
          <p className="mb-4 text-[10px] font-bold tracking-[0.2em] uppercase fade-up fade-up-1" style={{ color: 'var(--color-blue-text)', fontFamily: 'var(--font-display)' }}>
            Dealer Inventory &amp; Margin Engine
          </p>
          <h1 className="text-[2.75rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3.25rem] fade-up fade-up-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Every car has
            <br />
            <span style={{ color: 'var(--color-blue-text)' }}>two prices</span>
            <br />
            before it has
            <br />a profit.
          </h1>

          {/* Cost-stack preview */}
          <div className="mt-10 glass-panel p-4 fade-up fade-up-3">
            <p className="eyebrow mb-3">Sample unit economics</p>
            <div className="relative h-6 w-full overflow-hidden rounded-full" style={{ background: 'oklch(0.9 0.02 252 / 75%)' }}>
              <div className="absolute left-0 top-0 h-full rounded-l-full login-bar-acq" style={{ background: 'linear-gradient(90deg,oklch(0.47 0.24 261),oklch(0.62 0.2 251))' }} />
              <div className="absolute top-0 h-full login-bar-recon" style={{ left: '57%', background: 'linear-gradient(90deg,oklch(0.57 0.16 58),oklch(0.67 0.14 58))' }} />
              <div className="absolute top-0 h-full rounded-r-full login-bar-margin" style={{ left: '75%', background: 'linear-gradient(90deg,oklch(0.48 0.14 161),oklch(0.60 0.16 162))' }} />
            </div>
            <div className="mt-2.5 flex justify-between text-[11px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              <span style={{ color: 'var(--color-blue-text)' }}>Acquisition · AED 57K</span>
              <span style={{ color: 'var(--color-amber-text)' }}>Recon · AED 18K</span>
              <span style={{ color: 'var(--color-margin-text)' }}>Margin · AED 25K</span>
            </div>
          </div>
        </div>

      </section>

      {/* ── Right: Auth panel ── */}
      <section
        className="slide-right flex items-center justify-center border-l px-6 py-14 sm:px-12 lg:px-16"
        style={{ borderColor: 'var(--color-rule)', background: 'oklch(1 0 0 / 55%)' }}
      >
        <div className="w-full max-w-[360px]">

          {/* Title */}
          <div className="mb-7">
            <h2 className="text-[1.4rem] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h2>
          </div>

          {/* Mode tabs (signin / signup only) */}
          {mode !== 'forgot' && (
            <div className="mb-6 flex rounded-xl p-1" style={{ background: 'oklch(0.92 0.018 252 / 75%)', border: '1px solid var(--color-rule)' }}>
              {(['signin', 'signup'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMode(v)}
                  className="flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition-all"
                  style={mode === v
                    ? { background: 'oklch(1 0 0 / 92%)', color: 'var(--color-ink)', boxShadow: '0 1px 3px oklch(0.2 0.04 256 / 10%)', fontFamily: 'var(--font-display)' }
                    : { color: 'var(--color-ink-faint)', fontFamily: 'var(--font-display)' }}
                >
                  {v === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="eyebrow mb-1.5 block" htmlFor="auth-dealership">Dealership name</label>
                <input id="auth-dealership" name="dealership" type="text" placeholder="Marina Motors" className={field} style={fieldStyle} />
              </div>
            )}

            <div>
              <label className="eyebrow mb-1.5 block" htmlFor="auth-email">Email <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span></label>
              <input id="auth-email" name="email" type="email" autoComplete="email" required
                defaultValue={mode === 'signin' ? DEMO_EMAIL : ''}
                className={field} style={fieldStyle}
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="eyebrow" htmlFor="auth-password">Password <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span></label>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-[11px] transition-colors hover:underline" style={{ color: 'var(--color-blue-text)' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input id="auth-password" name="password" type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  defaultValue={mode === 'signin' ? DEMO_PASSWORD : ''}
                  className={field} style={fieldStyle}
                />
              </div>
            )}

            {state.error && (
              <div role="alert" className="rounded-xl px-3.5 py-2.5 text-[12.5px]"
                style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)', border: '1px solid oklch(0.63 0.22 25 / 0.3)' }}>
                {state.error}
              </div>
            )}
            {state.notice && (
              <div role="status" className="rounded-xl px-3.5 py-2.5 text-[12.5px]"
                style={{ background: 'var(--color-margin-wash)', color: 'var(--color-margin-text)', border: '1px solid oklch(0.70 0.17 162 / 0.3)' }}>
                {state.notice}
              </div>
            )}

            <button type="submit" disabled={pending} className="primary-action mt-1 w-full justify-center py-3 text-[13.5px] disabled:opacity-50">
              {pending ? 'Working…'
                : mode === 'signin' ? 'Open the lot →'
                : mode === 'signup' ? 'Create account'
                : 'Send reset link'}
            </button>
          </form>

          {mode === 'forgot' && (
            <button type="button" onClick={() => setMode('signin')} className="mt-4 text-[12px] transition-colors hover:underline" style={{ color: 'var(--color-ink-faint)' }}>
              ← Back to sign in
            </button>
          )}

          {mode === 'signin' && (
            <p className="mt-6 border-t pt-5 text-[12px] leading-relaxed" style={{ borderColor: 'var(--color-rule)', color: 'var(--color-ink-faint)' }}>
              Reviewer? Demo credentials are pre-filled, just press{' '}
              <span style={{ color: 'var(--color-ink-soft)' }}>Open the lot</span>.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
