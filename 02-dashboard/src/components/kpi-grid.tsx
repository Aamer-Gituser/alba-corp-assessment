export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-liquid>
        {children}
      </div>
    </div>
  )
}
