'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  MonthlyPerformance,
  ReconByCategory,
} from '@/lib/supabase/types'
import { money, moneyCompact, monthLabel } from '@/lib/format'

const INK = '#10161d'
const INK_FAINT = '#5f6975'  /* 4.88:1 on paper — WCAG AA PASS */
const RULE = '#e2e7ed'
const SIGNAL = '#e05a26'
const MARGIN = '#0b8f72'

const axis = {
  stroke: RULE,
  tick: { fill: INK_FAINT, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: RULE },
}

/** One tooltip shape for every chart, so hovering feels the same everywhere. */
function Panel({
  label,
  rows,
}: {
  label: string
  rows: { key: string; value: string; swatch?: string }[]
}) {
  return (
    <div className="border border-rule bg-surface px-3 py-2 shadow-sm">
      <p className="eyebrow mb-1.5">{label}</p>
      {rows.map((row) => (
        <p key={row.key} className="flex items-center gap-2 text-[13px] text-ink">
          {row.swatch && (
            <span
              aria-hidden
              className="inline-block size-2"
              style={{ background: row.swatch }}
            />
          )}
          <span className="text-ink-soft">{row.key}</span>
          <span className="tnum ml-auto">{row.value}</span>
        </p>
      ))}
    </div>
  )
}

function TableTwin({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: string[][]
}) {
  return (
    <details className="mt-3 border-t border-rule pt-2">
      <summary className="cursor-pointer text-[12px] text-ink-soft hover:text-ink">
        Show as table
      </summary>
      <table className="mt-2 w-full text-[12.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-ink-faint">
            {head.map((h) => (
              <th key={h} scope="col" className="py-1 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-rule/60">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? 'py-1' : 'tnum py-1'}>
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

/**
 * Margin realised per month — one measure, one series, so no legend and no
 * second axis. Volume lives in its own chart rather than being folded onto a
 * second y-scale here.
 */
export function MarginByMonth({ data }: { data: MonthlyPerformance[] }) {
  const chart = data.map((row) => ({
    month: monthLabel(row.month),
    margin: Number(row.realised_margin),
  }))
  const empty = chart.every((row) => row.margin === 0)

  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-surface p-5">
      <p className="eyebrow mb-0.5">Margin realised</p>
      <p className="mb-4 text-[12px] text-ink-soft">Last 6 months</p>
      {empty ? (
        <EmptyPlot message="No cars sold yet. Margin appears here once a vehicle is marked sold." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis
                {...axis}
                width={62}
                tickFormatter={(value: number) => moneyCompact(value)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16,22,29,0.04)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel
                      label={String(label)}
                      rows={[
                        {
                          key: 'Margin realised',
                          value: money(Number(payload[0].value)),
                          swatch: MARGIN,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="margin" fill={MARGIN} radius={[4, 4, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
          <TableTwin
            caption="Margin realised by month"
            head={['Month', 'Margin']}
            rows={chart.map((row) => [row.month, money(row.margin)])}
          />
        </>
      )}
    </div>
  )
}

/**
 * Where reconditioning money goes. Nominal categories, so every bar takes the
 * same hue — darkening by value would double-encode the bar length.
 */
export function ReconSpend({ data }: { data: ReconByCategory[] }) {
  const chart = data
    .map((row) => ({
      category: row.category,
      cost: Number(row.total_cost),
      jobs: Number(row.job_count),
    }))
    .filter((row) => row.cost > 0)

  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-surface p-5">
      <p className="eyebrow mb-0.5">Recon spend by category</p>
      <p className="mb-4 text-[12px] text-ink-soft">All time</p>
      {!chart.length ? (
        <EmptyPlot message="No reconditioning logged yet. Add a job to a vehicle to see the split." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={chart}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
              barCategoryGap={6}
            >
              <CartesianGrid stroke={RULE} horizontal={false} />
              <XAxis
                type="number"
                {...axis}
                tickFormatter={(value: number) => moneyCompact(value)}
              />
              <YAxis
                type="category"
                dataKey="category"
                {...axis}
                width={86}
                tick={{ fill: INK, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16,22,29,0.04)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel
                      label={String(label)}
                      rows={[
                        {
                          key: 'Spend',
                          value: money(Number(payload[0].value)),
                          swatch: SIGNAL,
                        },
                        {
                          key: 'Jobs',
                          value: String(payload[0].payload.jobs),
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chart.map((row) => (
                  <Cell key={row.category} fill={SIGNAL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <TableTwin
            caption="Reconditioning spend by category"
            head={['Category', 'Spend', 'Jobs']}
            rows={chart.map((row) => [row.category, money(row.cost), String(row.jobs)])}
          />
        </>
      )}
    </div>
  )
}

/**
 * Cars in versus cars out. Two series, but both are counts on the same scale,
 * so they share one axis honestly.
 */
export function VolumeByMonth({ data }: { data: MonthlyPerformance[] }) {
  const chart = data.map((row) => ({
    month: monthLabel(row.month),
    acquired: Number(row.acquired_count),
    sold: Number(row.sold_count),
  }))
  const empty = chart.every((row) => row.acquired === 0 && row.sold === 0)

  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-surface p-5">
      <p className="eyebrow mb-0.5">Volume — bought vs sold</p>
      <p className="mb-4 text-[12px] text-ink-soft">Last 6 months</p>
      {empty ? (
        <EmptyPlot message="No movement in this window yet." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barGap={2}>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} width={40} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(16,22,29,0.04)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel
                      label={String(label)}
                      rows={payload.map((item) => ({
                        key: item.name === 'acquired' ? 'Bought' : 'Sold',
                        value: String(item.value),
                        swatch: item.name === 'acquired' ? SIGNAL : MARGIN,
                      }))}
                    />
                  ) : null
                }
              />
              <Legend
                verticalAlign="top"
                align="left"
                height={28}
                iconType="square"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[12px] text-ink-soft">
                    {value === 'acquired' ? 'Bought' : 'Sold'}
                  </span>
                )}
              />
              <Bar dataKey="acquired" fill={SIGNAL} radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="sold" fill={MARGIN} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <TableTwin
            caption="Vehicles bought and sold by month"
            head={['Month', 'Bought', 'Sold']}
            rows={chart.map((row) => [row.month, String(row.acquired), String(row.sold)])}
          />
        </>
      )}
    </div>
  )
}

function EmptyPlot({ message }: { message: string }) {
  return (
    <div className="flex h-[210px] items-center justify-center border border-dashed border-rule px-6">
      <p className="max-w-[28ch] text-center text-[13px] text-ink-soft">{message}</p>
    </div>
  )
}
