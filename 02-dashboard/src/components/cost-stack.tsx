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
  const total = Math.max(basis, target ?? basis) || 1
  const margin = target === null ? null : target - basis
  const underwater = margin !== null && margin < 0

  const pct = (v: number) => `${Math.max((v / total) * 100, 3).toFixed(2)}%`
  const breakevenPct = `${((basis / total) * 100).toFixed(2)}%`

  return (
    <div>
      {/* Segmented cost-stack bar */}
      <div className="cost-stack" aria-label="Vehicle cost breakdown">
        <div className="stack-acquisition" style={{ width: pct(acquisition) }}>
          <span>Acquisition · {money(acquisition)}</span>
        </div>
        {recon > 0 && (
          <div className="stack-recon" style={{ width: pct(recon) }}>
            <span>Recon · {money(recon)}</span>
          </div>
        )}
        {margin !== null && margin > 0 && (
          <div className="stack-margin" style={{ width: pct(margin) }}>
            <span>{targetLabel} · {money(margin)}</span>
          </div>
        )}
        {underwater && (
          <div className="stack-loss" style={{ width: pct(Math.abs(margin!)) }}>
            <span>Loss · {money(margin!)}</span>
          </div>
        )}
        {/* Breakeven marker */}
        <i className="breakeven" style={{ left: breakevenPct }}>
          <b>Breakeven</b>
        </i>
      </div>

      {/* Legend */}
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Acquisition" value={money(acquisition)} tone="text-capital" />
        <Metric label="Recon total" value={money(recon)} tone="text-recon" />
        <Metric label="Cost basis" value={money(basis)} tone="" />
        <Metric
          label={targetLabel}
          value={margin === null ? '—' : money(margin)}
          tone={underwater ? 'text-danger' : 'text-profit'}
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

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  const colorMap: Record<string, string> = {
    'text-capital': 'var(--color-blue-text)',
    'text-recon':   'var(--color-amber-text)',
    'text-profit':  'var(--color-margin-text)',
    'text-danger':  'var(--color-signal-text)',
    '':             'var(--color-ink)',
  }
  return (
    <div>
      <p className="section-label">{label}</p>
      <p className="money mt-2 text-base font-semibold" style={{ color: colorMap[tone] ?? 'var(--color-ink)' }}>{value}</p>
    </div>
  )
}
