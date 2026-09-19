export default function Loading() {
  return (
    <div className="space-y-6">
      {/* KPI tiles skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[var(--radius-card)] bg-paper-edge" />
        ))}
      </div>
      {/* Chart skeletons */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-[var(--radius-card)] bg-paper-edge" />
        <div className="h-56 animate-pulse rounded-[var(--radius-card)] bg-paper-edge" />
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-paper-edge lg:col-span-2" />
      </div>
    </div>
  )
}
