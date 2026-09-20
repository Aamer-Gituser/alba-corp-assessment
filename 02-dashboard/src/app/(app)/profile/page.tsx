import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_name')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-[1.375rem] font-bold tracking-tight">Profile</h1>
      <p className="mb-8 text-[13px] text-ink-soft">{user?.email}</p>

      <div className="rounded-[var(--radius-card)] border border-rule bg-surface p-6">
        <ProfileForm initial={{ dealership_name: profile?.dealership_name ?? '' }} />
      </div>
    </div>
  )
}
