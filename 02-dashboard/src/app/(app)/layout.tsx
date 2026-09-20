import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { NavLink } from '@/components/nav-link'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_name')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5">
          <Link href="/" className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
            Forecourt
          </Link>

          <nav className="flex gap-6" aria-label="Sections">
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/inventory">Inventory</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/profile"
              className="hidden text-[12.5px] text-ink-soft underline-offset-4 hover:text-ink hover:underline sm:inline"
            >
              {profile?.dealership_name ?? user?.email}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-[12.5px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  )
}
