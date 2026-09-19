import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser client — used only for Realtime subscriptions.
 *
 * All reads and writes go through Server Components and Server Actions; this
 * client exists so the dashboard can listen for changes other sessions make.
 * Realtime respects RLS, so a subscriber is only sent rows it could read.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
