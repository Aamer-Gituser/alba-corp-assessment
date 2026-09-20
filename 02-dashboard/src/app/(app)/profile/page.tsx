import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { AvatarUpload } from './avatar-upload'
import { PasswordForm } from './password-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_name, avatar_url')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="mx-auto max-w-xl fade-up">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Account settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-ink-faint)' }}>
          {user?.email}{joined && <> · Member since {joined}</>}
        </p>
      </div>

      <div className="space-y-5">

        {/* Avatar */}
        <section className="glass-panel p-6">
          <h2 className="mb-4 text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Dealership logo</h2>
          <AvatarUpload currentUrl={profile?.avatar_url ?? null} />
        </section>

        {/* Dealership name */}
        <section className="glass-panel p-6">
          <h2 className="mb-1 text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Dealership name</h2>
          <p className="mb-4 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            This appears in the header and on reports.
          </p>
          <ProfileForm initial={{ dealership_name: profile?.dealership_name ?? '' }} />
        </section>

        {/* Password */}
        <section className="glass-panel p-6">
          <h2 className="mb-1 text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Change password</h2>
          <p className="mb-4 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            Minimum 6 characters. You&apos;ll stay signed in after changing.
          </p>
          <PasswordForm />
        </section>

        {/* Account info */}
        <section className="glass-panel p-5">
          <dl className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="eyebrow mb-1">Email</dt>
              <dd style={{ color: 'var(--color-ink)' }}>{user?.email}</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1">User ID</dt>
              <dd className="truncate font-mono text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>{user?.id?.slice(0, 16)}…</dd>
            </div>
          </dl>
        </section>

      </div>
    </div>
  )
}
