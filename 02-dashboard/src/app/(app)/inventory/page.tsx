import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { VehicleEconomics } from '@/lib/supabase/types'
import { money, km, shortDate, stockNumber } from '@/lib/format'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { AddVehicleDialog } from '@/components/vehicle-form'

const STATUS_LABELS: Record<string, string> = {
  sourcing: 'Sourcing',
  reconditioning: 'In recon',
  listed: 'Listed',
  sold: 'Sold',
}

const STATUS_COLORS: Record<string, string> = {
  sourcing: 'bg-paper-edge text-ink-soft',
  reconditioning: 'bg-[#fdeee7] text-[#b8420f]',
  listed: 'bg-[#e7f4f0] text-[#08725b]',
  sold: 'bg-ink text-paper',
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('vehicle_economics')
    .select('*')
    .order('acquired_on', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: vehicles } = await query

  const rows = (vehicles as VehicleEconomics[] | null) ?? []

  return (
    <>
      <RealtimeRefresh />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[1.375rem] font-bold tracking-tight">Inventory</h1>
        <AddVehicleDialog />
      </div>

      {/* Status filter */}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {['all', 'sourcing', 'reconditioning', 'listed', 'sold'].map((s) => {
          const active = (status ?? 'all') === s
          return (
            <Link
              key={s}
              href={s === 'all' ? '/inventory' : `/inventory?status=${s}`}
              className={[
                'rounded px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                active
                  ? 'bg-ink text-paper'
                  : 'bg-surface border border-rule text-ink-soft hover:text-ink',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </Link>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-rule bg-surface px-8 py-16 text-center">
          <p className="text-[15px] font-medium text-ink">
            {status && status !== 'all' ? `No ${STATUS_LABELS[status]?.toLowerCase() ?? status} cars.` : 'No cars on the lot yet.'}
          </p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {!status || status === 'all' ? 'Add the first one to start tracking margin.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-rule bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="eyebrow px-4 py-3 font-normal">Stock</th>
                <th className="eyebrow px-4 py-3 font-normal">Car</th>
                <th className="eyebrow px-4 py-3 font-normal">Status</th>
                <th className="eyebrow hidden px-4 py-3 font-normal sm:table-cell">Mileage</th>
                <th className="eyebrow hidden px-4 py-3 font-normal text-right md:table-cell">Cost basis</th>
                <th className="eyebrow px-4 py-3 font-normal text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v, i) => (
                <tr
                  key={v.id}
                  className="deal-in border-b border-rule last:border-0 hover:bg-paper/60"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                    {stockNumber(v.id)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/inventory/${v.id}`} className="hover:underline">
                      {v.year} {v.make} {v.model}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[v.status] ?? ''}`}
                    >
                      {STATUS_LABELS[v.status] ?? v.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{km(v.mileage_km)}</td>
                  <td className="tnum hidden px-4 py-3 text-right md:table-cell">{money(v.cost_basis)}</td>
                  <td
                    className="tnum px-4 py-3 text-right"
                    style={{
                      color:
                        v.status === 'sold'
                          ? v.realised_margin !== null && v.realised_margin >= 0
                            ? 'var(--color-margin-text)'
                            : 'var(--color-signal-text)'
                          : v.projected_margin !== null && v.projected_margin < 0
                            ? 'var(--color-signal-text)'
                            : 'var(--color-ink-soft)',
                    }}
                  >
                    {v.status === 'sold' ? money(v.realised_margin) : money(v.projected_margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
