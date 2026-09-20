import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, MonthlyPerformance, ReconByCategory, VehicleEconomics } from '@/lib/supabase/types'
import { money, moneyCompact, km, shortDate, stockNumber } from '@/lib/format'
import { MarginByMonth, ReconSpend, VolumeByMonth } from '@/components/charts'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import Link from 'next/link'

async function getOverviewData() {
  const supabase = await createClient()
  const [statsRes, monthlyRes, reconRes, attentionRes] = await Promise.all([
    supabase.rpc('dashboard_stats'),
    supabase.rpc('monthly_performance', { months_back: 6 }),
    supabase.rpc('recon_by_category'),
    supabase
      .from('vehicle_economics')
      .select('id,make,model,year,status,asking_price,cost_basis,projected_margin,days_in_stock,acquired_on')
      .in('status', ['sourcing', 'reconditioning', 'listed'])
      .order('days_in_stock', { ascending: false })
      .limit(8),
  ])
  return {
    stats: (Array.isArray(statsRes.data) ? (statsRes.data as DashboardStats[])[0] : null) ?? null,
    monthly: (monthlyRes.data as MonthlyPerformance[] | null) ?? [],
    recon: (reconRes.data as ReconByCategory[] | null) ?? [],
    attention: (attentionRes.data as VehicleEconomics[] | null) ?? [],
  }
}

function KpiTile({
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  accent: 'blue' | 'amber' | 'emerald' | 'neutral'
  delay?: number
}) {
  const accentMap = {
    blue:    { color: 'var(--color-blue-text)',   wash: 'var(--color-blue-wash)',   border: 'oklch(0.57 0.22 264 / 0.25)' },
    amber:   { color: 'var(--color-amber-text)',  wash: 'var(--color-amber-wash)',  border: 'oklch(0.78 0.17 80 / 0.25)' },
    emerald: { color: 'var(--color-margin-text)', wash: 'var(--color-margin-wash)', border: 'oklch(0.70 0.17 162 / 0.25)' },
    neutral: { color: 'var(--color-ink)',         wash: 'oklch(1 0 0 / 0.03)',      border: 'var(--color-rule)' },
  }
  const { color, wash, border } = accentMap[accent]

  return (
    <div
      className="fade-up card-hover glass-rim relative overflow-hidden rounded-2xl p-5"
      style={{
        background: wash,
        border: `1px solid ${border}`,
        animationDelay: `${delay}ms`,
      }}
    >
      <p className="eyebrow mb-4">{label}</p>
      <p
        className="tnum text-[2rem] font-bold leading-none tracking-tight"
        style={{ color, fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--color-ink-faint)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

const DAY_BADGE = (days: number) => {
  if (days <= 30) return { color: 'var(--color-margin-text)',  bg: 'var(--color-margin-wash)' }
  if (days <= 60) return { color: 'var(--color-amber-text)',   bg: 'var(--color-amber-wash)' }
  return               { color: 'var(--color-signal-text)',   bg: 'var(--color-signal-wash)' }
}

export default async function OverviewPage() {
  const { stats, monthly, recon, attention } = await getOverviewData()

  const needsAttention = attention.filter(
    (v) => (v.projected_margin !== null && v.projected_margin < 0) || v.days_in_stock > 60,
  )

  return (
    <>
      <RealtimeRefresh />

      {/* Page header */}
      <div className="mb-8 fade-up">
        <h1
          className="text-[1.75rem] font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
        >
          Overview
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
          Capital in motion · margin in progress
        </p>
      </div>

      {/* KPI tiles */}
      {stats ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            label="Capital deployed"
            value={moneyCompact(stats.capital_deployed)}
            sub={`${stats.fleet_count} car${stats.fleet_count !== 1 ? 's' : ''} on lot`}
            accent="blue"
            delay={0}
          />
          <KpiTile
            label="Recon spend"
            value={moneyCompact(stats.recon_spend_total)}
            sub={stats.fleet_count > 0 ? `~${moneyCompact(stats.recon_spend_total / Math.max(stats.fleet_count, 1))}/unit` : undefined}
            accent="amber"
            delay={60}
          />
          <KpiTile
            label="Realised margin"
            value={moneyCompact(stats.realised_margin_total)}
            sub={`${stats.sold_count} sold`}
            accent={stats.realised_margin_total >= 0 ? 'emerald' : 'neutral'}
            delay={120}
          />
          <KpiTile
            label="Avg days in stock"
            value={`${Math.round(stats.avg_days_in_stock)} d`}
            sub={stats.avg_days_in_stock > 45 ? 'Above 45-day target' : 'Within target'}
            accent={stats.avg_days_in_stock > 45 ? 'amber' : 'neutral'}
            delay={180}
          />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl"
              style={{ background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--color-rule)' }}
            />
          ))}
        </div>
      )}

      {/* Charts */}
      {monthly.length > 0 || recon.length > 0 ? (
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <MarginByMonth data={monthly} />
          <ReconSpend data={recon} />
          <div className="lg:col-span-2">
            <VolumeByMonth data={monthly} />
          </div>
        </div>
      ) : (
        <div
          className="mb-8 rounded-2xl px-8 py-16 text-center"
          style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--color-rule)' }}
        >
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
            No chart data yet
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-ink-faint)' }}>
            Add vehicles and reconditioning jobs to start tracking margin.
          </p>
        </div>
      )}

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <section aria-labelledby="attention-heading" className="fade-up">
          <div className="mb-4 flex items-center gap-3">
            <h2
              id="attention-heading"
              className="text-[13px] font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              Needs attention
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)' }}
            >
              {needsAttention.length}
            </span>
          </div>

          <div
            className="overflow-hidden rounded-2xl glass-rim"
            style={{ background: 'var(--color-glass)', border: '1px solid var(--color-rule)' }}
          >
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <th className="eyebrow px-5 py-3 text-left font-normal">Stock</th>
                  <th className="eyebrow px-5 py-3 text-left font-normal">Car</th>
                  <th className="eyebrow px-5 py-3 text-right font-normal">Days</th>
                  <th className="eyebrow px-5 py-3 text-right font-normal">Proj. margin</th>
                </tr>
              </thead>
              <tbody>
                {needsAttention.map((v) => {
                  const dayStyle = DAY_BADGE(v.days_in_stock)
                  return (
                    <tr
                      key={v.id}
                      style={{ borderBottom: '1px solid var(--color-rule-soft)' }}
                      className="last:border-0 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>
                        {stockNumber(v.id)}
                      </td>
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--color-ink)' }}>
                        <Link href={`/inventory/${v.id}`} className="hover:underline">
                          {v.year} {v.make} {v.model}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className="tnum rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: dayStyle.bg, color: dayStyle.color }}
                        >
                          {v.days_in_stock}d
                        </span>
                      </td>
                      <td
                        className="tnum px-5 py-3.5 text-right font-semibold"
                        style={{
                          color:
                            v.projected_margin !== null && v.projected_margin < 0
                              ? 'var(--color-signal-text)'
                              : 'var(--color-margin-text)',
                        }}
                      >
                        {money(v.projected_margin)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
