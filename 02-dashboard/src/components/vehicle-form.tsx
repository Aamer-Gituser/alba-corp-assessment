'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { VehicleEconomics, VehicleStatus } from '@/lib/supabase/types'
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '@/app/(app)/actions'
import { EMPTY_FORM_STATE, type FormState } from '@/lib/form-state'

const STATUSES: { value: VehicleStatus; label: string }[] = [
  { value: 'sourcing',       label: 'Sourcing' },
  { value: 'reconditioning', label: 'In recon' },
  { value: 'listed',         label: 'Listed' },
  { value: 'sold',           label: 'Sold' },
]

const cls = 'field'
const clsStyle = {}

function VehicleForm({
  initial,
  action,
  onSuccess,
}: {
  initial?: Partial<VehicleEconomics>
  action: (prev: FormState, data: FormData) => Promise<FormState>
  onSuccess: () => void
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE)
  const [status, setStatus] = useState<VehicleStatus>(initial?.status ?? 'sourcing')

  useEffect(() => {
    if (state.ok) onSuccess()
  }, [state.ok, onSuccess])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Make" name="make" required defaultValue={initial?.make} />
        <Field label="Model" name="model" required defaultValue={initial?.model} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Year" name="year" type="number" required defaultValue={initial?.year ?? new Date().getFullYear()} min={1950} max={new Date().getFullYear() + 1} />
        <Field label="Mileage (km)" name="mileage_km" type="number" required defaultValue={initial?.mileage_km ?? 0} min={0} />
      </div>
      <Field label="Body type" name="body_type" defaultValue={initial?.body_type ?? ''} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Acquisition price (AED)" name="acquisition_price" type="number" required defaultValue={initial?.acquisition_price ?? ''} min={0} step="0.01" />
        <Field label="Acquired on" name="acquired_on" type="date" required defaultValue={initial?.acquired_on?.slice(0, 10) ?? today} />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Status</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleStatus)}
          className={cls}
          style={clsStyle}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <Field label="Asking price (AED)" name="asking_price" type="number" defaultValue={initial?.asking_price ?? ''} min={0} step="0.01" />

      {status === 'sold' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sold price (AED)" name="sold_price" type="number" required defaultValue={initial?.sold_price ?? ''} min={0} step="0.01" />
          <Field label="Sold on" name="sold_on" type="date" required defaultValue={initial?.sold_on?.slice(0, 10) ?? today} />
        </div>
      )}

      <Field label="Notes" name="notes" as="textarea" defaultValue={initial?.notes ?? ''} rows={2} />

      {state.error && (
        <p
          role="alert"
          className="rounded-xl px-3.5 py-2.5 text-[12.5px]"
          style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)', border: '1px solid oklch(0.63 0.22 25 / 0.3)' }}
        >
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="primary-action w-full justify-center py-2.5 disabled:opacity-50">
        {pending ? 'Saving…' : initial?.id ? 'Save changes' : 'Add vehicle'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  as,
  rows,
  min,
  max,
  step,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | number | null
  as?: 'textarea'
  rows?: number
  min?: number
  max?: number
  step?: string
}) {
  const id = `vf-${name}`
  return (
    <div>
      <label className="eyebrow mb-1.5 block" htmlFor={id}>
        {label}
        {required && <span aria-hidden className="ml-1" style={{ color: 'var(--color-signal-text)' }}>*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          rows={rows ?? 3}
          defaultValue={defaultValue ?? ''}
          className={cls}
          style={clsStyle}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue ?? ''}
          min={min}
          max={max}
          step={step}
          className={cls}
          style={clsStyle}
        />
      )}
    </div>
  )
}

function GlassDialog({
  title,
  trigger,
  children,
}: {
  title: string
  trigger: React.ReactNode
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <dialog
        ref={ref}
        onClose={close}
        className="glass-modal m-auto w-full max-w-lg rounded-[var(--radius-card)] p-0"
      >
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              {title}
            </h2>
            <button
              onClick={close}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-lg text-[12px] transition-colors"
              style={{ color: 'var(--color-ink-faint)', background: 'oklch(0 0 0 / 5%)' }}
            >
              ✕
            </button>
          </div>
          {children(close)}
        </div>
      </dialog>
    </>
  )
}

export function AddVehicleDialog() {
  return (
    <GlassDialog
      title="Add vehicle"
      trigger={
        <button className="primary-action">+ Add vehicle</button>
      }
    >
      {(close) => <VehicleForm action={createVehicle} onSuccess={close} />}
    </GlassDialog>
  )
}

export function EditVehicleDialog({ vehicle }: { vehicle: VehicleEconomics }) {
  return (
    <GlassDialog
      title="Edit vehicle"
      trigger={
        <button className="rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white/60" style={{ borderColor: 'var(--color-rule)', color: 'var(--color-ink-soft)' }}>Edit</button>
      }
    >
      {(close) => <VehicleForm initial={vehicle} action={updateVehicle} onSuccess={close} />}
    </GlassDialog>
  )
}

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [pending, setPending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!confirmed) {
    return (
      <button onClick={() => setConfirmed(true)} className="rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors" style={{ borderColor: 'oklch(0.63 0.22 25 / 0.3)', color: 'var(--color-signal-text)', background: 'var(--color-signal-wash)' }}>
        Delete
      </button>
    )
  }

  return (
    <form action={deleteVehicle} onSubmit={() => setPending(true)} className="flex gap-2">
      <input type="hidden" name="id" value={vehicleId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl px-4 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', color: '#fff' }}
      >
        {pending ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirmed(false)}
        className="rounded-xl px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
        style={{ border: '1px solid oklch(1 0 0 / 0.1)', color: 'var(--color-ink-soft)' }}
      >
        Cancel
      </button>
    </form>
  )
}
