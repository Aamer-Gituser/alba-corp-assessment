import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { AvatarUpload } from './avatar-upload'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_name, avatar_url')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  return (
    <div className="mx-auto max-w-lg fade-up">
      <h1
        className="mb-1 text-[1.75rem] font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
      >
        Profile
      </h1>
      <p className="mb-8 text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
        {user?.email}
      </p>

      <div className="space-y-4">
        <AvatarUpload currentUrl={profile?.avatar_url ?? null} />

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-rule)',
            boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.07)',
          }}
        >
          <ProfileForm initial={{ dealership_name: profile?.dealership_name ?? '' }} />
        </div>
      </div>
    </div>
  )
}
