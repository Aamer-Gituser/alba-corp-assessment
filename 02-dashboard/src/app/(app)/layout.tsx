import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { NavLink } from '@/components/nav-link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_name, avatar_url')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const name = profile?.dealership_name ?? user?.email ?? '—'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-canvas)' }}>
      {/* ── Glass Header ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          borderColor: 'var(--color-rule)',
          background: 'oklch(0.07 0.03 240 / 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
          {/* Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Forecourt home"
          >
            <div
              className="flex size-7 items-center justify-center rounded-lg text-[10px] font-bold"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                boxShadow: '0 0 12px 0 oklch(0.57 0.22 264 / 0.4)',
                color: '#fff',
                fontFamily: 'var(--font-sora)',
              }}
            >
              FC
            </div>
            <span
              className="hidden text-[14px] font-bold tracking-tight sm:block"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Forecourt
            </span>
          </Link>

          {/* Pill nav */}
          <nav
            className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--color-rule)' }}
            aria-label="Sections"
          >
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/inventory">Inventory</NavLink>
          </nav>

          {/* Right rail */}
          <div className="ml-auto flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="relative flex size-2">
                <span
                  className="status-dot-ping absolute inline-flex size-full rounded-full"
                  style={{ background: 'var(--color-margin)', opacity: 0.6 }}
                />
                <span
                  className="relative inline-flex size-2 rounded-full"
                  style={{ background: 'var(--color-margin)' }}
                />
              </span>
              <span className="text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>
                Live
              </span>
            </div>

            {/* Avatar chip */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/5"
              aria-label="Profile settings"
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #1E2D47 0%, #0D1525 100%)',
                  border: '1px solid var(--color-rule)',
                  color: 'var(--color-ink-soft)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={name} className="size-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span
                className="hidden max-w-[120px] truncate text-[12.5px] font-medium sm:block"
                style={{ color: 'var(--color-ink-soft)' }}
              >
                {name}
              </span>
            </Link>

            {/* Sign out */}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-ink-faint)' }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  )
}
