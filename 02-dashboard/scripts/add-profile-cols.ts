import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await supabase
    .from('profiles')
    .select('owner_name, phone')
    .limit(1)

  if (error?.code === '42703' || error?.message?.includes('column')) {
    console.log('Columns do not exist — add via Supabase SQL editor:')
    console.log('alter table public.profiles add column if not exists owner_name text, add column if not exists phone text;')
  } else if (error) {
    console.error('Unexpected error:', error.message)
  } else {
    console.log('✓ owner_name and phone columns exist on profiles')
  }
}

main()
