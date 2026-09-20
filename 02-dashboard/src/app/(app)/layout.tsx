import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { NavLink } from '@/components/nav-link'
import { BackButton } from '@/components/back-button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('dealership_name, avatar_url').eq('id', user?.id ?? '').maybeSingle()
  const name = profile?.dealership_name ?? user?.email ?? '—'
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div className="min-h-dvh" style={{ color: 'var(--color-ink)' }}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="noise" />
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'oklch(0.78 0.025 252 / 60%)', background: 'oklch(0.965 0.012 252 / 0.65)', backdropFilter: 'blur(28px) saturate(180%)' }}>
        <div className="mx-auto grid h-[72px] max-w-[1680px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-8">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Forecourt home">
              <span className="brand-mark">FC</span>
              <span className="hidden text-sm font-semibold sm:block" style={{ fontFamily: 'var(--font-display)' }}>Forecourt</span>
            </Link>
          </div>
          {/* Center nav */}
          <nav className="liquid-nav mx-auto hidden lg:flex" aria-label="Primary navigation">
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/inventory">Inventory</NavLink>
            <NavLink href="/analytics">Analytics</NavLink>
          </nav>
          {/* Right actions */}
          <div className="flex items-center justify-end gap-3">
            <div className="hidden items-center gap-2 text-xs sm:flex" style={{ color: 'var(--color-ink-faint)' }}>
              <span className="live-dot" />Live Sync
            </div>
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all hover:bg-white/60 sm:flex"
              style={{ borderColor: 'var(--color-rule)', background: 'oklch(1 0 0 / 40%)' }}
            >
              <span className="avatar-ring text-[10px] font-semibold">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-hosted Supabase avatar URL
                  <img src={profile.avatar_url} alt={name} className="size-full object-cover" />
                ) : initials}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold xl:block" style={{ color: 'var(--color-ink)' }}>{name}</span>
            </Link>
            <form action={signOut}>
              <button className="signout-btn">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="border-t px-4 py-2 sm:px-6 lg:hidden" style={{ borderColor: 'var(--color-rule-soft)' }}>
          <nav className="liquid-nav flex w-max max-w-full overflow-x-auto" aria-label="Primary navigation">
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/inventory">Inventory</NavLink>
            <NavLink href="/analytics">Analytics</NavLink>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mb-4">
          <BackButton />
        </div>
        {children}
      </main>
    </div>
  )
}
