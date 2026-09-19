'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { RECON_CATEGORIES, VEHICLE_STATUSES } from '@/lib/supabase/types'

export type FormState = { error: string | null; ok: boolean }
export const EMPTY_FORM_STATE: FormState = { error: null, ok: false }

const optionalNumber = z
  .string()
  .transform((v) => (v.trim() === '' ? null : Number(v)))
  .pipe(z.number().nonnegative('Prices cannot be negative.').nullable())

const optionalText = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))

const vehicleSchema = z
  .object({
    make: z.string().trim().min(1, 'Make is required.'),
    model: z.string().trim().min(1, 'Model is required.'),
    year: z.coerce
      .number()
      .int()
      .min(1950, 'Year looks wrong.')
      .max(new Date().getFullYear() + 1, 'Year looks wrong.'),
    mileage_km: z.coerce.number().int().nonnegative('Mileage cannot be negative.'),
    body_type: optionalText,
    acquisition_price: z.coerce
      .number()
      .nonnegative('Acquisition price cannot be negative.'),
    asking_price: optionalNumber,
    sold_price: optionalNumber,
    status: z.enum(VEHICLE_STATUSES as [string, ...string[]]),
    acquired_on: z.string().min(1, 'Acquisition date is required.'),
    sold_on: optionalText,
    notes: optionalText,
  })
  // Mirrors the sold_fields_consistent CHECK constraint, so the user gets a
  // readable message instead of a Postgres error.
  .superRefine((value, ctx) => {
    if (value.status === 'sold' && (value.sold_price === null || !value.sold_on)) {
      ctx.addIssue({
        code: 'custom',
        message: 'A sold car needs both a sale price and a sale date.',
      })
    }
    if (value.status !== 'sold' && (value.sold_price !== null || value.sold_on)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Clear the sale price and date unless the status is Sold.',
      })
    }
    if (value.sold_on && value.sold_on < value.acquired_on) {
      ctx.addIssue({ code: 'custom', message: 'A car cannot sell before it was bought.' })
    }
  })

function readVehicle(formData: FormData) {
  return vehicleSchema.safeParse({
    make: formData.get('make') ?? '',
    model: formData.get('model') ?? '',
    year: formData.get('year') ?? '',
    mileage_km: formData.get('mileage_km') ?? '0',
    body_type: formData.get('body_type') ?? '',
    acquisition_price: formData.get('acquisition_price') ?? '',
    asking_price: formData.get('asking_price') ?? '',
    sold_price: formData.get('sold_price') ?? '',
    status: formData.get('status') ?? 'sourcing',
    acquired_on: formData.get('acquired_on') ?? '',
    sold_on: formData.get('sold_on') ?? '',
    notes: formData.get('notes') ?? '',
  })
}

export async function createVehicle(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = readVehicle(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message, ok: false }

  const supabase = await createClient()
  const { error } = await supabase.from('vehicles').insert(parsed.data)

  if (error) return { error: error.message, ok: false }

  revalidatePath('/inventory')
  revalidatePath('/')
  return { error: null, ok: true }
}

export async function updateVehicle(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing vehicle reference.', ok: false }

  const parsed = readVehicle(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message, ok: false }

  const supabase = await createClient()
  const { error } = await supabase.from('vehicles').update(parsed.data).eq('id', id)

  if (error) return { error: error.message, ok: false }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)
  revalidatePath('/')
  return { error: null, ok: true }
}

export async function deleteVehicle(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  await supabase.from('vehicles').delete().eq('id', id)

  revalidatePath('/inventory')
  revalidatePath('/')
  redirect('/inventory')
}

const reconSchema = z.object({
  vehicle_id: z.string().uuid('Missing vehicle reference.'),
  category: z.enum(RECON_CATEGORIES as [string, ...string[]]),
  description: z.string().trim().min(1, 'Describe the work briefly.'),
  cost: z.coerce.number().nonnegative('Cost cannot be negative.'),
  vendor: optionalText,
  performed_on: z.string().min(1, 'Date is required.'),
  completed: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
})

export async function createReconJob(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = reconSchema.safeParse({
    vehicle_id: formData.get('vehicle_id') ?? '',
    category: formData.get('category') ?? 'mechanical',
    description: formData.get('description') ?? '',
    cost: formData.get('cost') ?? '',
    vendor: formData.get('vendor') ?? '',
    performed_on: formData.get('performed_on') ?? '',
    completed: formData.get('completed') ?? 'false',
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message, ok: false }

  const supabase = await createClient()
  const { error } = await supabase.from('reconditioning_jobs').insert(parsed.data)

  if (error) return { error: error.message, ok: false }

  revalidatePath(`/inventory/${parsed.data.vehicle_id}`)
  revalidatePath('/')
  return { error: null, ok: true }
}

export async function toggleReconJob(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const vehicleId = String(formData.get('vehicle_id') ?? '')
  const completed = formData.get('completed') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from('reconditioning_jobs')
    .update({ completed: !completed })
    .eq('id', id)

  revalidatePath(`/inventory/${vehicleId}`)
}

export async function deleteReconJob(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const vehicleId = String(formData.get('vehicle_id') ?? '')
  if (!id) return

  const supabase = await createClient()
  await supabase.from('reconditioning_jobs').delete().eq('id', id)

  revalidatePath(`/inventory/${vehicleId}`)
  revalidatePath('/')
}
