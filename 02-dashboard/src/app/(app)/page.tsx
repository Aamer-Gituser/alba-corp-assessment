import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, MonthlyPerformance, ReconByCategory, VehicleEconomics } from '@/lib/supabase/types'
import { money, moneyCompact, stockNumber } from '@/lib/format'
import { MarginByMonth, ReconSpend, VolumeByMonth } from '@/components/charts'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { Landmark, Hammer, TrendingUp, Timer, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { KpiGrid } from '@/components/kpi-grid'

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

const TONE_COLOR = {
  blue:    'blue',
  amber:   'amber',
  emerald: 'green',
  neutral: 'red',
} as const

function KpiTile({
  label,
  value,
  sub,
  accent,
  icon: Icon,
  progress,
  progressLabel,
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  accent: 'blue' | 'amber' | 'emerald' | 'neutral'
  icon: LucideIcon
  progress: number
  progressLabel?: string
  delay?: number
}) {
  const tone = TONE_COLOR[accent]
  return (
    <div className="kpi-tile fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="kpi-icon" data-tone={tone}><Icon /></span>
        <span />
      </div>
      <p className="section-label mt-5">{label}</p>
      <div className="metric mt-2" data-tone={tone}>{value}</div>
      <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>
        <span>{sub}</span>
        {progressLabel && <span className="font-mono">{progressLabel}</span>}
      </div>
      <div className="meter mt-2"><span data-tone={tone} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} /></div>
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

      {/* Page header */}
      <div className="mb-7 fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Overview</h1>
          </div>
          <Link href="/inventory" className="primary-action text-[13px]">View inventory</Link>
        </div>
      </div>

      {/* KPI tiles */}
      {stats ? (
        <KpiGrid>
          {/* Capital deployed — % of a AED 1M benchmark */}
          <KpiTile
            label="Capital deployed"
            value={moneyCompact(stats.capital_deployed)}
            sub={`${stats.fleet_count} car${stats.fleet_count !== 1 ? 's' : ''} on lot`}
            accent="blue"
            icon={Landmark}
            progress={Math.min(Math.round((stats.capital_deployed / 1_000_000) * 100), 100)}
            progressLabel={`${moneyCompact(stats.capital_deployed)} / AED 1M`}
            delay={0}
          />
          {/* Recon spend — recon as % of capital (target <15%) */}
          {(() => {
            const reconPct = stats.capital_deployed > 0
              ? Math.round((stats.recon_spend_total / stats.capital_deployed) * 100)
              : 0
            return (
              <KpiTile
                label="Recon spend"
                value={moneyCompact(stats.recon_spend_total)}
                sub={stats.fleet_count > 0 ? `~${moneyCompact(stats.recon_spend_total / Math.max(stats.fleet_count, 1))}/unit` : 'No units'}
                accent="amber"
                icon={Hammer}
                progress={reconPct}
                progressLabel={`${reconPct}% of capital`}
                delay={60}
              />
            )
          })()}
          {/* Realised margin — margin % on sold units (target >12%) */}
          {(() => {
            const soldCost = stats.sold_count > 0 ? stats.capital_deployed / Math.max(stats.fleet_count, 1) * stats.sold_count : 1
            const marginPct = soldCost > 0
              ? Math.round((stats.realised_margin_total / soldCost) * 100)
              : 0
            return (
              <KpiTile
                label="Realised margin"
                value={moneyCompact(stats.realised_margin_total)}
                sub={`${stats.sold_count} sold`}
                accent={stats.realised_margin_total >= 0 ? 'emerald' : 'neutral'}
                icon={TrendingUp}
                progress={Math.min(Math.abs(marginPct), 100)}
                progressLabel={`${marginPct > 0 ? '+' : ''}${marginPct}% margin`}
                delay={120}
              />
            )
          })()}
          {/* Avg days in stock — progress toward 45-day target (lower = better, fill inverted) */}
          {(() => {
            const days = Math.round(stats.avg_days_in_stock)
            const pct = Math.min(Math.round((days / 90) * 100), 100)
            return (
              <KpiTile
                label="Avg days in stock"
                value={`${days} d`}
                sub={days > 45 ? 'Above 45-day target' : 'Within target'}
                accent={days > 60 ? 'neutral' : days > 45 ? 'amber' : 'emerald'}
                icon={Timer}
                progress={pct}
                progressLabel={`${days}d / 90d max`}
                delay={180}
              />
            )
          })()}
        </KpiGrid>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mb-8 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <MarginByMonth data={monthly} />
          <ReconSpend data={recon} />
          <div className="xl:col-span-2">
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
          <div className="glass-panel overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-rule)' }}>
              <div className="flex items-center gap-2.5">
                <span className="inline-block size-2 rounded-full animate-pulse" style={{ background: 'var(--color-signal-text)' }} />
                <h2 id="attention-heading" className="text-[13.5px] font-700" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Needs attention</h2>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--color-signal-wash)', color: 'var(--color-signal-text)' }}>{needsAttention.length} alert{needsAttention.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Rows */}
            <div>
              {needsAttention.map((v, i) => {
                const isNegMargin = v.projected_margin !== null && v.projected_margin < 0
                const isOverdue = v.days_in_stock > 60
                const risk = isNegMargin ? 'signal' : 'amber'
                return (
                  <Link
                    key={v.id}
                    href={`/inventory/${v.id}`}
                    className="attn-row"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    {/* Left accent bar */}
                    <span className="attn-accent" data-risk={risk} />

                    {/* Vehicle info */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="attn-thumb" data-risk={risk}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{v.year} {v.make} {v.model}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-ink-faint)' }}>
                          {stockNumber(v.id)} · {v.status}
                        </p>
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex items-center gap-3 text-right">
                      {isNegMargin && (
                        <span className="attn-flag" data-risk="signal">Neg margin</span>
                      )}
                      {isOverdue && (
                        <span className="attn-flag" data-risk="amber">Stale {v.days_in_stock}d</span>
                      )}
                      <div className="w-[80px]">
                        <p className="font-mono text-[12px] font-semibold" style={{ color: isNegMargin ? 'var(--color-signal-text)' : 'var(--color-margin-text)' }}>
                          {v.projected_margin !== null ? (v.projected_margin >= 0 ? '+' : '') + money(v.projected_margin) : '—'}
                        </p>
                        <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-ink-faint)' }}>proj margin</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--color-ink-faint)', flexShrink: 0 }}><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
