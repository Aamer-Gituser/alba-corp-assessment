'use client'

import { useActionState, useState } from 'react'
import { signIn, signUp, type AuthState } from './actions'

const EMPTY: AuthState = { error: null, notice: null }

const DEMO_EMAIL    = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? ''
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? ''

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const action = mode === 'signin' ? signIn : signUp
  const [state, formAction, pending] = useActionState(action, EMPTY)

  return (
    <main
      className="min-h-dvh lg:grid lg:grid-cols-[1.1fr_1fr]"
      style={{ background: 'var(--color-canvas)' }}
    >
      {/* ── Left: Hero panel ── */}
      <section
        className="relative flex flex-col justify-between overflow-hidden px-8 py-12 sm:px-14 lg:py-16"
        style={{ background: 'linear-gradient(145deg, #0A1020 0%, #070C17 60%, #0C1832 100%)' }}
      >
        {/* Ambient mesh */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 20% 80%, oklch(0.57 0.22 264 / 0.08) 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 80% 20%, oklch(0.70 0.17 162 / 0.06) 0%, transparent 60%)
            `,
          }}
        />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex size-8 items-center justify-center rounded-xl text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', boxShadow: '0 0 16px 0 oklch(0.57 0.22 264 / 0.4)' }}
          >
            FC
          </div>
          <span
            className="text-[13px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'oklch(1 0 0 / 0.5)' }}
          >
            Forecourt
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-[420px] py-16 lg:py-0">
          <p
            className="mb-5 text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-blue-text)', fontFamily: 'var(--font-display)' }}
          >
            Dealer Inventory & Margin Engine
          </p>
          <h1
            className="text-[2.75rem] font-extrabold leading-[1.0] tracking-tight sm:text-[3.25rem]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Every car has
            <br />
            <span style={{ color: 'var(--color-blue-text)' }}>two prices</span>
            <br />
            before it has
            <br />
            a profit.
          </h1>
          <p
            className="mt-6 text-[15px] leading-relaxed"
            style={{ color: 'oklch(1 0 0 / 0.4)' }}
          >
            Forecourt tracks what you paid at auction, what you spent in recon, and exactly
            what margin you made — per car, per month, per dealership.
          </p>

          {/* Cost-stack visualisation */}
          <div className="mt-10">
            <div className="relative h-4 w-full max-w-sm overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.06)' }}>
              <div className="absolute left-0 top-0 h-full w-[57%]" style={{ background: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 100%)' }} />
              <div className="absolute top-0 h-full w-[18%]" style={{ left: '57%', background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)', borderLeft: '2px solid oklch(0 0 0 / 0.3)' }} />
              <div className="absolute top-0 h-full w-[25%]" style={{ left: '75%', background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)', borderLeft: '2px solid oklch(0 0 0 / 0.3)' }} />
              <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.15)' }} />
            </div>
            <div
              className="mt-2.5 flex max-w-sm justify-between text-[10.5px] font-semibold"
              style={{ color: 'oklch(1 0 0 / 0.3)', fontFamily: 'var(--font-display)' }}
            >
              <span style={{ color: 'var(--color-blue-text)' }}>Bought</span>
              <span style={{ color: 'var(--color-amber-text)' }}>Recon</span>
              <span style={{ color: 'var(--color-margin-text)' }}>Margin</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p
          className="relative z-10 text-[11px]"
          style={{ color: 'oklch(1 0 0 / 0.2)' }}
        >
          Row-level security — every dealer sees only their own data.
        </p>
      </section>

      {/* ── Right: Auth panel ── */}
      <section
        className="flex items-center justify-center px-6 py-14 sm:px-12"
        style={{ background: '#0A1020', borderLeft: '1px solid var(--color-rule)' }}
      >
        <div className="w-full max-w-[340px]">
          {/* Mode tabs */}
          <div
            className="mb-8 flex rounded-xl p-1"
            style={{ background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--color-rule)' }}
          >
            {(['signin', 'signup'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-current={mode === value}
                className="flex-1 rounded-lg py-2 text-[12px] font-semibold transition-all"
                style={
                  mode === value
                    ? {
                        background: 'oklch(1 0 0 / 0.09)',
                        color: 'var(--color-ink)',
                        fontFamily: 'var(--font-display)',
                        boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.12)',
                      }
                    : {
                        color: 'var(--color-ink-faint)',
                        fontFamily: 'var(--font-display)',
                      }
                }
              >
                {value === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form action={formAction} className="space-y-4">
            {mode === 'signup' && (
              <AuthField label="Dealership name" name="dealership" type="text" placeholder="Marina Motors" />
            )}
            <AuthField label="Email" name="email" type="email" autoComplete="email" required defaultValue={DEMO_EMAIL} />
            <AuthField
              label="Password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              defaultValue={mode === 'signin' ? DEMO_PASSWORD : ''}
            />

            {state.error && (
              <div
                role="alert"
                className="rounded-xl px-3.5 py-2.5 text-[12.5px]"
                style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)', border: '1px solid oklch(0.63 0.22 25 / 0.3)' }}
              >
                {state.error}
              </div>
            )}
            {state.notice && (
              <div
                role="status"
                className="rounded-xl px-3.5 py-2.5 text-[12.5px]"
                style={{ background: 'var(--color-margin-wash)', color: 'var(--color-margin-text)', border: '1px solid oklch(0.70 0.17 162 / 0.3)' }}
              >
                {state.notice}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-xl py-3 text-[13px] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 0 24px 0 oklch(0.57 0.22 264 / 0.3)',
              }}
            >
              {pending
                ? 'Working…'
                : mode === 'signin'
                  ? 'Open the lot →'
                  : 'Create account'}
            </button>
          </form>

          {mode === 'signin' && (
            <p
              className="mt-6 border-t pt-5 text-[12px] leading-relaxed"
              style={{ borderColor: 'var(--color-rule)', color: 'var(--color-ink-faint)' }}
            >
              Reviewer? Demo credentials are pre-filled — just press{' '}
              <span style={{ color: 'var(--color-ink-soft)' }}>Open the lot</span>. A second
              seeded dealership exists to show RLS isolation.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function AuthField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all focus:ring-2 focus:ring-[#3B82F6]/40"
        style={{
          background: 'oklch(1 0 0 / 0.04)',
          border: '1px solid oklch(1 0 0 / 0.10)',
          color: 'var(--color-ink)',
        }}
      />
    </label>
  )
}
