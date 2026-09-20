import { createClient } from '@/lib/supabase/server'
import type { MonthlyPerformance, ReconByCategory, VehicleEconomics } from '@/lib/supabase/types'
import { MarginByMonth, ReconSpend, VolumeByMonth } from '@/components/charts'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { money, moneyCompact, stockNumber } from '@/lib/format'
import Link from 'next/link'
import { TrendingUp, BarChart2, Zap, Wrench } from 'lucide-react'

export const metadata = { title: 'Analytics | Forecourt', description: 'Dealership profitability and inventory velocity analytics.' }

const TONE: Record<string, string> = { blue: 'var(--color-blue-text)', amber: 'var(--color-amber-text)', green: 'var(--color-margin-text)', red: 'var(--color-signal-text)' }

function StatTile({
  label, value, sub, tone, icon: Icon,
}: {
  label: string
  value: string
  sub: string
  tone: 'blue' | 'amber' | 'green' | 'red'
  icon: React.ElementType
}) {
  return (
    <div className="glass-panel p-5 fade-up" style={{ minHeight: 130 }}>
      <div className="flex items-start justify-between">
        <span style={{
          display: 'grid', placeItems: 'center',
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: `color-mix(in oklch, ${TONE[tone]} 12%, white)`,
          color: TONE[tone],
          boxShadow: '0 1px 0 oklch(1 0 0 / 0.9) inset',
        }}>
          <Icon size={16} />
        </span>
      </div>
      <p className="section-label mt-4">{label}</p>
      <p style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 'clamp(1.2rem,2vw,1.6rem)', fontWeight: 700, color: TONE[tone], marginTop: 4, lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: 6 }}>{sub}</p>
    </div>
  )
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const [monthlyRes, reconRes, vehiclesRes] = await Promise.all([
    supabase.rpc('monthly_performance', { months_back: 12 }),
    supabase.rpc('recon_by_category'),
    supabase.from('vehicle_economics').select('*').order('realised_margin', { ascending: false }),
  ])

  const monthly = (monthlyRes.data as MonthlyPerformance[] | null) ?? []
  const recon   = (reconRes.data as ReconByCategory[] | null) ?? []
  const vehicles = (vehiclesRes.data as VehicleEconomics[] | null) ?? []
  const failed = monthlyRes.error || reconRes.error

  /* ── Derived metrics ── */
  const sold = vehicles.filter(v => v.status === 'sold')
  const active = vehicles.filter(v => v.status !== 'sold')

  const totalRevenue   = sold.reduce((s, v) => s + (v.sold_price ?? 0), 0)
  const totalMargin    = sold.reduce((s, v) => s + (v.realised_margin ?? 0), 0)
  const totalCostSold  = sold.reduce((s, v) => s + v.cost_basis, 0)
  const avgMarginPct   = totalCostSold > 0 ? (totalMargin / totalCostSold) * 100 : 0
  const totalRecon     = recon.reduce((s, r) => s + Number(r.total_cost), 0)
  const reconPerUnit   = vehicles.length > 0 ? totalRecon / vehicles.length : 0
  const sellThrough    = vehicles.length > 0 ? (sold.length / vehicles.length) * 100 : 0

  /* Top performers — sold with highest margin */
  const topPerformers = [...sold]
    .sort((a, b) => (b.realised_margin ?? 0) - (a.realised_margin ?? 0))
    .slice(0, 5)

  /* Slowest movers — active sorted by days */
  const slowestMovers = [...active]
    .sort((a, b) => b.days_in_stock - a.days_in_stock)
    .slice(0, 5)

  return (
    <>
      <RealtimeRefresh />

      {/* Header */}
      <div className="mb-7 fade-up">
        <h1 className="page-title">Analytics</h1>
      </div>

      {failed ? (
        <div role="alert" className="glass rounded-xl p-5 text-sm" style={{ color: 'var(--color-signal-text)' }}>
          Analytics could not be loaded. Refresh and verify database migrations are applied.
        </div>
      ) : (
        <>
          {/* ── Summary KPIs ── */}
          <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4" style={{ animationDelay: '0ms' }}>
            <StatTile
              label="Total revenue"
              value={moneyCompact(totalRevenue)}
              sub={`${sold.length} units sold`}
              tone="blue"
              icon={BarChart2}
            />
            <StatTile
              label="Avg margin %"
              value={`${avgMarginPct.toFixed(1)}%`}
              sub={`${moneyCompact(totalMargin)} total margin`}
              tone={avgMarginPct >= 12 ? 'green' : avgMarginPct >= 6 ? 'amber' : 'red'}
              icon={TrendingUp}
            />
            <StatTile
              label="Sell-through rate"
              value={`${sellThrough.toFixed(0)}%`}
              sub={`${sold.length} of ${vehicles.length} units`}
              tone={sellThrough >= 50 ? 'green' : sellThrough >= 30 ? 'amber' : 'red'}
              icon={Zap}
            />
            <StatTile
              label="Avg recon / unit"
              value={moneyCompact(reconPerUnit)}
              sub={`${moneyCompact(totalRecon)} total spend`}
              tone="amber"
              icon={Wrench}
            />
          </div>

          {/* ── Charts ── */}
          <div className="mb-7 grid gap-4 lg:grid-cols-2">
            <MarginByMonth data={monthly} />
            <ReconSpend data={recon} />
            <div className="lg:col-span-2">
              <VolumeByMonth data={monthly} />
            </div>
          </div>

          {/* ── Performance tables ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top performers */}
            <div className="glass-panel overflow-hidden fade-up">
              <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: 'var(--color-rule)' }}>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: 'var(--color-margin-text)' }} />
                  <h2 className="text-[13.5px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Top performers</h2>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>by realised margin</span>
              </div>
              {topPerformers.length === 0 ? (
                <p className="p-6 text-center text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>No sold vehicles yet.</p>
              ) : (
                <div>
                  {topPerformers.map((v, i) => {
                    const marginPct = v.cost_basis > 0 ? ((v.realised_margin ?? 0) / v.cost_basis) * 100 : 0
                    return (
                      <Link key={v.id} href={`/inventory/${v.id}`}
                        className="flex items-center gap-3 border-b px-5 py-3 transition-colors hover:bg-white/40"
                        style={{ borderColor: i < topPerformers.length - 1 ? 'var(--color-rule-soft)' : 'transparent' }}
                      >
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--color-margin-wash)', color: 'var(--color-margin-text)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{v.year} {v.make} {v.model}</p>
                          <p className="text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>{stockNumber(v.id)} · {v.days_in_stock}d</p>
                        </span>
                        <span>
                          <p className="text-right font-mono text-[12.5px] font-semibold" style={{ color: 'var(--color-margin-text)' }}>+{money(v.realised_margin ?? 0)}</p>
                          <p className="text-right text-[10.5px]" style={{ color: 'var(--color-ink-faint)' }}>{marginPct.toFixed(1)}% margin</p>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Slowest movers */}
            <div className="glass-panel overflow-hidden fade-up" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: 'var(--color-rule)' }}>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full animate-pulse" style={{ background: 'var(--color-signal-text)' }} />
                  <h2 className="text-[13.5px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Slowest movers</h2>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>active, by days in stock</span>
              </div>
              {slowestMovers.length === 0 ? (
                <p className="p-6 text-center text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>No active inventory.</p>
              ) : (
                <div>
                  {slowestMovers.map((v, i) => {
                    const isRisk = v.days_in_stock > 60
                    const isWarn = v.days_in_stock > 45
                    const dayColor = isRisk ? 'var(--color-signal-text)' : isWarn ? 'var(--color-amber-text)' : 'var(--color-ink-faint)'
                    const dayBg   = isRisk ? 'var(--color-signal-wash)' : isWarn ? 'var(--color-amber-wash)' : 'oklch(0.93 0.018 252 / 85%)'
                    return (
                      <Link key={v.id} href={`/inventory/${v.id}`}
                        className="flex items-center gap-3 border-b px-5 py-3 transition-colors hover:bg-white/40"
                        style={{ borderColor: i < slowestMovers.length - 1 ? 'var(--color-rule-soft)' : 'transparent' }}
                      >
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: dayBg, color: dayColor, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{v.year} {v.make} {v.model}</p>
                          <p className="text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>{stockNumber(v.id)} · {v.status}</p>
                        </span>
                        <span>
                          <p className="text-right font-mono text-[13px] font-semibold" style={{ color: dayColor }}>{v.days_in_stock}d</p>
                          <p className="text-right text-[10.5px]" style={{ color: 'var(--color-ink-faint)' }}>{money(v.cost_basis)} basis</p>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
