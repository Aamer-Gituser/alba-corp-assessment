import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ReconJob, VehicleEconomics } from '@/lib/supabase/types'
import { money, km, shortDate, stockNumber } from '@/lib/format'
import { CostStack } from '@/components/cost-stack'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { EditVehicleDialog, DeleteVehicleButton } from '@/components/vehicle-form'
import { AddReconDialog, ReconJobRow } from '@/components/recon-form'

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  sourcing:       { label: 'Sourcing',  color: 'var(--color-ink-soft)',   bg: 'oklch(1 0 0 / 0.05)', dot: '#7A8FA8' },
  reconditioning: { label: 'In recon',  color: 'var(--color-amber-text)', bg: 'var(--color-amber-wash)', dot: '#F59E0B' },
  listed:         { label: 'Listed',    color: 'var(--color-blue-text)',   bg: 'var(--color-blue-wash)',  dot: '#3B82F6' },
  sold:           { label: 'Sold',      color: 'var(--color-margin-text)', bg: 'var(--color-margin-wash)', dot: '#10B981' },
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'var(--color-glass)',
        border: '1px solid var(--color-rule)',
        boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.07)',
      }}
    >
      {children}
    </div>
  )
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [econRes, jobsRes] = await Promise.all([
    supabase.from('vehicle_economics').select('*').eq('id', id).maybeSingle(),
    supabase.from('reconditioning_jobs').select('*').eq('vehicle_id', id).order('performed_on', { ascending: false }),
  ])

  const v = econRes.data as VehicleEconomics | null
  if (!v) notFound()

  const jobs = (jobsRes.data as ReconJob[] | null) ?? []
  const price = v.status === 'sold' ? v.sold_price : v.asking_price
  const meta = STATUS_META[v.status]

  const marginVal = v.status === 'sold' ? v.realised_margin : v.projected_margin
  const marginColor =
    marginVal !== null && marginVal >= 0 ? 'var(--color-margin-text)' : 'var(--color-signal-text)'

  return (
    <>
      <RealtimeRefresh />

      {/* Breadcrumb */}
      <div className="mb-6 fade-up">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-[12.5px] transition-colors hover:text-[var(--color-ink)]"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          <span aria-hidden>←</span> Inventory
        </Link>
      </div>

      {/* Vehicle header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 fade-up fade-up-1">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="tnum rounded-md px-2 py-0.5 text-[10.5px] font-medium"
              style={{ background: 'oklch(1 0 0 / 0.05)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
            >
              {stockNumber(v.id)}
            </span>
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: meta?.bg, color: meta?.color }}
            >
              <span className="size-1.5 rounded-full" style={{ background: meta?.dot }} aria-hidden />
              {meta?.label}
            </span>
          </div>
          <h1
            className="mt-3 text-[1.75rem] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            {v.year} {v.make} {v.model}
          </h1>
          <div className="mt-2 flex flex-wrap gap-3 text-[12.5px]" style={{ color: 'var(--color-ink-faint)' }}>
            <span>{km(v.mileage_km)}</span>
            {v.body_type && <span>· {v.body_type}</span>}
            <span>
              · Acquired {shortDate(v.acquired_on)}
              {v.sold_on ? ` · Sold ${shortDate(v.sold_on)}` : ` · ${v.days_in_stock} days in stock`}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <EditVehicleDialog vehicle={v} />
          <DeleteVehicleButton vehicleId={v.id} />
        </div>
      </div>

      {/* Economics card */}
      <GlassCard className="mb-5 fade-up fade-up-2">
        <h2 className="eyebrow mb-5">Cost engine</h2>
        <CostStack
          acquisition={v.acquisition_price}
          recon={v.recon_total}
          target={price}
          targetLabel={v.status === 'sold' ? 'Realised margin' : 'Projected margin'}
        />

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-[13px] sm:grid-cols-4">
          {[
            { label: 'Acquisition', value: money(v.acquisition_price), color: 'var(--color-blue-text)' },
            { label: 'Recon total', value: money(v.recon_total), color: 'var(--color-amber-text)' },
            { label: 'Cost basis',  value: money(v.cost_basis),  color: 'var(--color-ink)', bold: true },
            {
              label: v.status === 'sold' ? 'Realised margin' : 'Projected margin',
              value: money(marginVal),
              color: marginColor,
              bold: true,
            },
            ...(v.asking_price ? [{ label: 'Asking price', value: money(v.asking_price), color: 'var(--color-ink)' }] : []),
            ...(v.sold_price   ? [{ label: 'Sold price',   value: money(v.sold_price),   color: 'var(--color-margin-text)' }] : []),
          ].map(({ label, value, color, bold }) => (
            <div key={label}>
              <dt className="eyebrow mb-1">{label}</dt>
              <dd
                className="tnum text-[14px]"
                style={{ color, fontWeight: bold ? 700 : 400, fontFamily: 'var(--font-mono)' }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      {/* Recon jobs */}
      <section aria-labelledby="recon-heading" className="fade-up fade-up-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2
              id="recon-heading"
              className="text-[14px] font-semibold"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              Reconditioning jobs
            </h2>
            {jobs.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'var(--color-amber-wash)', color: 'var(--color-amber-text)' }}
              >
                {jobs.length}
              </span>
            )}
            {jobs.length > 0 && (
              <span
                className="tnum text-[12px] font-semibold"
                style={{ color: 'var(--color-amber-text)' }}
              >
                {money(v.recon_total)} total
              </span>
            )}
          </div>
          <AddReconDialog vehicleId={v.id} />
        </div>

        {jobs.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--color-rule)' }}
          >
            <p className="text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
              No recon jobs yet — add the first one to start tracking preparation costs.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: 'var(--color-glass)',
              border: '1px solid var(--color-rule)',
              boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.07)',
            }}
          >
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <th className="eyebrow px-5 py-3 text-left font-normal">Date</th>
                  <th className="eyebrow px-5 py-3 text-left font-normal">Category</th>
                  <th className="eyebrow px-5 py-3 text-left font-normal">Description</th>
                  <th className="eyebrow hidden px-5 py-3 text-left font-normal sm:table-cell">Vendor</th>
                  <th className="eyebrow px-5 py-3 text-right font-normal">Cost</th>
                  <th className="eyebrow px-5 py-3 text-center font-normal">Done</th>
                  <th className="sr-only px-5 py-3">Actions</th>
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
        <GlassCard className="mt-5 fade-up fade-up-4">
          <h2 className="eyebrow mb-3">Notes</h2>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
            {v.notes}
          </p>
        </GlassCard>
      )}
    </>
  )
}
