import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ReconJob, VehicleEconomics } from '@/lib/supabase/types'
import { money, km, shortDate, stockNumber } from '@/lib/format'
import { CostStack } from '@/components/cost-stack'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { EditVehicleDialog, DeleteVehicleButton } from '@/components/vehicle-form'
import { AddReconDialog, ReconJobRow } from '@/components/recon-form'

const STATUS_LABELS: Record<string, string> = {
  sourcing: 'Sourcing',
  reconditioning: 'In recon',
  listed: 'Listed',
  sold: 'Sold',
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [econRes, jobsRes] = await Promise.all([
    supabase.from('vehicle_economics').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('reconditioning_jobs')
      .select('*')
      .eq('vehicle_id', id)
      .order('performed_on', { ascending: false }),
  ])

  const v = econRes.data as VehicleEconomics | null
  if (!v) notFound()

  const jobs = (jobsRes.data as ReconJob[] | null) ?? []

  const price = v.status === 'sold' ? v.sold_price : v.asking_price

  return (
    <>
      <RealtimeRefresh />

      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/inventory"
          className="text-[13px] text-ink-soft hover:text-ink hover:underline"
        >
          ← Inventory
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-ink-soft">{stockNumber(v.id)}</p>
          <h1 className="mt-0.5 text-[1.5rem] font-bold tracking-tight">
            {v.year} {v.make} {v.model}
          </h1>
          <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-ink-soft">
            <span>{km(v.mileage_km)}</span>
            {v.body_type && <span>· {v.body_type}</span>}
            <span>
              · Acquired {shortDate(v.acquired_on)}
              {v.sold_on ? ` · Sold ${shortDate(v.sold_on)}` : ` · ${v.days_in_stock} days in stock`}
            </span>
          </div>
          <p className="mt-2">
            <span
              className={[
                'inline-block rounded px-2 py-0.5 text-[11px] font-semibold',
                v.status === 'listed' || v.status === 'sold'
                  ? 'bg-[#e7f4f0] text-[#08725b]'
                  : v.status === 'reconditioning'
                    ? 'bg-[#fdeee7] text-[#b8420f]'
                    : 'bg-paper-edge text-ink-soft',
              ].join(' ')}
            >
              {STATUS_LABELS[v.status]}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <EditVehicleDialog vehicle={v} />
          <DeleteVehicleButton vehicleId={v.id} />
        </div>
      </div>

      {/* Cost stack — the signature element */}
      <div className="mb-8 rounded-[var(--radius-card)] border border-rule bg-surface p-6">
        <h2 className="eyebrow mb-5">Economics</h2>
        <CostStack
          acquisition={v.acquisition_price}
          recon={v.recon_total}
          target={price}
          targetLabel={v.status === 'sold' ? 'Realised margin' : 'Projected margin'}
        />

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-4">
          <div>
            <dt className="eyebrow">Acquisition</dt>
            <dd className="tnum mt-1 text-ink">{money(v.acquisition_price)}</dd>
          </div>
          <div>
            <dt className="eyebrow">Recon total</dt>
            <dd className="tnum mt-1" style={{ color: 'var(--color-signal-text)' }}>
              {money(v.recon_total)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Cost basis</dt>
            <dd className="tnum mt-1 font-semibold text-ink">{money(v.cost_basis)}</dd>
          </div>
          <div>
            <dt className="eyebrow">{v.status === 'sold' ? 'Realised margin' : 'Projected margin'}</dt>
            <dd
              className="tnum mt-1 font-semibold"
              style={{
                color:
                  (v.status === 'sold' ? v.realised_margin : v.projected_margin) !== null &&
                  (v.status === 'sold' ? v.realised_margin! : v.projected_margin!) >= 0
                    ? 'var(--color-margin-text)'
                    : 'var(--color-signal-text)',
              }}
            >
              {v.status === 'sold' ? money(v.realised_margin) : money(v.projected_margin)}
            </dd>
          </div>
          {v.asking_price && (
            <div>
              <dt className="eyebrow">Asking price</dt>
              <dd className="tnum mt-1 text-ink">{money(v.asking_price)}</dd>
            </div>
          )}
          {v.sold_price && (
            <div>
              <dt className="eyebrow">Sold price</dt>
              <dd className="tnum mt-1 text-ink">{money(v.sold_price)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Reconditioning jobs */}
      <section aria-labelledby="recon-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recon-heading" className="text-[15px] font-semibold">
            Reconditioning jobs
            {jobs.length > 0 && (
              <span className="ml-2 text-[12px] font-normal text-ink-soft">
                ({jobs.length})
              </span>
            )}
          </h2>
          <AddReconDialog vehicleId={v.id} />
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-rule bg-surface px-6 py-10 text-center">
            <p className="text-[14px] text-ink-soft">
              No recon jobs yet. Add the first one to start tracking preparation costs.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-rule bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-rule text-left">
                  <th className="eyebrow px-4 py-2.5 font-normal">Date</th>
                  <th className="eyebrow px-4 py-2.5 font-normal">Category</th>
                  <th className="eyebrow px-4 py-2.5 font-normal">Description</th>
                  <th className="eyebrow hidden px-4 py-2.5 font-normal sm:table-cell">Vendor</th>
                  <th className="eyebrow px-4 py-2.5 font-normal text-right">Cost</th>
                  <th className="eyebrow px-4 py-2.5 font-normal text-center">Done</th>
                  <th className="sr-only px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <ReconJobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {v.notes && (
        <div className="mt-8">
          <h2 className="eyebrow mb-2">Notes</h2>
          <p className="text-[13px] text-ink-soft">{v.notes}</p>
        </div>
      )}
    </>
  )
}
