'use client'

import { useActionState } from 'react'
import { updateProfile, EMPTY_FORM_STATE } from '@/app/(app)/actions'

const cls = 'w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all focus:ring-2 focus:ring-[#3B82F6]/40'
const clsStyle = {
  background: 'oklch(1 0 0 / 0.04)',
  border: '1px solid oklch(1 0 0 / 0.10)',
  color: 'var(--color-ink)',
}

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

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', color: '#fff', fontFamily: 'var(--font-display)' }}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
