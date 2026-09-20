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
  bodywork:   'Bodywork',
  detailing:  'Detailing',
  tyres:      'Tyres',
  electrical: 'Electrical',
  paperwork:  'Paperwork',
}

const CAT_COLORS: Record<ReconCategory, string> = {
  mechanical: '#3B82F6',
  bodywork:   '#8B5CF6',
  detailing:  '#06B6D4',
  tyres:      '#F59E0B',
  electrical: '#EAB308',
  paperwork:  '#6B7280',
}

const cls =
  'w-full rounded-xl px-3.5 py-2.5 text-[13px] transition-all outline-none focus:ring-2 focus:ring-[#3B82F6]/40 focus:border-[#3B82F6]'
const clsStyle = {
  background: 'oklch(1 0 0 / 0.04)',
  border: '1px solid oklch(1 0 0 / 0.10)',
  color: 'var(--color-ink)',
}

function ReconForm({
  vehicleId,
  job,
  onSuccess,
}: {
  vehicleId: string
  job?: ReconJob
  onSuccess: () => void
}) {
  const action = job ? updateReconJob : createReconJob
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE)

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state.ok, onSuccess])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="space-y-4">
      {job && <input type="hidden" name="id" value={job.id} />}
      <input type="hidden" name="vehicle_id" value={vehicleId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-cat">
            Category <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
          </label>
          <select id="rc-cat" name="category" defaultValue={job?.category} className={cls} style={clsStyle}>
            {RECON_CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: '#0D1525' }}>{CAT_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-date">
            Date <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
          </label>
          <input id="rc-date" name="performed_on" type="date" defaultValue={job?.performed_on ?? today} required className={cls} style={clsStyle} />
        </div>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="rc-desc">
          Description <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
        </label>
        <input id="rc-desc" name="description" type="text" defaultValue={job?.description} required className={cls} style={clsStyle} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-cost">
            Cost (AED) <span aria-hidden style={{ color: 'var(--color-signal-text)' }}>*</span>
          </label>
          <input id="rc-cost" name="cost" type="number" min={0} step="0.01" defaultValue={job?.cost} required className={cls} style={clsStyle} />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block" htmlFor="rc-vendor">Vendor</label>
          <input id="rc-vendor" name="vendor" type="text" defaultValue={job?.vendor ?? ''} className={cls} style={clsStyle} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>
        <input
          type="checkbox"
          name="completed"
          value="on"
          defaultChecked={job?.completed}
          className="size-4 rounded"
        />
        Completed
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl px-3.5 py-2.5 text-[12.5px]"
          style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)', border: '1px solid oklch(0.63 0.22 25 / 0.3)' }}
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', color: '#fff', fontFamily: 'var(--font-display)' }}
      >
        {pending ? 'Saving…' : job ? 'Save changes' : 'Add job'}
      </button>
    </form>
  )
}

function GlassDialog({
  title,
  trigger,
  children,
  open,
  onClose,
}: {
  title: string
  trigger: React.ReactNode
  children: React.ReactNode
  open: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])

  return (
    <>
      {trigger}
      <dialog
        ref={ref}
        onClose={onClose}
        className="m-auto w-full max-w-lg rounded-3xl p-0 shadow-2xl"
        style={{
          background: '#0D1525',
          border: '1px solid oklch(1 0 0 / 0.12)',
          boxShadow: '0 32px 80px 0 oklch(0 0 0 / 0.6)',
          color: 'var(--color-ink)',
        }}
      >
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-lg text-[12px] transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  )
}

export function AddReconDialog({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <GlassDialog
      title="Add reconditioning job"
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white/5"
          style={{ border: '1px solid oklch(1 0 0 / 0.12)', color: 'var(--color-ink-soft)', background: 'oklch(1 0 0 / 0.04)' }}
        >
          + Add job
        </button>
      }
    >
      <ReconForm vehicleId={vehicleId} onSuccess={() => setOpen(false)} />
    </GlassDialog>
  )
}

function EditReconDialog({ job }: { job: ReconJob }) {
  const [open, setOpen] = useState(false)
  return (
    <GlassDialog
      title="Edit job"
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          onClick={() => setOpen(true)}
          className="text-[11px] transition-colors hover:underline"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          Edit
        </button>
      }
    >
      {open && <ReconForm key={job.id} vehicleId={job.vehicle_id} job={job} onSuccess={() => setOpen(false)} />}
    </GlassDialog>
  )
}

export function ReconJobRow({ job }: { job: ReconJob }) {
  const catColor = CAT_COLORS[job.category as ReconCategory] ?? '#6B7280'
  return (
    <tr
      className="transition-colors hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid var(--color-rule-soft)' }}
    >
      <td className="px-5 py-3.5 text-[12px]" style={{ color: 'var(--color-ink-faint)' }}>
        {shortDate(job.performed_on)}
      </td>
      <td className="px-5 py-3.5">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: `${catColor}1A`, color: catColor }}
        >
          {CAT_LABELS[job.category as ReconCategory] ?? job.category}
        </span>
      </td>
      <td className="px-5 py-3.5 text-[12.5px]" style={{ color: 'var(--color-ink)' }}>
        {job.description}
      </td>
      <td className="hidden px-5 py-3.5 text-[12px] sm:table-cell" style={{ color: 'var(--color-ink-faint)' }}>
        {job.vendor ?? '—'}
      </td>
      <td className="tnum px-5 py-3.5 text-right text-[12.5px] font-semibold" style={{ color: 'var(--color-amber-text)' }}>
        {money(job.cost)}
      </td>
      <td className="px-5 py-3.5 text-center">
        <form action={toggleReconJob}>
          <input type="hidden" name="id" value={job.id} />
          <input type="hidden" name="vehicle_id" value={job.vehicle_id} />
          <input type="hidden" name="completed" value={String(job.completed)} />
          <button
            type="submit"
            aria-label={job.completed ? 'Mark incomplete' : 'Mark complete'}
            className="flex size-5 items-center justify-center rounded-md transition-all hover:scale-110"
            style={
              job.completed
                ? { background: 'var(--color-margin)', border: 'none' }
                : { background: 'transparent', border: '1px solid oklch(1 0 0 / 0.15)' }
            }
          >
            {job.completed && <span aria-hidden className="block text-[10px] leading-none text-white">✓</span>}
          </button>
        </form>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <EditReconDialog job={job} />
          <form action={deleteReconJob}>
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="vehicle_id" value={job.vehicle_id} />
            <button
              type="submit"
              aria-label="Delete job"
              className="text-[11px] transition-colors hover:text-[#EF4444]"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              ✕
            </button>
          </form>
        </div>
      </td>
    </tr>
  )
}
