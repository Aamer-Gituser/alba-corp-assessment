import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, MonthlyPerformance, ReconByCategory, VehicleEconomics } from '@/lib/supabase/types'
import { money, moneyCompact, km, shortDate, stockNumber } from '@/lib/format'
import { MarginByMonth, ReconSpend, VolumeByMonth } from '@/components/charts'
import { RealtimeRefresh } from '@/components/realtime-refresh'

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
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'signal' | 'margin'
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-surface p-5">
      <p className="eyebrow mb-3">{label}</p>
      <p
        className="tnum text-[1.75rem] font-semibold leading-none"
        style={{
          color:
            tone === 'signal'
              ? 'var(--color-signal-text)'
              : tone === 'margin'
                ? 'var(--color-margin-text)'
                : 'var(--color-ink)',
        }}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[12.5px] text-ink-soft">{sub}</p>}
    </div>
  )
}

export default async function OverviewPage() {
  const { stats, monthly, recon, attention } = await getOverviewData()

  const needsAttention = attention.filter(
    (v) => (v.projected_margin !== null && v.projected_margin < 0) || v.days_in_stock > 60,
  )

  return (
    <>
      <RealtimeRefresh />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[1.375rem] font-bold tracking-tight">Overview</h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Capital in motion, margin in progress.
          </p>
        </div>
      </div>

      {/* KPI tiles */}
      {stats ? (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            label="Capital deployed"
            value={moneyCompact(stats.capital_deployed)}
            sub={`${stats.fleet_count} car${stats.fleet_count !== 1 ? 's' : ''} on the lot`}
          />
          <KpiTile
            label="Recon spend"
            value={moneyCompact(stats.recon_spend_total)}
            tone="signal"
          />
          <KpiTile
            label="Realised margin"
            value={moneyCompact(stats.realised_margin_total)}
            sub={`${stats.sold_count} sold`}
            tone={stats.realised_margin_total >= 0 ? 'margin' : 'signal'}
          />
          <KpiTile
            label="Avg days in stock"
            value={`${Math.round(stats.avg_days_in_stock)} d`}
          />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[var(--radius-card)] bg-paper-edge" />
          ))}
        </div>
      )}

      {/* Charts */}
      {monthly.length > 0 || recon.length > 0 ? (
        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          <MarginByMonth data={monthly} />
          <ReconSpend data={recon} />
          <div className="lg:col-span-2"><VolumeByMonth data={monthly} /></div>
        </div>
      ) : (
        <div className="mb-8 rounded-[var(--radius-card)] border border-rule bg-surface px-8 py-16 text-center">
          <p className="text-[15px] font-medium text-ink">No chart data yet.</p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Add vehicles to start tracking margin and reconditioning spend.
          </p>
        </div>
      )}

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <section aria-labelledby="attention-heading">
          <h2 id="attention-heading" className="eyebrow mb-4">
            Needs attention
          </h2>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-rule bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-rule text-left">
                  <th className="eyebrow px-4 py-2.5 font-normal">Stock</th>
                  <th className="eyebrow px-4 py-2.5 font-normal">Car</th>
                  <th className="eyebrow px-4 py-2.5 font-normal text-right">Days</th>
                  <th className="eyebrow px-4 py-2.5 font-normal text-right">Projected margin</th>
                </tr>
              </thead>
              <tbody>
                {needsAttention.map((v) => (
                  <tr key={v.id} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                      {stockNumber(v.id)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <a href={`/inventory/${v.id}`} className="hover:underline">
                        {v.year} {v.make} {v.model}
                      </a>
                    </td>
                    <td
                      className="px-4 py-3 text-right tabular-nums"
                      style={{
                        color: v.days_in_stock > 60 ? 'var(--color-signal-text)' : undefined,
                      }}
                    >
                      {v.days_in_stock}
                    </td>
                    <td
                      className="px-4 py-3 text-right tabular-nums"
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
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
