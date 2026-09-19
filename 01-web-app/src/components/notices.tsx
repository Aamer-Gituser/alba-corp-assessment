import Link from "next/link";

import { todayInArchiveTime } from "@/lib/dates";
import type { ApodError } from "@/lib/types";
import { describeError } from "@/lib/types";

/**
 * Failure and emptiness, written as directions rather than apologies.
 *
 * Each notice names what happened and offers the one action that resolves it,
 * because "no plate on this date" and "NASA is rate-limiting us" need different
 * responses from the reader even though both are a missing image.
 */
export function ErrorNotice({ error }: { error: ApodError }) {
  const { title, detail } = describeError(error);
  const today = todayInArchiveTime();

  return (
    <section className="animate-rise flex flex-col items-start gap-4 border border-plate-edge bg-plate-slate/40 p-8 sm:p-12">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-safelight">
        {error.kind.replace(/_/g, " ")}
      </span>
      <h2 className="font-display text-2xl text-emulsion sm:text-3xl">{title}</h2>
      <p className="max-w-[52ch] text-sm leading-relaxed text-graphite">{detail}</p>
      <Link
        href={`/?date=${today}`}
        className="mt-2 rounded-sm border border-safelight/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-safelight transition-colors hover:bg-safelight hover:text-plate-black"
      >
        Return to today&rsquo;s plate
      </Link>
    </section>
  );
}

/** Shown when a range came back with no plates at all. */
export function EmptyNotice({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-plate-edge p-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-graphite">
        {message}
      </p>
    </div>
  );
}
