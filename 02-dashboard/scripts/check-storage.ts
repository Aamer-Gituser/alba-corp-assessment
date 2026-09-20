import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) console.error('Error:', error.message)
  else console.log('Buckets:', JSON.stringify(buckets, null, 2))

  // Check if profiles has avatar_url
  const { data: profile, error: pe } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  if (pe) console.error('Profile error:', pe.message)
  else console.log('Profile cols:', Object.keys(profile?.[0] ?? {}))
}
main()
