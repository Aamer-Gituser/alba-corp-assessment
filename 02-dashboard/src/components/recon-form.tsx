'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { ReconJob, ReconCategory } from '@/lib/supabase/types'
import { RECON_CATEGORIES } from '@/lib/supabase/types'
import {
  createReconJob,
  updateReconJob,
  deleteReconJob,
  toggleReconJob,
  EMPTY_FORM_STATE,
  type FormState,
} from '@/app/(app)/actions'
import { money, shortDate } from '@/lib/format'

const CAT_LABELS: Record<ReconCategory, string> = {
  mechanical: 'Mechanical',
  bodywork: 'Bodywork',
  detailing: 'Detailing',
  tyres: 'Tyres',
  electrical: 'Electrical',
  paperwork: 'Paperwork',
}

function AddReconForm({
  vehicleId,
  onSuccess,
}: {
  vehicleId: string
  onSuccess: () => void
}) {
  const [state, formAction, pending] = useActionState(createReconJob, EMPTY_FORM_STATE)

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state.ok, onSuccess])

  const today = new Date().toISOString().slice(0, 10)
  const cls =
    'w-full rounded border border-rule bg-surface px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-ink'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="vehicle_id" value={vehicleId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-category">
            Category <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
          </label>
          <select id="rc-category" name="category" className={cls} required>
            {RECON_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CAT_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-date">
            Date <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
          </label>
          <input id="rc-date" name="performed_on" type="date" defaultValue={today} required className={cls} />
        </div>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="rc-desc">
          Description <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
        </label>
        <input id="rc-desc" name="description" type="text" required className={cls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-cost">
            Cost (AED) <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
          </label>
          <input id="rc-cost" name="cost" type="number" min={0} step="0.01" required className={cls} />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-vendor">
            Vendor
          </label>
          <input id="rc-vendor" name="vendor" type="text" className={cls} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="completed" value="on" className="size-4" />
        Already completed
      </label>

      {state.error && (
        <p role="alert" className="text-[12.5px]" style={{ color: 'var(--color-signal-text)' }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Add job'}
      </button>
    </form>
  )
}

export function AddReconDialog({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-rule bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-paper"
      >
        Add job
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-lg rounded-[4px] border border-rule bg-surface p-6 shadow-xl backdrop:bg-ink/30 backdrop:backdrop-blur-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Add reconditioning job</h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>
        <AddReconForm vehicleId={vehicleId} onSuccess={() => setOpen(false)} />
      </dialog>
    </>
  )
}

function EditReconForm({ job, onSuccess }: { job: ReconJob; onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(updateReconJob, EMPTY_FORM_STATE)

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state.ok, onSuccess])

  const cls =
    'w-full rounded border border-rule bg-surface px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-ink'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={job.id} />
      <input type="hidden" name="vehicle_id" value={job.vehicle_id} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="edit-rc-category">Category</label>
          <select id="edit-rc-category" name="category" defaultValue={job.category} className={cls}>
            {RECON_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CAT_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="edit-rc-date">Date</label>
          <input id="edit-rc-date" name="performed_on" type="date" defaultValue={job.performed_on} required className={cls} />
        </div>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="edit-rc-desc">Description</label>
        <input id="edit-rc-desc" name="description" type="text" defaultValue={job.description} required className={cls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="edit-rc-cost">Cost (AED)</label>
          <input id="edit-rc-cost" name="cost" type="number" min={0} step="0.01" defaultValue={job.cost} required className={cls} />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="edit-rc-vendor">Vendor</label>
          <input id="edit-rc-vendor" name="vendor" type="text" defaultValue={job.vendor ?? ''} className={cls} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="completed" value="on" defaultChecked={job.completed} className="size-4" />
        Completed
      </label>

      {state.error && (
        <p role="alert" className="text-[12.5px]" style={{ color: 'var(--color-signal-text)' }}>
          {state.error}
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

function EditReconDialog({ job }: { job: ReconJob }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Edit job"
        className="text-[11px] text-ink-soft hover:text-ink"
      >
        Edit
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-lg rounded-[4px] border border-rule bg-surface p-6 shadow-xl backdrop:bg-ink/30 backdrop:backdrop-blur-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Edit reconditioning job</h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-soft hover:text-ink">✕</button>
        </div>
        {open && <EditReconForm key={job.id} job={job} onSuccess={() => setOpen(false)} />}
      </dialog>
    </>
  )
}

export function ReconJobRow({ job }: { job: ReconJob }) {
  return (
    <tr className="border-b border-rule last:border-0">
      <td className="px-4 py-3 text-ink-soft">{shortDate(job.performed_on)}</td>
      <td className="px-4 py-3">
        <span className="rounded bg-paper-edge px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
          {CAT_LABELS[job.category as ReconCategory] ?? job.category}
        </span>
      </td>
      <td className="px-4 py-3">{job.description}</td>
      <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{job.vendor ?? '—'}</td>
      <td
        className="tnum px-4 py-3 text-right"
        style={{ color: 'var(--color-signal-text)' }}
      >
        {money(job.cost)}
      </td>
      <td className="px-4 py-3 text-center">
        <form action={toggleReconJob}>
          <input type="hidden" name="id" value={job.id} />
          <input type="hidden" name="vehicle_id" value={job.vehicle_id} />
          <input type="hidden" name="completed" value={String(job.completed)} />
          <button
            type="submit"
            aria-label={job.completed ? 'Mark incomplete' : 'Mark complete'}
            className="size-5 rounded border border-rule bg-surface transition-colors"
            style={job.completed ? { background: 'var(--color-margin)', borderColor: 'var(--color-margin)' } : {}}
          >
            {job.completed && <span aria-hidden className="block text-[10px] leading-none text-paper">✓</span>}
          </button>
        </form>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <EditReconDialog job={job} />
          <form action={deleteReconJob}>
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="vehicle_id" value={job.vehicle_id} />
            <button
              type="submit"
              aria-label="Delete job"
              className="text-[11px] text-ink-soft hover:text-[#b8420f]"
            >
              ✕
            </button>
          </form>
        </div>
      </td>
    </tr>
  )
}
