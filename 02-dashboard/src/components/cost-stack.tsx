import { money } from '@/lib/format'

/**
 * The signature element: what a car cost to buy and to prepare, drawn against
 * what it is expected to fetch. Margin is the gap you can see rather than a
 * number you have to hunt for — and when the stack overruns the asking price,
 * the bar itself says so.
 */
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

  const pct = (value: number) => `${Math.max((value / span) * 100, 0)}%`

  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden bg-paper-edge" role="presentation">
        <div
          className="bg-ink"
          style={{ width: pct(acquisition) }}
          title={`Bought ${money(acquisition)}`}
        />
        {recon > 0 && (
          <div
            className="border-l-2 border-surface bg-signal"
            style={{ width: pct(recon) }}
            title={`Reconditioning ${money(recon)}`}
          />
        )}
        {margin !== null && margin > 0 && (
          <div
            className="border-l-2 border-surface bg-margin"
            style={{ width: pct(margin) }}
            title={`${targetLabel} ${money(margin)}`}
          />
        )}
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-4">
        <Row swatch="bg-ink" label="Bought" value={money(acquisition)} />
        <Row swatch="bg-signal" label="Recon" value={money(recon)} />
        <Row swatch="bg-paper-edge" label="Cost basis" value={money(basis)} />
        <Row
          swatch={underwater ? 'bg-signal' : 'bg-margin'}
          label={targetLabel}
          value={margin === null ? '—' : money(margin)}
          emphasis={underwater ? 'loss' : 'gain'}
        />
      </dl>

      {underwater && (
        <p className="mt-2 border-l-2 border-signal bg-signal-wash px-2.5 py-1.5 text-[12.5px]">
          Cost basis is above the asking price. This car loses money at the
          current number.
        </p>
      )}
    </div>
  )
}

function Row({
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
      <span aria-hidden className={`inline-block size-2 shrink-0 ${swatch}`} />
      <dt className="text-ink-soft">{label}</dt>
      <dd
        className={`tnum ml-auto ${
          emphasis === 'loss'
            ? 'text-signal'
            : emphasis === 'gain'
              ? 'text-margin'
              : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
