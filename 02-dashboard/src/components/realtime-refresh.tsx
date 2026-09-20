'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Listens for changes another session makes and re-fetches the server-rendered
 * page. Realtime is filtered by RLS on the server, so a dealership is only ever
 * woken up by its own rows.
 */
export function RealtimeRefresh() {
  const router = useRouter()
  const [live, setLive] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('forecourt-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reconditioning_jobs' },
        () => router.refresh()
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return <span aria-hidden className="sr-only" data-live={live} />
}
