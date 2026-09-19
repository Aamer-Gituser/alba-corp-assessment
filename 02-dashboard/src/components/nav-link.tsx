'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative py-1 font-display text-[11px] font-bold tracking-[0.14em] uppercase transition-colors ${
        active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-[14px] left-0 h-[2px] w-full bg-signal" />
      )}
    </Link>
  )
}
