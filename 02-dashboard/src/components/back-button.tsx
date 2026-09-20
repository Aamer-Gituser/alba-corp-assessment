'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <button
      onClick={() => router.back()}
      className="back-btn slide-left"
      aria-label="Go back"
    >
      <ArrowLeft className="size-3.5 back-btn-arrow" aria-hidden />
      Back
    </button>
  )
}
