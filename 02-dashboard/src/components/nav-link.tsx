'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="relative rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
      style={
        active
          ? {
              background: 'oklch(1 0 0 / 0.09)',
              color: 'var(--color-ink)',
              boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.12)',
              fontFamily: 'var(--font-display)',
            }
          : {
              color: 'var(--color-ink-faint)',
              fontFamily: 'var(--font-display)',
            }
      }
    >
      {children}
    </Link>
  )
}
