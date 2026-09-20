'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/(app)/actions'
import { EMPTY_FORM_STATE } from '@/lib/form-state'

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, EMPTY_FORM_STATE)

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="pw-current">Current password <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span></label>
        <input id="pw-current" name="current_password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="pw-new">New password <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span></label>
          <input id="pw-new" name="new_password" type="password" autoComplete="new-password" required className="field" />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="pw-confirm">Confirm <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span></label>
          <input id="pw-confirm" name="confirm_password" type="password" autoComplete="new-password" required className="field" />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl px-3.5 py-2.5 text-[12.5px]" style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)', border: '1px solid oklch(0.63 0.22 25 / 0.3)' }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl px-3.5 py-2.5 text-[12.5px]" style={{ background: 'var(--color-margin-wash)', color: 'var(--color-margin-text)', border: '1px solid oklch(0.70 0.17 162 / 0.3)' }}>
          Password updated successfully.
        </p>
      )}

      <button type="submit" disabled={pending} className="primary-action w-full justify-center py-2.5 disabled:opacity-50">
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
