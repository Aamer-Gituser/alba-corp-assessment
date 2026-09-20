'use client'

import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { MonthlyPerformance, ReconByCategory } from '@/lib/supabase/types'
import { money, moneyCompact, monthLabel } from '@/lib/format'
import { useState } from 'react'

/* ── Design tokens ── */
const BLUE    = '#3B6EF5'
const BLUE2   = '#6B9AF9'
const AMBER   = '#D58A19'
const AMBER2  = '#F0AC45'
const EMERALD = '#1E9B5C'
const EMERALD2= '#4BBFA0'
const RULE    = 'oklch(0.78 0.025 252 / 0.35)'
const LABEL   = '#66758A'
const INK     = '#1A2235'

const axis = {
  stroke: 'none',
  tick: { fill: LABEL, fontSize: 11, fontFamily: 'var(--font-ibm-mono)' },
  tickLine: false,
  axisLine: false,
}

/* ── Tooltip panel ── */
function Panel({ label, rows }: { label: string; rows: { key: string; value: string; swatch?: string }[] }) {
  return (
    <div style={{
      background: 'oklch(1 0 0 / .97)',
      border: '1px solid oklch(0.78 0.025 252 / 0.5)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 16px 40px oklch(0.2 0.04 256 / 0.16), 0 1px 0 oklch(1 0 0 / 0.9) inset',
      backdropFilter: 'blur(24px)',
      minWidth: 150,
    }}>
      <p style={{ fontSize: 10, fontWeight: 750, letterSpacing: '0.1em', textTransform: 'uppercase', color: LABEL, marginBottom: 8 }}>{label}</p>
      {rows.map((row) => (
        <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          {row.swatch && <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.swatch, flexShrink: 0 }} />}
          <span style={{ fontSize: 12, color: LABEL, flex: 1 }}>{row.key}</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-ibm-mono)', fontWeight: 600, color: INK }}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Time filter spans ── */
type Span = '1M' | '3M' | '6M' | 'All'
const SPANS: Span[] = ['1M', '3M', '6M', 'All']

function TimeFilter({ value, onChange }: { value: Span; onChange: (s: Span) => void }) {
  return (
    <div style={{
      display: 'inline-flex', gap: 2, padding: 3,
      background: 'oklch(0.935 0.018 252 / 70%)',
      border: '1px solid oklch(0.78 0.025 252 / 0.45)',
      borderRadius: 10,
    }}>
      {SPANS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            padding: '3px 9px', borderRadius: 7, fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-display)', cursor: 'pointer', border: 'none',
            background: value === s ? 'oklch(1 0 0 / 92%)' : 'transparent',
            color: value === s ? INK : LABEL,
            boxShadow: value === s ? '0 1px 3px oklch(0.2 0.04 256 / 0.10)' : 'none',
            transition: 'background .15s, color .15s',
          }}
        >{s}</button>
      ))}
    </div>
  )
}

