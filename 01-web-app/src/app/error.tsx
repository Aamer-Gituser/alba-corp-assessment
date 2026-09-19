"use client";

/**
 * The last line of defence. Anything the typed Result path did not catch —
 * a render fault, an unexpected shape — lands here with a way back.
 */
export default function ArchiveError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1120px] flex-col items-start justify-center gap-4 px-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-safelight">
        unrecoverable
      </span>
      <h1 className="font-display text-3xl text-emulsion">The catalogue could not be opened</h1>
      <p className="max-w-[52ch] text-sm leading-relaxed text-graphite">
        Something failed while composing this page. Retrying usually resolves it.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-sm border border-safelight/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-safelight transition-colors hover:bg-safelight hover:text-plate-black"
      >
        Try again
      </button>
    </div>
  );
}
