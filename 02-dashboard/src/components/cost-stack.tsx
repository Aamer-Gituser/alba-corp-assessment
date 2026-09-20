'use client'

import { money } from '@/lib/format'

export function CostStack({
  acquisition,
  recon,
  target,
  targetLabel,
}: {
  acquisition: number
  recon: number
  target: number | null
  targetLabel: string
}) {
  const basis = acquisition + recon
  const span = Math.max(basis, target ?? 0) || 1
  const margin = target === null ? null : target - basis
  const underwater = margin !== null && margin < 0

  const pct = (value: number) => `${Math.max((value / span) * 100, 0).toFixed(2)}%`

  return (
    <div>
      {/* Animated segmented bar */}
      <div className="relative h-8 w-full overflow-hidden rounded-xl" style={{ background: 'oklch(1 0 0 / 0.05)' }}>
        {/* Acquisition */}
        <div
          className="bar-grow absolute left-0 top-0 h-full"
          style={{
            width: pct(acquisition),
            background: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 100%)',
            animationDuration: '0.7s',
          }}
          title={`Bought ${money(acquisition)}`}
        />
        {/* Recon */}
        {recon > 0 && (
          <div
            className="bar-grow absolute top-0 h-full"
            style={{
              left: pct(acquisition),
              width: pct(recon),
              background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)',
              animationDuration: '0.7s',
              animationDelay: '0.1s',
              borderLeft: '2px solid oklch(0 0 0 / 0.3)',
            }}
            title={`Reconditioning ${money(recon)}`}
          />
        )}
        {/* Margin */}
        {margin !== null && margin > 0 && (
          <div
            className="bar-grow absolute top-0 h-full"
            style={{
              left: pct(basis),
              width: pct(margin),
              background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
              animationDuration: '0.7s',
              animationDelay: '0.2s',
              borderLeft: '2px solid oklch(0 0 0 / 0.3)',
            }}
            title={`${targetLabel} ${money(margin)}`}
          />
        )}
        {/* Underwater overlay */}
        {underwater && (
          <div
            className="absolute right-0 top-0 h-full"
            style={{
              width: pct(Math.abs(margin!)),
              background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
              borderLeft: '2px solid oklch(0 0 0 / 0.3)',
            }}
          />
        )}
        {/* Inner shine */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.15)' }}
        />
      </div>

      {/* Legend row */}
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-4">
        <LegendRow swatch="#3B82F6" label="Bought" value={money(acquisition)} />
        <LegendRow swatch="#F59E0B" label="Recon" value={money(recon)} />
        <LegendRow swatch="oklch(1 0 0 / 0.12)" label="Cost basis" value={money(basis)} />
        <LegendRow
          swatch={underwater ? '#EF4444' : '#10B981'}
          label={targetLabel}
          value={margin === null ? '—' : money(margin)}
          emphasis={underwater ? 'loss' : margin !== null && margin > 0 ? 'gain' : undefined}
        />
      </dl>

      {underwater && (
        <div
          className="mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px]"
          style={{ background: 'var(--color-signal-wash)', border: '1px solid oklch(0.63 0.22 25 / 0.3)', color: 'var(--color-signal-text)' }}
        >
          ⚠ Cost basis exceeds asking price — this car loses money at the current number.
        </div>
      )}
    </div>
  )
}

function LegendRow({
  swatch,
  label,
  value,
  emphasis,
}: {
  swatch: string
  label: string
  value: string
  emphasis?: 'gain' | 'loss'
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block size-2.5 shrink-0 rounded-sm"
        style={{ background: swatch }}
      />
      <dt style={{ color: 'var(--color-ink-faint)' }}>{label}</dt>
      <dd
        className="tnum ml-auto font-semibold"
        style={{
          color:
            emphasis === 'loss' ? 'var(--color-signal-text)'
            : emphasis === 'gain' ? 'var(--color-margin-text)'
            : 'var(--color-ink)',
        }}
      >
        {value}
      </dd>
    </div>
  )
}
