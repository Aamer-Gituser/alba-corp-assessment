import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { VehicleEconomics } from '@/lib/supabase/types'
import { money, km, stockNumber } from '@/lib/format'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { AddVehicleDialog } from '@/components/vehicle-form'

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  sourcing:       { label: 'Sourcing',  color: 'var(--color-ink-soft)',   bg: 'oklch(1 0 0 / 0.05)', dot: '#7A8FA8' },
  reconditioning: { label: 'In recon',  color: 'var(--color-amber-text)', bg: 'var(--color-amber-wash)', dot: '#F59E0B' },
  listed:         { label: 'Listed',    color: 'var(--color-blue-text)',   bg: 'var(--color-blue-wash)',  dot: '#3B82F6' },
  sold:           { label: 'Sold',      color: 'var(--color-margin-text)', bg: 'var(--color-margin-wash)', dot: '#10B981' },
}

const FILTERS = ['all', 'sourcing', 'reconditioning', 'listed', 'sold'] as const

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

  // Count per status for badges
  const { data: allVehicles } = await supabase
    .from('vehicle_economics')
    .select('status')

  const counts = ((allVehicles ?? []) as { status: string }[]).reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1
    acc['all'] = (acc['all'] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <RealtimeRefresh />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 fade-up">
        <div>
          <h1
            className="text-[1.75rem] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Inventory
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
            {counts['all'] ?? 0} vehicle{(counts['all'] ?? 0) !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <AddVehicleDialog />
      </div>

      {/* Filter tabs */}
      <div
        className="mb-5 flex flex-wrap gap-1.5 rounded-xl p-1"
        style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--color-rule)', width: 'fit-content' }}
        role="group"
        aria-label="Filter by status"
      >
        {FILTERS.map((s) => {
          const active = (status ?? 'all') === s
          const meta = s === 'all' ? null : STATUS_META[s]
          const count = counts[s] ?? 0
          return (
            <Link
              key={s}
              href={s === 'all' ? '/inventory' : `/inventory?status=${s}`}
              aria-current={active ? 'page' : undefined}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
              style={
                active
                  ? {
                      background: 'oklch(1 0 0 / 0.09)',
                      color: 'var(--color-ink)',
                      boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.12)',
                      fontFamily: 'var(--font-display)',
                    }
                  : {
                      color: 'var(--color-ink-faint)',
                      fontFamily: 'var(--font-display)',
                    }
              }
            >
              {meta && (
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: meta.dot }}
                  aria-hidden
                />
              )}
              {s === 'all' ? 'All' : meta?.label}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{
                    background: active ? 'oklch(1 0 0 / 0.12)' : 'oklch(1 0 0 / 0.06)',
                    color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div
          className="rounded-2xl px-8 py-16 text-center"
          style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--color-rule)' }}
        >
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
            {status && status !== 'all'
              ? `No ${STATUS_META[status]?.label?.toLowerCase() ?? status} cars`
              : 'No cars on the lot yet'}
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
            {!status || status === 'all'
              ? 'Add the first one to start tracking margin.'
              : 'Try a different filter.'}
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
                <th className="eyebrow px-5 py-3.5 text-left font-normal">Stock</th>
                <th className="eyebrow px-5 py-3.5 text-left font-normal">Vehicle</th>
                <th className="eyebrow px-5 py-3.5 text-left font-normal">Status</th>
                <th className="eyebrow hidden px-5 py-3.5 text-left font-normal sm:table-cell">Mileage</th>
                <th className="eyebrow hidden px-5 py-3.5 text-right font-normal md:table-cell">Cost basis</th>
                <th className="eyebrow px-5 py-3.5 text-right font-normal">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v, i) => {
                const meta = STATUS_META[v.status]
                const margin = v.status === 'sold' ? v.realised_margin : v.projected_margin
                const marginColor =
                  v.status === 'sold'
                    ? v.realised_margin !== null && v.realised_margin >= 0
                      ? 'var(--color-margin-text)'
                      : 'var(--color-signal-text)'
                    : v.projected_margin !== null && v.projected_margin < 0
                      ? 'var(--color-signal-text)'
                      : 'var(--color-ink-faint)'

                return (
                  <tr
                    key={v.id}
                    className="deal-in group transition-colors hover:bg-white/[0.025]"
                    style={{
                      borderBottom: '1px solid var(--color-rule-soft)',
                      animationDelay: `${i * 25}ms`,
                    }}
                  >
                    <td className="px-5 py-4" style={{ color: 'var(--color-ink-faint)' }}>
                      <span
                        className="tnum rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ background: 'oklch(1 0 0 / 0.05)', fontFamily: 'var(--font-mono)' }}
                      >
                        {stockNumber(v.id)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/inventory/${v.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
                      >
                        {v.year} {v.make} {v.model}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: meta?.bg, color: meta?.color }}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: meta?.dot }} aria-hidden />
                        {meta?.label ?? v.status}
                      </span>
                    </td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] sm:table-cell"
                      style={{ color: 'var(--color-ink-faint)' }}
                    >
                      {km(v.mileage_km)}
                    </td>
                    <td
                      className="tnum hidden px-5 py-4 text-right text-[12.5px] md:table-cell"
                      style={{ color: 'var(--color-ink-soft)' }}
                    >
                      {money(v.cost_basis)}
                    </td>
                    <td className="tnum px-5 py-4 text-right font-semibold" style={{ color: marginColor }}>
                      {money(margin)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
