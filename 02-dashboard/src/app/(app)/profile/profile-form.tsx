'use client'

import { useActionState } from 'react'
import { updateProfile, EMPTY_FORM_STATE } from '@/app/(app)/actions'

const cls =
  'w-full rounded border border-rule bg-surface px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-ink'

export function ProfileForm({ initial }: { initial: { dealership_name: string } }) {
  const [state, formAction, pending] = useActionState(updateProfile, EMPTY_FORM_STATE)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="pf-name">
          Dealership name{' '}
          <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
        </label>
        <input
          id="pf-name"
          name="dealership_name"
          type="text"
          required
          defaultValue={initial.dealership_name}
          className={cls}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-[12.5px]" style={{ color: 'var(--color-signal-text)' }}>
          {state.error}
        </p>
      )}

      {state.ok && (
        <p role="status" className="text-[12.5px]" style={{ color: 'var(--color-margin-text)' }}>
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
