'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Gauge, Warehouse, BarChart3 } from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  '/': Gauge,
  '/inventory': Warehouse,
  '/analytics': BarChart3,
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  const Icon = ICONS[href]

  return (
    <Link
      href={href}
      prefetch
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      onTouchStart={() => router.prefetch(href)}
      aria-current={active ? 'page' : undefined}
      className={`nav-pill ${active ? 'nav-pill-active' : ''}`}
      style={
        active
          ? {
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-display)',
            }
          : {
              color: 'var(--color-ink-faint)',
              fontFamily: 'var(--font-display)',
            }
      }
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}{children}
    </Link>
  )
}
