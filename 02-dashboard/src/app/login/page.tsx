'use client'

import { useActionState, useState } from 'react'
import { signIn, signUp, type AuthState } from './actions'

const EMPTY: AuthState = { error: null, notice: null }

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'appflow.qa01@gmail.com'
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? 'forecourt-demo'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const action = mode === 'signin' ? signIn : signUp
  const [state, formAction, pending] = useActionState(action, EMPTY)

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left: the pitch, set like the cover of a trade catalogue. */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-ink px-6 py-10 text-paper sm:px-12 lg:py-14">
        <div className="eyebrow !text-paper/45">Forecourt — dealer inventory</div>

        <div className="max-w-md py-14 lg:py-0">
          <h1 className="font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.02em] sm:text-5xl">
            Every car has two
            <br />
            prices before it
            <br />
            has a profit.
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-paper/60">
            What you paid at auction is only half the story. Forecourt tracks the
            reconditioning spend against each vehicle, so the margin you report is
            the margin you actually made.
          </p>

          {/* A miniature of the cost-stack bar used throughout the app. */}
          <div className="mt-10">
            <div className="flex h-3 w-full max-w-sm overflow-hidden rounded-[2px]">
              <div className="w-[58%] bg-paper/80" />
              <div className="w-[17%] bg-signal" />
              <div className="w-[25%] bg-margin" />
            </div>
            <div className="mt-2.5 flex max-w-sm justify-between text-[11px] text-paper/45">
              <span>Bought</span>
              <span>Recon</span>
              <span>Margin</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-paper/35">
          Built on Supabase — every row is scoped to its dealership by row level
          security.
        </p>
      </section>

      {/* Right: the form. */}
      <section className="flex items-center justify-center px-6 py-14 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="flex gap-1 border-b border-rule">
            {(['signin', 'signup'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-current={mode === value}
                className={`-mb-px border-b-2 px-3 py-2.5 font-display text-[11px] font-bold tracking-[0.14em] uppercase transition-colors ${
                  mode === value
                    ? 'border-signal text-ink'
                    : 'border-transparent text-ink-faint hover:text-ink-soft'
                }`}
              >
                {value === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form action={formAction} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <Field
                label="Dealership"
                name="dealership"
                type="text"
                placeholder="Marina Motors"
              />
            )}
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={DEMO_EMAIL}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              defaultValue={mode === 'signin' ? DEMO_PASSWORD : ''}
            />

            {state.error && (
              <p
                role="alert"
                className="border-l-2 border-signal bg-signal-wash px-3 py-2 text-[13px] text-ink"
              >
                {state.error}
              </p>
            )}
            {state.notice && (
              <p
                role="status"
                className="border-l-2 border-margin bg-margin-wash px-3 py-2 text-[13px] text-ink"
              >
                {state.notice}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-ink px-4 py-3 font-display text-[12px] font-bold tracking-[0.12em] text-paper uppercase transition-opacity hover:opacity-90 disabled:opacity-55"
            >
              {pending
                ? 'Working…'
                : mode === 'signin'
                  ? 'Open the lot'
                  : 'Create account'}
            </button>
          </form>

          {mode === 'signin' && (
            <p className="mt-6 border-t border-rule pt-5 text-[12.5px] leading-relaxed text-ink-soft">
              Reviewer? The demo dealership is pre-filled above — just press
              <span className="text-ink"> Open the lot</span>. A second seeded
              dealership exists to demonstrate that the two cannot see each other.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-ink"
      />
    </label>
  )
}
