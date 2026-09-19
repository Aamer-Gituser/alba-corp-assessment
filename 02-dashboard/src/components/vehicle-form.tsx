'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VehicleEconomics, VehicleStatus } from '@/lib/supabase/types'
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  EMPTY_FORM_STATE,
  type FormState,
} from '@/app/(app)/actions'

const STATUSES: { value: VehicleStatus; label: string }[] = [
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'reconditioning', label: 'In recon' },
  { value: 'listed', label: 'Listed' },
  { value: 'sold', label: 'Sold' },
]

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
        <Field
          label="Year"
          name="year"
          type="number"
          required
          defaultValue={initial?.year ?? new Date().getFullYear()}
          min={1950}
          max={new Date().getFullYear() + 1}
        />
        <Field
          label="Mileage (km)"
          name="mileage_km"
          type="number"
          required
          defaultValue={initial?.mileage_km ?? 0}
          min={0}
        />
      </div>

      <Field label="Body type" name="body_type" defaultValue={initial?.body_type ?? ''} />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Acquisition price (AED)"
          name="acquisition_price"
          type="number"
          required
          defaultValue={initial?.acquisition_price ?? ''}
          min={0}
        />
        <Field
          label="Acquired on"
          name="acquired_on"
          type="date"
          required
          defaultValue={initial?.acquired_on?.slice(0, 10) ?? today}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block" htmlFor="v-status">
          Status
        </label>
        <select
          id="v-status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleStatus)}
          className="w-full rounded border border-rule bg-surface px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-ink"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Asking price (AED)"
        name="asking_price"
        type="number"
        defaultValue={initial?.asking_price ?? ''}
        min={0}
      />

      {status === 'sold' && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Sold price (AED)"
            name="sold_price"
            type="number"
            required
            defaultValue={initial?.sold_price ?? ''}
            min={0}
          />
          <Field
            label="Sold on"
            name="sold_on"
            type="date"
            required
            defaultValue={initial?.sold_on?.slice(0, 10) ?? today}
          />
        </div>
      )}

      <Field
        label="Notes"
        name="notes"
        as="textarea"
        defaultValue={initial?.notes ?? ''}
        rows={2}
      />

      {state.error && (
        <p role="alert" className="text-[12.5px]" style={{ color: 'var(--color-signal-text)' }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-opacity disabled:opacity-50"
      >
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
}) {
  const id = `vf-${name}`
  const cls =
    'w-full rounded border border-rule bg-surface px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-ink'
  return (
    <div>
      <label className="eyebrow mb-1.5 block" htmlFor={id}>
        {label}
        {required && <span aria-hidden className="ml-0.5" style={{ color: 'var(--color-signal-text)' }}>*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          rows={rows ?? 3}
          defaultValue={defaultValue ?? ''}
          className={cls}
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
          className={cls}
        />
      )}
    </div>
  )
}

function Dialog({
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
        className="w-full max-w-lg rounded-[4px] border border-rule bg-surface p-6 shadow-xl backdrop:bg-ink/30 backdrop:backdrop-blur-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="text-ink-soft hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children(close)}
      </dialog>
    </>
  )
}

export function AddVehicleDialog() {
  return (
    <Dialog
      title="Add vehicle"
      trigger={
        <button className="rounded bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
          Add vehicle
        </button>
      }
    >
      {(close) => (
        <VehicleForm action={createVehicle} onSuccess={close} />
      )}
    </Dialog>
  )
}

export function EditVehicleDialog({ vehicle }: { vehicle: VehicleEconomics }) {
  return (
    <Dialog
      title="Edit vehicle"
      trigger={
        <button className="rounded border border-rule bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-paper">
          Edit
        </button>
      }
    >
      {(close) => (
        <VehicleForm initial={vehicle} action={updateVehicle} onSuccess={close} />
      )}
    </Dialog>
  )
}

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [pending, setPending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="rounded border border-rule px-4 py-2 text-[13px] font-medium text-ink-soft hover:border-[#b8420f] hover:text-[#b8420f]"
      >
        Delete
      </button>
    )
  }

  return (
    <form
      action={deleteVehicle}
      onSubmit={() => setPending(true)}
      className="flex gap-2"
    >
      <input type="hidden" name="id" value={vehicleId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded px-4 py-2 text-[13px] font-semibold text-paper disabled:opacity-50"
        style={{ background: 'var(--color-signal-text)' }}
      >
        {pending ? 'Deleting…' : 'Confirm delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirmed(false)}
        className="rounded border border-rule px-3 py-2 text-[13px] text-ink-soft"
      >
        Cancel
      </button>
    </form>
  )
}
