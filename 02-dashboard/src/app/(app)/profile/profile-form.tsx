'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/(app)/actions'
import { EMPTY_FORM_STATE } from '@/lib/form-state'

const cls = 'field'
const clsStyle = {}

export function ProfileForm({ initial }: { initial: { dealership_name: string } }) {
  const [state, formAction, pending] = useActionState(updateProfile, EMPTY_FORM_STATE)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="pf-name">
          Dealership name{' '}
          <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
        </label>
        <input id="pf-name" name="dealership_name" type="text" required defaultValue={initial.dealership_name} className={cls} style={clsStyle} />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl px-3.5 py-2.5 text-[12.5px]" style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)', border: '1px solid oklch(0.63 0.22 25 / 0.3)' }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl px-3.5 py-2.5 text-[12.5px]" style={{ background: 'var(--color-margin-wash)', color: 'var(--color-margin-text)', border: '1px solid oklch(0.70 0.17 162 / 0.3)' }}>
          Saved.
        </p>
      )}

      <button type="submit" disabled={pending} className="primary-action w-full justify-center py-2.5 disabled:opacity-50">
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
