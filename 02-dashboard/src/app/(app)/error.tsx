'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-[15px] font-semibold text-ink">Something went wrong.</p>
      <p className="max-w-sm text-[13px] text-ink-soft">
        {error.message || 'An unexpected error occurred. The data is safe — this is a display issue.'}
      </p>
      <button
        onClick={reset}
        className="rounded border border-rule bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-paper"
      >
        Try again
      </button>
    </div>
  )
}
