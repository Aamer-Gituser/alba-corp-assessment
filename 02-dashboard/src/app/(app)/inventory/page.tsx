import Link from 'next/link'
import { CarFront, ChevronRight, Search } from 'lucide-react'
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
  searchParams: Promise<{ status?: string; from?: string; to?: string; q?: string }>
}) {
  const { status, from, to, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('vehicle_economics')
    .select('*')
    .order('acquired_on', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (from) query = query.gte('acquired_on', from)
  if (to)   query = query.lte('acquired_on', to)
  if (q?.trim()) {
    const term = q.trim().replace(/[,%_()]/g, '')
    if (term) query = query.or(`make.ilike.%${term}%,model.ilike.%${term}%,body_type.ilike.%${term}%`)
  }

  const { data: vehicles } = await query
  const rows = (vehicles as VehicleEconomics[] | null) ?? []

  // Count per status for badges
  const { data: allVehicles } = await supabase
    .from('vehicle_economics')
    .select('status,cost_basis')

  const allRows = (allVehicles ?? []) as { status: string; cost_basis: number | null }[]
  const counts = allRows.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1
    acc['all'] = (acc['all'] ?? 0) + 1
    return acc
  }, {})
  const totalCostBasis = allRows.reduce((total, vehicle) => total + Number(vehicle.cost_basis ?? 0), 0)

  return (
    <>
      <RealtimeRefresh />

      {/* Header */}
      <div className="mb-7 fade-up">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h1 className="page-title truncate">Vehicle inventory</h1>
            <p className="page-subtitle">
              {counts['all'] ?? 0} vehicles tracked · {money(totalCostBasis)} total cost basis
            </p>
          </div>
          <AddVehicleDialog />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <form method="GET" action="/inventory" className="relative min-w-[220px] flex-1">
          {status && status !== 'all' && <input type="hidden" name="status" value={status} />}
          {from && <input type="hidden" name="from" value={from} />}
          {to && <input type="hidden" name="to" value={to} />}
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2" style={{ color: 'var(--color-ink-faint)' }} />
          <input
            name="q"
            defaultValue={q ?? ''}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:ring-2"
            style={{ background: 'oklch(1 0 0 / 70%)', border: '1px solid var(--color-rule)', color: 'var(--color-ink)' }}
            placeholder="Search make, model or body type…"
            aria-label="Search inventory"
          />
        </form>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1 rounded-xl p-1" style={{ background: 'oklch(1 0 0 / 55%)', border: '1px solid var(--color-rule)' }} role="group" aria-label="Filter by status">
          {FILTERS.map((s) => {
            const active = (status ?? 'all') === s
            const meta = s === 'all' ? null : STATUS_META[s]
            const count = counts[s] ?? 0
            const dateQ = [from && `from=${from}`, to && `to=${to}`].filter(Boolean).join('&')
            const href = s === 'all'
              ? (dateQ ? `/inventory?${dateQ}` : '/inventory')
              : `/inventory?status=${s}${dateQ ? `&${dateQ}` : ''}`
            return (
              <Link key={s} href={href} aria-current={active ? 'page' : undefined}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                style={active
                  ? { background: 'oklch(0.91 0.04 251 / .78)', color: 'var(--color-ink)', boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.12)', fontFamily: 'var(--font-display)' }
                  : { color: 'var(--color-ink-faint)', fontFamily: 'var(--font-display)' }}
              >
                {meta && <span className="size-1.5 rounded-full" style={{ background: meta.dot }} aria-hidden />}
                {s === 'all' ? 'All' : meta?.label}
                {count > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{ background: active ? 'oklch(1 0 0 / .7)' : 'oklch(0.94 0.024 252 / .75)', color: active ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Date range filter */}
        <form method="GET" action="/inventory" className="flex items-center gap-2">
          {status && status !== 'all' && <input type="hidden" name="status" value={status} />}
          <label className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px]" style={{ background: 'oklch(1 0 0 / 70%)', border: '1px solid var(--color-rule)' }}>
            <span style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>From</span>
            <input type="date" name="from" defaultValue={from ?? ''} className="bg-transparent text-[12px] outline-none" style={{ color: 'var(--color-ink)' }} />
          </label>
          <label className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px]" style={{ background: 'oklch(1 0 0 / 70%)', border: '1px solid var(--color-rule)' }}>
            <span style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>To</span>
            <input type="date" name="to" defaultValue={to ?? ''} className="bg-transparent text-[12px] outline-none" style={{ color: 'var(--color-ink)' }} />
          </label>
          <button type="submit" className="rounded-xl px-3 py-2 text-[12px] font-semibold transition-all hover:bg-white/80" style={{ background: 'oklch(0.91 0.04 251 / .78)', border: '1px solid var(--color-rule)', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>Apply</button>
          {(from || to) && (
            <Link href={status && status !== 'all' ? `/inventory?status=${status}` : '/inventory'} className="rounded-xl px-3 py-2 text-[12px] font-semibold transition-all" style={{ color: 'var(--color-ink-faint)', border: '1px solid var(--color-rule)' }}>Clear</Link>
          )}
        </form>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="glass-panel px-8 py-16 text-center">
          <p className="text-[15px] font-semibold">
            {status && status !== 'all' ? `No ${STATUS_META[status]?.label?.toLowerCase() ?? status} cars` : 'No cars on the lot yet'}
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
            {!status || status === 'all' ? 'Add the first one to start tracking margin.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="inventory-table w-full">
              <colgroup>
                <col style={{ width: '88px' }} />
                <col style={{ width: '300px' }} />
                <col style={{ width: '108px' }} />
                <col style={{ width: '72px' }} />
                <col style={{ width: '128px' }} />
                <col style={{ width: '128px' }} />
                <col style={{ width: '128px' }} />
                <col style={{ width: '40px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-left">Stock</th>
                  <th className="text-left">Vehicle</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Days</th>
                  <th className="text-right">Cost basis</th>
                  <th className="text-right">Asking</th>
                  <th className="text-right">Margin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const margin = v.status === 'sold' ? v.realised_margin : v.projected_margin
                  const marginPos = margin !== null && margin >= 0
                  return (
                    <tr key={v.id}>
                      <td className="text-left"><span className="stock-tag">{stockNumber(v.id)}</span></td>
                      <td className="text-left">
                        <Link href={`/inventory/${v.id}`} className="flex items-center gap-3">
                          <span className="car-thumb"><CarFront /></span>
                          <span>
                            <strong style={{ fontFamily: 'var(--font-display)' }}>{v.year} {v.make} {v.model}</strong>
                            <small>{km(v.mileage_km)} · {v.body_type ?? 'Vehicle'}</small>
                          </span>
                        </Link>
                      </td>
                      <td className="text-left">
                        <span className="status-pill" data-status={v.status}>
                          <i />{STATUS_META[v.status]?.label ?? v.status}
                        </span>
                      </td>
                      <td className="money text-right">
                        <span style={{ color: v.days_in_stock > 60 ? 'var(--color-signal-text)' : 'var(--color-ink-faint)' }}>
                          {v.days_in_stock}d
                        </span>
                      </td>
                      <td className="money text-right">{money(v.cost_basis)}</td>
                      <td className="money text-right">{money(v.asking_price)}</td>
                      <td className="text-right">
                        {margin !== null ? (
                          <span className={marginPos ? 'margin-pill' : 'age-pill'}>
                            {marginPos ? '+' : ''}{money(margin)}
                          </span>
                        ) : <span style={{ color: 'var(--color-ink-faint)' }}>-</span>}
                      </td>
                      <td className="text-center">
                        <Link href={`/inventory/${v.id}`} aria-label={`Open ${v.make} ${v.model}`} className="inline-flex rounded-lg p-2 transition-colors hover:bg-white">
                          <ChevronRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
