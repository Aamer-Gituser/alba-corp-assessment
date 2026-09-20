/**
 * Creates the `avatars` storage bucket and adds avatar_url to profiles.
 * Safe to re-run (idempotent).
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Create bucket (public so <img src> works without signed URLs)
  const { error: be } = await supabase.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })
  if (be && be.message !== 'The resource already exists') {
    console.error('Bucket error:', be.message)
    return
  }
  console.log('✓ avatars bucket ready')

  // 2. We can't run raw DDL via the JS client, so check if avatar_url exists
  const { error: pe } = await supabase
    .from('profiles')
    .select('avatar_url')
    .limit(1)

  if (pe?.code === '42703' || pe?.message?.includes('column')) {
    console.log('\n⚠  Run this SQL in the Supabase dashboard → SQL editor:')
    console.log('alter table public.profiles add column if not exists avatar_url text;\n')
  } else {
    console.log('✓ avatar_url column exists on profiles')
  }
}
main()
