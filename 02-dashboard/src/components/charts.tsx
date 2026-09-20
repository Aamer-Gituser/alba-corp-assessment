'use client'

import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { MonthlyPerformance, ReconByCategory } from '@/lib/supabase/types'
import { money, moneyCompact, monthLabel } from '@/lib/format'

const BLUE    = '#3B82F6'
const AMBER   = '#F59E0B'
const EMERALD = '#10B981'
const RULE    = 'oklch(1 0 0 / 0.08)'
const LABEL   = '#4A5A6E'
const INK     = '#E2EAF4'

const axis = {
  stroke: 'none',
  tick: { fill: LABEL, fontSize: 11, fontFamily: 'var(--font-jetbrains)' },
  tickLine: false,
  axisLine: { stroke: RULE },
}

function Panel({ label, rows }: { label: string; rows: { key: string; value: string; swatch?: string }[] }) {
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-xl"
      style={{
        background: '#0D1525',
        border: '1px solid oklch(1 0 0 / 0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="eyebrow mb-2">{label}</p>
      {rows.map((row) => (
        <p key={row.key} className="flex items-center gap-2 text-[12px]" style={{ color: INK }}>
          {row.swatch && (
            <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: row.swatch }} />
          )}
          <span style={{ color: LABEL }}>{row.key}</span>
          <span className="tnum ml-auto">{row.value}</span>
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--color-glass)',
        border: '1px solid var(--color-rule)',
        boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.07)',
      }}
    >
      <p className="text-[13px] font-semibold" style={{ color: INK, fontFamily: 'var(--font-display)' }}>{title}</p>
      <p className="mb-5 mt-0.5 text-[11px]" style={{ color: LABEL }}>{sub}</p>
      {children}
    </div>
  )
}

function TableTwin({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <details className="mt-3" style={{ borderTop: '1px solid var(--color-rule)' }}>
      <summary
        className="cursor-pointer pt-2 text-[11.5px]"
        style={{ color: LABEL }}
      >
        Show as table
      </summary>
      <table className="mt-2 w-full text-[12px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="py-1 text-left font-medium" style={{ color: LABEL }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} style={{ borderTop: '1px solid oklch(1 0 0 / 0.05)' }}>
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? 'py-1' : 'tnum py-1'} style={{ color: i === 0 ? INK : LABEL }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

function EmptyPlot({ message }: { message: string }) {
  return (
    <div
      className="flex h-[200px] items-center justify-center rounded-xl"
      style={{ border: '1px dashed oklch(1 0 0 / 0.1)' }}
    >
      <p className="max-w-[28ch] text-center text-[12.5px]" style={{ color: LABEL }}>{message}</p>
    </div>
  )
}

export function MarginByMonth({ data }: { data: MonthlyPerformance[] }) {
  const chart = data.map((row) => ({ month: monthLabel(row.month), margin: Number(row.realised_margin) }))
  const empty = chart.every((r) => r.margin === 0)
  return (
    <ChartCard title="Margin realised" sub="Last 6 months">
      {empty ? (
        <EmptyPlot message="No cars sold yet. Margin appears here once a vehicle is marked sold." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={1} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} width={60} tickFormatter={(v: number) => moneyCompact(v)} />
              <Tooltip
                cursor={{ fill: 'oklch(1 0 0 / 0.04)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel label={String(label)} rows={[{ key: 'Margin', value: money(Number(payload[0].value)), swatch: EMERALD }]} />
                  ) : null
                }
              />
              <Bar dataKey="margin" fill="url(#marginGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
          <TableTwin caption="Margin realised by month" head={['Month', 'Margin']} rows={chart.map((r) => [r.month, money(r.margin)])} />
        </>
      )}
    </ChartCard>
  )
}

export function ReconSpend({ data }: { data: ReconByCategory[] }) {
  const chart = data
    .map((row) => ({ category: row.category, cost: Number(row.total_cost), jobs: Number(row.job_count) }))
    .filter((r) => r.cost > 0)
  return (
    <ChartCard title="Recon spend by category" sub="All time">
      {!chart.length ? (
        <EmptyPlot message="No reconditioning logged yet. Add a job to a vehicle to see the split." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }} barCategoryGap={6}>
              <CartesianGrid stroke={RULE} horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={(v: number) => moneyCompact(v)} />
              <YAxis type="category" dataKey="category" {...axis} width={86} tick={{ fill: INK, fontSize: 12, fontFamily: 'var(--font-inter-tight)' }} />
              <Tooltip
                cursor={{ fill: 'oklch(1 0 0 / 0.04)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel
                      label={String(label)}
                      rows={[
                        { key: 'Spend', value: money(Number(payload[0].value)), swatch: AMBER },
                        { key: 'Jobs', value: String(payload[0].payload.jobs) },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="cost" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {chart.map((row) => <Cell key={row.category} fill={AMBER} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <TableTwin caption="Recon spend by category" head={['Category', 'Spend', 'Jobs']} rows={chart.map((r) => [r.category, money(r.cost), String(r.jobs)])} />
        </>
      )}
    </ChartCard>
  )
}

export function VolumeByMonth({ data }: { data: MonthlyPerformance[] }) {
  const chart = data.map((row) => ({
    month: monthLabel(row.month),
    acquired: Number(row.acquired_count),
    sold: Number(row.sold_count),
  }))
  const empty = chart.every((r) => r.acquired === 0 && r.sold === 0)
  return (
    <ChartCard title="Volume — bought vs sold" sub="Last 6 months">
      {empty ? (
        <EmptyPlot message="No movement in this window yet." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barGap={3}>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} width={36} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'oklch(1 0 0 / 0.04)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel
                      label={String(label)}
                      rows={payload.map((item) => ({
                        key: item.name === 'acquired' ? 'Bought' : 'Sold',
                        value: String(item.value),
                        swatch: item.name === 'acquired' ? BLUE : EMERALD,
                      }))}
                    />
                  ) : null
                }
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconType="circle"
                iconSize={7}
                formatter={(value) => (
                  <span className="text-[11px]" style={{ color: LABEL }}>
                    {value === 'acquired' ? 'Bought' : 'Sold'}
                  </span>
                )}
              />
              <Bar dataKey="acquired" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="sold" fill={EMERALD} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <TableTwin caption="Volume by month" head={['Month', 'Bought', 'Sold']} rows={chart.map((r) => [r.month, String(r.acquired), String(r.sold)])} />
        </>
      )}
    </ChartCard>
  )
}