/* ── Chart card ── */
function ChartCard({
  title, total, filter, onFilterChange, children,
}: {
  title: string
  total?: string
  filter?: Span
  onFilterChange?: (s: Span) => void
  children: React.ReactNode
}) {
  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-display)', color: INK, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{title}</p>
          {total && (
            <span style={{
              fontFamily: 'var(--font-ibm-mono)', fontSize: 12.5, fontWeight: 700, color: INK,
              background: 'oklch(0.935 0.018 252 / 80%)', borderRadius: 7,
              padding: '2px 8px', border: '1px solid var(--color-rule)', flexShrink: 0,
            }}>{total}</span>
          )}
        </div>
        {filter && onFilterChange && (
          <TimeFilter value={filter} onChange={onFilterChange} />
        )}
      </div>
      <div style={{ padding: '14px 4px 4px' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Slice data to span ── */
function sliceToSpan<T>(data: T[], span: Span): T[] {
  if (span === 'All') return data
  const n = span === '1M' ? 1 : span === '3M' ? 3 : 6
  return data.slice(-n)
}

/* ── Data table (collapsible) ── */
function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ margin: '0 16px 16px', borderTop: '1px solid oklch(0.78 0.025 252 / 0.3)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ fontSize: 11, color: LABEL, paddingTop: 10, paddingBottom: open ? 8 : 0, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600 }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}>›</span>
        {open ? 'Hide' : 'Show'} data table
      </button>
      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }} aria-label={caption}>
          <thead>
            <tr style={{ background: 'oklch(0.94 0.018 252 / 55%)' }}>
              {head.map((h, i) => (
                <th key={h} style={{
                  padding: '6px 10px', textAlign: i === 0 ? 'left' : 'right',
                  fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: LABEL, fontFamily: 'var(--font-display)',
                  borderBottom: '1px solid oklch(0.78 0.025 252 / 0.35)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row[0]} style={{ background: ri % 2 === 1 ? 'oklch(0.97 0.01 252 / 35%)' : 'transparent' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '7px 10px', fontSize: 12.5,
                    textAlign: ci === 0 ? 'left' : 'right',
                    color: ci === 0 ? INK : LABEL,
                    fontFamily: ci > 0 ? 'var(--font-ibm-mono)' : 'inherit',
                    fontWeight: ci > 0 ? 600 : 500,
                    borderBottom: ri < rows.length - 1 ? '1px solid oklch(0.78 0.025 252 / 0.2)' : 'none',
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function EmptyPlot({ message }: { message: string }) {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 16px', borderRadius: 12, border: '1px dashed oklch(0.78 0.025 252 / 0.45)' }}>
      <p style={{ maxWidth: '28ch', textAlign: 'center', fontSize: 12.5, color: LABEL, lineHeight: 1.5 }}>{message}</p>
    </div>
  )
}

/* ── Margin by Month ── */
export function MarginByMonth({ data }: { data: MonthlyPerformance[] }) {
  const [span, setSpan] = useState<Span>('6M')
  const all = data.map((row) => ({ month: monthLabel(row.month), margin: Number(row.realised_margin) }))
  const chart = sliceToSpan(all, span)
  const empty = chart.every((r) => r.margin === 0)
  const total = chart.reduce((s, r) => s + r.margin, 0)
  const maxVal = Math.max(...chart.map(r => r.margin), 0)

  return (
    <ChartCard title="Margin realised" total={empty ? undefined : moneyCompact(total)} filter={span} onFilterChange={setSpan}>
      {empty ? (
        <div style={{ padding: '0 16px' }}><EmptyPlot message="No cars sold yet. Margin appears here once a vehicle is marked sold." /></div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
              <defs>
                {chart.map((r, i) => (
                  <linearGradient key={i} id={`mg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={r.margin === maxVal ? EMERALD2 : EMERALD} stopOpacity={1} />
                    <stop offset="100%" stopColor={EMERALD} stopOpacity={0.55} />
                  </linearGradient>
                ))}
                <filter id="glow-emerald">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" {...axis} tick={{ fill: LABEL, fontSize: 11.5, fontFamily: 'var(--font-display)', fontWeight: 600 }} />
              <YAxis {...axis} width={64} tickFormatter={(v: number) => moneyCompact(v)} />
              <Tooltip
                cursor={{ fill: 'oklch(0.55 0.22 258 / 0.05)', radius: 6 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel label={String(label)} rows={[{ key: 'Margin', value: money(Number(payload[0].value)), swatch: EMERALD }]} />
                  ) : null
                }
              />
              <Bar dataKey="margin" radius={[8, 8, 2, 2]} maxBarSize={44} isAnimationActive animationEasing="ease-out" animationDuration={600}>
                {chart.map((r, i) => (
                  <Cell
                    key={i}
                    fill={`url(#mg${i})`}
                    filter={r.margin === maxVal ? 'url(#glow-emerald)' : undefined}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DataTable caption="Margin realised by month" head={['Month', 'Margin']} rows={chart.map((r) => [r.month, money(r.margin)])} />
        </>
      )}
    </ChartCard>
  )
}

/* ── Recon Spend ── */
export function ReconSpend({ data }: { data: ReconByCategory[] }) {
  // Recon is by category (not time-series), so filter pill acts as "top N"
  const [span, setSpan] = useState<Span>('All')
  const all = data
    .map((row) => ({ category: row.category, cost: Number(row.total_cost), jobs: Number(row.job_count) }))
    .filter((r) => r.cost > 0)
    .sort((a, b) => b.cost - a.cost)
  const chart = span === '1M' ? all.slice(0, 3) : span === '3M' ? all.slice(0, 5) : all
  const total = all.reduce((s, r) => s + r.cost, 0)
  const maxVal = chart[0]?.cost ?? 1

  return (
    <ChartCard title="Recon spend by category" total={chart.length ? moneyCompact(total) : undefined} filter={span} onFilterChange={setSpan}>
      {!chart.length ? (
        <div style={{ padding: '0 16px' }}><EmptyPlot message="No reconditioning logged yet. Add a job to a vehicle to see the split." /></div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(chart.length * 42 + 24, 200)}>
            <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }} barCategoryGap={10}>
              <defs>
                {chart.map((r, i) => (
                  <linearGradient key={i} id={`rg${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={r.cost === maxVal ? 1 : 0.75} />
                    <stop offset="100%" stopColor={AMBER2} stopOpacity={r.cost === maxVal ? 0.9 : 0.55} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={RULE} horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={(v: number) => moneyCompact(v)} />
              <YAxis
                type="category" dataKey="category" {...axis} width={80}
                tick={{ fill: INK, fontSize: 12.5, fontFamily: 'var(--font-display)', fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'oklch(0.55 0.22 258 / 0.05)', radius: 4 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <Panel
                      label={String(label)}
                      rows={[
                        { key: 'Spend', value: money(Number(payload[0].value)), swatch: AMBER },
                        { key: 'Jobs',  value: String(payload[0].payload.jobs) },
                        { key: '% of total', value: `${Math.round((Number(payload[0].value) / total) * 100)}%` },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="cost" radius={[0, 8, 8, 0]} maxBarSize={26} isAnimationActive animationEasing="ease-out" animationDuration={700}>
                {chart.map((r, i) => <Cell key={r.category} fill={`url(#rg${i})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DataTable caption="Recon spend by category" head={['Category', 'Spend', 'Jobs']} rows={chart.map((r) => [r.category, money(r.cost), String(r.jobs)])} />
        </>
      )}
    </ChartCard>
  )
}

/* ── Volume by Month ── */
export function VolumeByMonth({ data }: { data: MonthlyPerformance[] }) {
  const [span, setSpan] = useState<Span>('6M')
  const all = data.map((row) => ({
    month: monthLabel(row.month),
    acquired: Number(row.acquired_count),
    sold: Number(row.sold_count),
  }))
  const chart = sliceToSpan(all, span)
  const empty = chart.every((r) => r.acquired === 0 && r.sold === 0)
  const totalBought = chart.reduce((s, r) => s + r.acquired, 0)
  const totalSold   = chart.reduce((s, r) => s + r.sold, 0)

  return (
    <ChartCard title="Volume — bought vs sold" filter={span} onFilterChange={setSpan}>
      {empty ? (
        <div style={{ padding: '0 16px' }}><EmptyPlot message="No movement in this window yet." /></div>
      ) : (
        <>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, borderRadius:8, padding:'4px 10px', background:'oklch(0.88 0.08 252 / 70%)', border:'1px solid oklch(0.7 0.1 252 / 30%)', fontSize:12, fontWeight:700, color: BLUE, fontFamily:'var(--font-display)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:BLUE }} />
              {totalBought} bought
            </span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, borderRadius:8, padding:'4px 10px', background:'oklch(0.9 0.07 162 / 70%)', border:'1px solid oklch(0.7 0.14 162 / 30%)', fontSize:12, fontWeight:700, color: EMERALD, fontFamily:'var(--font-display)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:EMERALD }} />
              {totalSold} sold
            </span>
            {totalBought > 0 && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, borderRadius:8, padding:'4px 10px', background:'oklch(0.93 0.018 252 / 75%)', border:'1px solid var(--color-rule)', fontSize:12, fontWeight:700, color: LABEL, fontFamily:'var(--font-display)' }}>
                {Math.round((totalSold / totalBought) * 100)}% conversion
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} margin={{ top: 4, right: 20, bottom: 0, left: -12 }} barGap={4} barCategoryGap="30%">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE2} stopOpacity={1} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD2} stopOpacity={1} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" {...axis} tick={{ fill: LABEL, fontSize: 11.5, fontFamily: 'var(--font-display)', fontWeight: 600 }} />
              <YAxis {...axis} width={28} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'oklch(0.55 0.22 258 / 0.05)', radius: 6 }}
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
                verticalAlign="top" align="right" height={32} iconType="circle" iconSize={7}
                wrapperStyle={{ paddingRight: 16 }}
                formatter={(value) => (
                  <span style={{ fontSize: 11.5, color: LABEL, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    {value === 'acquired' ? 'Bought' : 'Sold'}
                  </span>
                )}
              />
              <Bar dataKey="acquired" fill="url(#blueGrad)"  radius={[6, 6, 2, 2]} maxBarSize={22} isAnimationActive animationEasing="ease-out" animationDuration={600} />
              <Bar dataKey="sold"     fill="url(#greenGrad)" radius={[6, 6, 2, 2]} maxBarSize={22} isAnimationActive animationEasing="ease-out" animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
          <DataTable caption="Volume by month" head={['Month', 'Bought', 'Sold']} rows={chart.map((r) => [r.month, String(r.acquired), String(r.sold)])} />
        </>
      )}
    </ChartCard>
  )
}
